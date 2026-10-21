import { ellipsePath, linePath, paintLine, paintShape, type Context } from "@/characters/paint"
import {
  HAIR,
  HAIR_HIGHLIGHT,
  HAIR_STRAND,
  OUTLINE,
  OUTLINE_WIDTH,
  SKIN,
  WHITE,
  decorationFor,
  drawTorso,
  paintTube,
  shadeIf,
  type Point,
  type RadiLook,
  type RadiMotion,
} from "@/characters/radi"

const SIDES = [-1, 1] as const
const CLIMB_HANDS: readonly [Point, Point] = [[-11, -56], [11, -56]]

const drawBackHair = (context: Context, isPolished: boolean) => {
  paintShape(context, HAIR, (path) => {
    path.moveTo(-26, -52)
    path.quadraticCurveTo(-31, -64, -27, -78)
    path.bezierCurveTo(-28, -104, 28, -104, 27, -78)
    path.quadraticCurveTo(31, -64, 26, -52)
    path.quadraticCurveTo(0, -48, -26, -52)
    path.closePath()
  }, shadeIf(isPolished))
  if (isPolished) {
    paintLine(context, HAIR_HIGHLIGHT, 1.4, (path) => {
      path.moveTo(-10, -92)
      path.quadraticCurveTo(0, -96, 10, -92)
    })
    paintLine(context, HAIR_STRAND, 0.7, (path) => {
      path.moveTo(-16, -72)
      path.quadraticCurveTo(-18, -60, -14, -54)
    })
    paintLine(context, HAIR_STRAND, 0.7, (path) => {
      path.moveTo(16, -72)
      path.quadraticCurveTo(18, -60, 14, -54)
    })
  }
}

const drawBackHead = (context: Context, isPolished: boolean) => {
  for (const side of SIDES) paintShape(context, SKIN, ellipsePath(side * 22.5, -66, 4, 5), shadeIf(isPolished))
  paintShape(context, SKIN, ellipsePath(0, -70, 21, 22), shadeIf(isPolished))
  paintShape(context, SKIN, (path) => path.roundRect(-6, -50, 12, 6, 3), shadeIf(isPolished))
}

const drawBackGlasses = (context: Context) => {
  for (const side of SIDES) {
    paintLine(context, OUTLINE, 1.2, linePath(side * 18, -68.2, side * 23.2, -67))
    paintLine(context, OUTLINE, 1.5, linePath(side * 23, -67.2, side * 23, -63.5))
  }
}

const drawBackShorts = (context: Context, look: RadiLook, isPolished: boolean) => {
  paintShape(context, look.bottom.color, (path) => {
    path.moveTo(-10, -32)
    path.lineTo(10, -32)
    path.lineTo(11, -18)
    path.quadraticCurveTo(0, -16, -11, -18)
    path.closePath()
  }, { ...shadeIf(isPolished), decorateInside: decorationFor(look.bottom.pattern) })
}

const drawBackLegs = (context: Context, legLifts: readonly [number, number], kneeBends: readonly [number, number], isPolished: boolean) => {
  SIDES.forEach((side, index) => {
    const legX = side * 5
    context.save()
    context.translate(0, -legLifts[index])
    paintTube(context, SKIN, 6, (path) => {
      path.moveTo(legX, -19)
      path.lineTo(legX + side * kneeBends[index], -12.5)
      path.lineTo(legX, -6)
    }, isPolished)
    paintShape(context, WHITE, ellipsePath(side * 6, -3, 5.5, 3.5), shadeIf(isPolished))
    paintLine(context, OUTLINE, 0.6, linePath(side * 6 - 1.6, -5.3, side * 6 + 1.6, -3.7))
    paintLine(context, OUTLINE, 0.6, linePath(side * 6 + 1.6, -5.3, side * 6 - 1.6, -3.7))
    context.restore()
  })
}

const drawBackArms = (context: Context, hands: readonly [Point, Point], elbowBends: readonly [number, number], isPolished: boolean) => {
  SIDES.forEach((side, index) => {
    const [handX, handY] = hands[index]
    const shoulderX = side * 8.5
    const shoulderY = -42.5
    const reach = Math.hypot(handX - shoulderX, handY - shoulderY) || 1
    const bend = elbowBends[index] / reach
    const elbowX = (shoulderX + handX) / 2 + side * (handY - shoulderY) * bend
    const elbowY = (shoulderY + handY) / 2 - side * (handX - shoulderX) * bend
    paintTube(context, SKIN, 4.5, (path) => {
      path.moveTo(shoulderX, shoulderY)
      path.lineTo(elbowX, elbowY)
      path.lineTo(handX, handY)
    }, isPolished)
    paintShape(context, SKIN, ellipsePath(handX, handY, 2.8, 2.8), shadeIf(isPolished))
  })
}

export const drawRadiBack = (context: Context, look: RadiLook, feetX: number, feetY: number, scale: number, motion: Partial<RadiMotion> = {}) => {
  const isPolished = look.polished === true
  const { legLifts = [0, 0], kneeBends = [0, 0], hands = CLIMB_HANDS, elbowBends = [0, 0], hideLegs = false } = motion
  context.save()
  context.translate(feetX, feetY)
  context.scale(scale, scale)
  context.lineJoin = "round"
  context.lineCap = "round"
  context.lineWidth = OUTLINE_WIDTH
  context.strokeStyle = OUTLINE
  if (!hideLegs) drawBackLegs(context, legLifts, kneeBends, isPolished)
  drawBackShorts(context, look, isPolished)
  drawTorso(context, { ...look.top, label: undefined }, isPolished)
  drawBackHead(context, isPolished)
  drawBackHair(context, isPolished)
  if (look.extras.includes("readingGlasses")) drawBackGlasses(context)
  drawBackArms(context, hands, elbowBends, isPolished)
  context.restore()
}
