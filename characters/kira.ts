import { ellipsePath, linePath, paintFill, paintLine, paintShade, paintShape, type BuildPath, type Context, type DecorateInside } from "@/characters/paint"
import { BLUSH, OUTLINE, OUTLINE_WIDTH, PUPIL, SHADE, TONGUE, WHITE, curvesPath, paintTube } from "@/characters/radi"

const FUR = "#fbfaf6"
const FAR_FUR = "#e4e0d8"
const SPOT = "#2a2522"
const SIDE_SHIFT_UNITS = 7
const SPOTS_ON_SIDE_BODY = [[-28, -30, 1.6, 1.4], [-6, -29, 1.3, 1.1], [-22, -34, 1.1, 1], [2, -37, 1.2, 1.1], [-33, -35, 1, 0.9]] as const
const SPOTS_ON_FRONT_CHEST = [[-5, -28, 1.4, 1.2], [6, -22, 1.2, 1], [2, -31, 1, 0.9]] as const

type DrawKira = (context: Context) => void

const drawInUnits = (context: Context, feetX: number, feetY: number, scale: number, drawKira: DrawKira) => {
  context.save()
  context.translate(feetX, feetY)
  context.scale(scale, scale)
  context.lineJoin = "round"
  context.lineCap = "round"
  context.lineWidth = OUTLINE_WIDTH
  context.strokeStyle = OUTLINE
  drawKira(context)
  context.restore()
}

const paintInside = (context: Context, buildPath: BuildPath, decorateInside: DecorateInside) => {
  const path = new Path2D()
  buildPath(path)
  context.save()
  context.clip(path)
  decorateInside(context)
  context.restore()
}

const paintFurShape = (context: Context, fill: string, buildPath: BuildPath, decorateInside?: DecorateInside) =>
  paintShape(context, fill, buildPath, { decorateInside, shade: SHADE })

const drawTongue = (context: Context, centerX: number, topY: number) => {
  paintFurShape(context, TONGUE, (path) => {
    path.moveTo(centerX - 3, topY)
    path.quadraticCurveTo(centerX, topY - 0.8, centerX + 3, topY)
    path.quadraticCurveTo(centerX + 3.6, topY + 7.6, centerX, topY + 8)
    path.quadraticCurveTo(centerX - 3.6, topY + 7.6, centerX - 3, topY)
    path.closePath()
  })
  paintLine(context, OUTLINE, 0.6, linePath(centerX, topY + 0.8, centerX, topY + 5.5))
}

const paintSpots = (context: Context, spots: readonly (readonly [number, number, number, number])[]) => {
  for (const [spotX, spotY, radiusX, radiusY] of spots) paintFill(context, SPOT, ellipsePath(spotX, spotY, radiusX, radiusY))
}

const drawLeg = (context: Context, fill: string, buildLeg: BuildPath, pawX: number, pawRadius: number) => {
  paintTube(context, fill, 5, buildLeg, true)
  paintFurShape(context, fill, ellipsePath(pawX, -2.4, pawRadius, pawRadius * 0.68))
}

const drawEye = (context: Context, centerX: number, centerY: number) => {
  paintFurShape(context, WHITE, ellipsePath(centerX, centerY, 3.5, 4.3))
  paintFill(context, PUPIL, ellipsePath(centerX + 0.3, centerY + 0.4, 2.7, 3.5))
  paintFill(context, WHITE, ellipsePath(centerX - 0.7, centerY - 1.2, 1, 1.2))
  paintFill(context, WHITE, ellipsePath(centerX + 1.1, centerY + 1.6, 0.5, 0.5))
}

const drawNose = (context: Context, centerX: number, centerY: number, radiusX: number, radiusY: number) => {
  paintFurShape(context, SPOT, ellipsePath(centerX, centerY, radiusX, radiusY))
  paintFill(context, "rgba(255, 255, 255, 0.55)", ellipsePath(centerX - radiusX * 0.35, centerY - radiusY * 0.35, radiusX * 0.3, radiusY * 0.22))
}

const sideBodyPath: BuildPath = (path) => path.roundRect(-36, -40, 42, 16, 8)
const sideNeckPath = linePath(0, -34, 8, -46)
const sideSkullPath = ellipsePath(12, -52, 15, 13.5)
const sideMuzzlePath = ellipsePath(28.5, -46.5, 12, 6.2)

const drawSideBodyAndHead = (context: Context) => {
  paintLine(context, OUTLINE, 10 + OUTLINE_WIDTH * 2, sideNeckPath)
  for (const furPath of [sideBodyPath, sideSkullPath, sideMuzzlePath]) paintLine(context, OUTLINE, OUTLINE_WIDTH * 2, furPath)
  paintLine(context, FUR, 10, sideNeckPath)
  for (const furPath of [sideBodyPath, sideSkullPath, sideMuzzlePath]) {
    paintFill(context, FUR, furPath)
    paintShade(context, SHADE, furPath)
  }
  paintInside(context, sideBodyPath, (bodyContext) => {
    paintFill(bodyContext, SPOT, ellipsePath(-15, -40.5, 10, 5.5))
    paintSpots(bodyContext, SPOTS_ON_SIDE_BODY)
  })
  paintSpots(context, [[31, -45, 0.5, 0.5], [33.5, -46.5, 0.5, 0.5], [29, -47.5, 0.5, 0.5], [14.5, -62.5, 1.3, 1.1]])
}

export const drawKiraSide = (context: Context, feetX: number, feetY: number, scale: number) => {
  drawInUnits(context, feetX - SIDE_SHIFT_UNITS * scale, feetY, scale, (kiraContext) => {
    drawLeg(kiraContext, FAR_FUR, curvesPath([[-27, -30, -29.2, -15, -26.4, -3.5]]), -25.4, 3.3)
    drawLeg(kiraContext, FAR_FUR, curvesPath([[1, -30, 1.6, -15, 1, -3.5]]), 2.6, 3.3)
    drawLeg(kiraContext, FUR, curvesPath([[-31, -30, -33.2, -15, -30.4, -3.5]]), -29.4, 3.3)
    drawLeg(kiraContext, FUR, curvesPath([[-3, -30, -2.4, -15, -3, -3.5]]), -1.4, 3.3)
    paintSpots(kiraContext, [[-31.8, -18, 1.2, 1], [-2.8, -12, 1, 0.9]])
    paintFurShape(kiraContext, FUR, (path) => {
      path.moveTo(-35, -38.5)
      path.quadraticCurveTo(-42, -40.5, -48.5, -48)
      path.quadraticCurveTo(-42, -37, -35.5, -33.5)
      path.closePath()
    })
    drawSideBodyAndHead(kiraContext)
    paintFurShape(kiraContext, SPOT, (path) => {
      path.moveTo(8, -63)
      path.quadraticCurveTo(-1, -64, -0.5, -52)
      path.quadraticCurveTo(0, -45.5, 4, -46.5)
      path.quadraticCurveTo(7.5, -54, 11, -61)
      path.closePath()
    })
    drawEye(kiraContext, 18, -54.5)
    paintFill(kiraContext, BLUSH, ellipsePath(20, -47.5, 2.6, 1.6))
    drawNose(kiraContext, 39.5, -48.8, 2.6, 2.1)
    drawTongue(kiraContext, 33, -43.6)
    paintLine(kiraContext, OUTLINE, 0.9, curvesPath([[38.5, -45.5, 33, -41.5, 26, -43.5]]))
  })
}

const frontSkullPath = ellipsePath(0, -52, 17, 14.5)
const frontMuzzlePath = ellipsePath(0, -43, 10, 8)

const frontEarPath = (side: number): BuildPath => (path) => {
  path.moveTo(side * 11, -63)
  path.quadraticCurveTo(side * 24, -64, side * 22.5, -50)
  path.quadraticCurveTo(side * 21.5, -42, side * 16.5, -43.5)
  path.quadraticCurveTo(side * 14, -53, side * 6.5, -62)
  path.closePath()
}

export const drawKiraFront = (context: Context, feetX: number, feetY: number, scale: number) => {
  drawInUnits(context, feetX, feetY, scale, (kiraContext) => {
    paintFurShape(kiraContext, FUR, (path) => {
      path.moveTo(7, -29)
      path.quadraticCurveTo(14, -32, 19, -41)
      path.quadraticCurveTo(14.5, -27, 8, -24)
      path.closePath()
    })
    for (const side of [-1, 1]) drawLeg(kiraContext, FAR_FUR, linePath(side * 9.5, -22, side * 10, -3.5), side * 10, 3.2)
    paintFurShape(kiraContext, FUR, ellipsePath(0, -26, 11.5, 10.5), (chestContext) => paintSpots(chestContext, SPOTS_ON_FRONT_CHEST))
    for (const side of [-1, 1]) drawLeg(kiraContext, FUR, linePath(side * 5, -24, side * 5.5, -3.5), side * 5.5, 3.6)
    paintSpots(kiraContext, [[-5.2, -13, 1.1, 1], [5.6, -9, 1, 0.9]])

    for (const headPath of [frontSkullPath, frontMuzzlePath]) paintLine(kiraContext, OUTLINE, OUTLINE_WIDTH * 2, headPath)
    paintFill(kiraContext, FUR, frontSkullPath)
    paintShade(kiraContext, SHADE, frontSkullPath)
    paintInside(kiraContext, frontSkullPath, (skullContext) => {
      paintFill(skullContext, SPOT, ellipsePath(-7.5, -53, 6.5, 6))
      paintFill(skullContext, SPOT, ellipsePath(6, -61, 1.6, 1.3))
    })
    paintFill(kiraContext, FUR, frontMuzzlePath)
    paintShade(kiraContext, SHADE, frontMuzzlePath)
    for (const side of [-1, 1]) paintFurShape(kiraContext, SPOT, frontEarPath(side))

    for (const side of [-1, 1]) {
      drawEye(kiraContext, side * 7.5, -53)
      paintFill(kiraContext, BLUSH, ellipsePath(side * 12, -46.5, 2.8, 1.7))
      paintSpots(kiraContext, [[side * 4.5, -44, 0.5, 0.5], [side * 6, -42.5, 0.45, 0.45]])
    }
    drawNose(kiraContext, 0, -46.8, 3.2, 2.3)
    drawTongue(kiraContext, 0, -42.4)
    paintLine(kiraContext, OUTLINE, 0.9, curvesPath([[0, -44.5, -0.5, -42, -3.8, -42.6], [0, -44.5, 0.5, -42, 3.8, -42.6]]))
  })
}
