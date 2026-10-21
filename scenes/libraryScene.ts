import { ellipsePath, linePath, paintFill, paintLine, paintShape, type Context } from "@/characters/paint"
import { drawRadi, type Point, type RadiLook } from "@/characters/radi"
import { bookwormRadiLook } from "@/characters/radiConcepts"
import { easeOut, mix, mixPoint, paintIris, radiScale, stageProgress } from "@/scenes/openingScene"

const OUTLINE = "#2b1d1a"
const WALL = "#f6e2bc"
const WOOD = "#e0a15a"
const WOOD_DARK = "#8d4e24"
const RUG = "#e25b86"
const NIGHT = "#241848"
const PLASTER = "#f3d7a2"
const BOOK_COLORS = ["#e23d4a", "#ffd23f", "#3ec6c6", "#7b5cff", "#5ec76a", "#ff8c42", "#f472b6", "#3d7eff"] as const

const FALL_START = 0.4
const FALL_END = 1.85
const SHAKE_SECONDS = 0.45
const SHAKE_STRENGTH = 11
const FLASH_SECONDS = 0.2
const IRIS_IN_END = 0.7

const CRASH_LOOK: RadiLook = { ...bookwormRadiLook, expression: "surprised" }
const GET_UP_START = 2.7
const GET_UP_END = 4.1
const CLEAN_SWEEP_SECONDS = 0.85
const CLEAN_SWEEPS = 3
const BACK_HANDS: readonly [Point, Point] = [[-14, -48], [14, -48]]
const SIDE_HANDS: readonly [Point, Point] = [[-16, -32], [16, -32]]

const mixHands = (from: readonly [Point, Point], to: readonly [Point, Point], amount: number): readonly [Point, Point] => [
  mixPoint(from[0], to[0], amount),
  mixPoint(from[1], to[1], amount),
]

const cleaningPose = (sceneSeconds: number) => {
  const sweep = (sceneSeconds - GET_UP_END) / CLEAN_SWEEP_SECONDS
  if (sweep < 0 || sweep >= CLEAN_SWEEPS) return { hands: SIDE_HANDS, brush: null, puff: 0, elbows: [0, 0] as const }
  const sweepIndex = Math.floor(sweep)
  const sweepT = sweep - sweepIndex
  const brushingLeft = sweepIndex % 2 === 0
  const across = sweepT < 0.7 ? sweepT / 0.7 : (1 - sweepT) / 0.3
  const brush = mixPoint(brushingLeft ? [-20, -46] : [20, -46], brushingLeft ? [6, -22] : [-6, -22], easeOut(Math.min(1, across)))
  const rest: Point = brushingLeft ? [16, -32] : [-16, -32]
  return {
    hands: (brushingLeft ? [brush, rest] : [rest, brush]) as const,
    brush,
    puff: Math.sin(Math.min(sweepT, 1) * Math.PI),
    elbows: (brushingLeft ? [9, 0] : [0, 9]) as const,
  }
}

const libraryLayout = (width: number, height: number) => ({
  scale: radiScale(width, height) * 1.15,
  floorY: height * 0.9,
  ceilingY: height * 0.16,
  landingX: width * 0.52,
})

type SpineMark = "stripe" | "dot" | "band" | "plain"
type ShelfOrnament = "plant" | "clock" | "none"

const drawBook = (context: Context, centerX: number, centerY: number, bookWidth: number, bookHeight: number, color: string, tilt: number, mark: SpineMark) => {
  context.save()
  context.translate(centerX, centerY)
  context.rotate(tilt)
  context.lineWidth = 2
  paintShape(context, color, (path) => path.roundRect(-bookWidth / 2, -bookHeight / 2, bookWidth, bookHeight, 2))
  paintLine(context, "rgba(255, 255, 255, 0.8)", Math.max(1.2, bookWidth * 0.1), linePath(-bookWidth * 0.28, -bookHeight / 2, -bookWidth * 0.28, bookHeight / 2))
  if (mark === "stripe") paintLine(context, "rgba(255, 255, 255, 0.85)", Math.max(1.4, bookWidth * 0.14), linePath(bookWidth * 0.08, -bookHeight * 0.34, bookWidth * 0.08, bookHeight * 0.34))
  if (mark === "dot") paintFill(context, "#fff6c8", ellipsePath(bookWidth * 0.08, -bookHeight * 0.16, Math.max(1.4, bookWidth * 0.16), Math.max(1.4, bookWidth * 0.16)))
  if (mark === "band") paintFill(context, "rgba(255, 255, 255, 0.9)", (path) => path.rect(-bookWidth / 2, -bookHeight * 0.08, bookWidth, Math.max(2, bookHeight * 0.14)))
  context.restore()
}

const drawPlant = (context: Context, centerX: number, shelfY: number) => {
  paintShape(context, "#e07a3d", (path) => {
    path.moveTo(centerX - 7, shelfY)
    path.lineTo(centerX + 7, shelfY)
    path.lineTo(centerX + 5, shelfY - 8)
    path.lineTo(centerX - 5, shelfY - 8)
    path.closePath()
  })
  paintFill(context, "#3aaa6a", ellipsePath(centerX - 6, shelfY - 14, 7, 5))
  paintFill(context, "#2f8f4e", ellipsePath(centerX + 5, shelfY - 13, 6, 4.5))
  paintFill(context, "#67d36a", ellipsePath(centerX, shelfY - 18, 5, 6))
}

const drawClock = (context: Context, centerX: number, centerY: number) => {
  paintShape(context, "#fff8ea", ellipsePath(centerX, centerY, 9, 9))
  paintLine(context, OUTLINE, 1.4, linePath(centerX, centerY, centerX, centerY - 5))
  paintLine(context, OUTLINE, 1.4, linePath(centerX, centerY, centerX + 4, centerY + 1))
}

const spineMark = (colorIndex: number): SpineMark => {
  const marks = ["stripe", "dot", "band", "plain"] as const
  return marks[colorIndex % marks.length] ?? "plain"
}

const drawBookcase = (context: Context, left: number, top: number, right: number, bottom: number, ornament: ShelfOrnament = "none") => {
  const caseWidth = right - left
  paintShape(context, WOOD_DARK, (path) => path.roundRect(left, top, caseWidth, bottom - top, 8))
  paintShape(context, WOOD, (path) => path.roundRect(left - 6, top - 8, caseWidth + 12, 12, 4))
  const rows = 5
  const innerLeft = left + 8
  const innerRight = right - 8
  const innerTop = top + 12
  const innerBottom = bottom - 8
  paintFill(context, "#6b3414", (path) => path.rect(innerLeft - 2, innerTop, innerRight - innerLeft + 4, innerBottom - innerTop))
  const caseSeed = Math.round(left / 10)
  for (let row = 0; row < rows; row += 1) {
    const rowTop = mix(innerTop, innerBottom, row / rows)
    const rowBottom = mix(innerTop, innerBottom, (row + 1) / rows)
    const shelfY = rowBottom - 6
    paintShape(context, WOOD, (path) => path.rect(innerLeft - 4, shelfY, innerRight - innerLeft + 8, 6))
    const ornamentHere = ornament === "plant" && row === 0 ? "plant" : ornament === "clock" && row === 1 ? "clock" : "none"
    const contentRight = ornamentHere === "none" ? innerRight : innerRight - 24
    let bookX = innerLeft
    let colorIndex = caseSeed + row * 5
    while (bookX < contentRight - 8) {
      if (colorIndex % 11 === 0) {
        bookX += 8
        colorIndex += 1
        continue
      }
      const standingHeight = (rowBottom - rowTop - 10) * (0.62 + (colorIndex % 5) * 0.08)
      const bookWidth = colorIndex % 6 === 0 ? 15 : 7 + (colorIndex % 3) * 3
      const lean = colorIndex % 7 === 0 ? 0.22 : 0
      if (colorIndex % 9 === 0) {
        const flatWidth = Math.min(22, contentRight - bookX)
        for (let layer = 0; layer < 3; layer += 1) {
          drawBook(context, bookX + flatWidth / 2, shelfY - 4 - layer * 5, flatWidth, 5, BOOK_COLORS[(colorIndex + layer) % BOOK_COLORS.length] ?? BOOK_COLORS[0], 0, "band")
        }
        bookX += flatWidth + 3
        colorIndex += 1
        continue
      }
      drawBook(
        context,
        bookX + bookWidth / 2,
        shelfY - standingHeight / 2,
        bookWidth,
        standingHeight,
        BOOK_COLORS[colorIndex % BOOK_COLORS.length] ?? BOOK_COLORS[0],
        lean,
        spineMark(colorIndex),
      )
      bookX += bookWidth + 2
      colorIndex += 1
    }
    if (ornamentHere === "plant") drawPlant(context, innerRight - 12, shelfY)
    if (ornamentHere === "clock") drawClock(context, innerRight - 12, shelfY - 12)
  }
}

const drawSign = (context: Context, centerX: number, centerY: number, width: number) => {
  const signWidth = Math.min(width * 0.22, 180)
  const signHeight = signWidth * 0.38
  paintShape(context, "#fff8ea", (path) => path.roundRect(centerX - signWidth / 2, centerY - signHeight / 2, signWidth, signHeight, 12))
  context.fillStyle = OUTLINE
  context.font = `${signWidth * 0.28}px "Comic Sans MS", "Comic Sans", cursive`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText("Library", centerX, centerY + signHeight * 0.04)
}

const drawLadder = (context: Context, left: number, floorY: number, top: number) => {
  paintLine(context, WOOD_DARK, 5, linePath(left, top, left - 10, floorY))
  paintLine(context, WOOD_DARK, 5, linePath(left + 28, top, left + 18, floorY))
  for (let rung = 0; rung < 5; rung += 1) {
    const rungY = mix(top + 16, floorY - 12, rung / 4)
    paintLine(context, WOOD, 4, linePath(left - 4, rungY, left + 24, rungY))
  }
}

const drawRoom = (context: Context, width: number, height: number, floorY: number, ceilingY: number) => {
  context.fillStyle = WALL
  context.fillRect(0, 0, width, height)
  paintFill(context, "#f1d3a4", (path) => path.rect(0, floorY, width, height - floorY))
  paintLine(context, OUTLINE, 3, linePath(0, floorY, width, floorY))
  for (let plank = 0; plank < 8; plank += 1) {
    const plankX = (width / 8) * plank
    paintLine(context, "rgba(120, 64, 28, 0.35)", 2, linePath(plankX, floorY, plankX + 30, height))
  }
  paintShape(context, RUG, ellipsePath(width * 0.52, floorY + 4, width * 0.14, height * 0.035))
  drawBookcase(context, width * 0.2, height * 0.34, width * 0.38, floorY, "plant")
  drawBookcase(context, width * 0.66, height * 0.34, width * 0.84, floorY, "clock")
  drawSign(context, width * 0.3, ceilingY + (height * 0.34 - ceilingY) * 0.42, width)
}

const HOLE_EDGE = [1, 0.74, 1.12, 0.9, 0.62, 1.08, 0.82, 1.18, 0.7, 0.96, 1.1, 0.66, 1.04, 0.86, 1.16, 0.72, 0.98, 0.8, 1.14, 0.68, 1.06, 0.88, 0.76, 1.12] as const

const HOLE_CENTER_Y = 0.5
const HOLE_INSIDE = "#5e2d12"

const holePlacement = (width: number, ceilingY: number, holeOpen: number) => ({
  holeX: width * 0.52,
  holeY: ceilingY * HOLE_CENTER_Y,
  radiusX: Math.min(width * 0.12, ceilingY * 1.5) * holeOpen,
  radiusY: ceilingY * 0.38 * holeOpen,
})

const clipToCeiling = (context: Context, width: number, ceilingY: number) => {
  const band = new Path2D()
  band.rect(0, 0, width, ceilingY)
  context.clip(band)
}

const crashMotion = (sceneSeconds: number, floorY: number, scale: number) => {
  const fall = stageProgress(sceneSeconds, FALL_START, FALL_END)
  const stand = easeOut(stageProgress(sceneSeconds, GET_UP_START, GET_UP_END))
  const feetY = mix(-40 * scale, floorY, fall ** 1.15)
  const tumble = (1 - easeOut(fall)) * Math.PI * -2.15
  const lie = easeOut(stageProgress(sceneSeconds, FALL_END - 0.4, FALL_END)) * (1 - stand)
  return {
    fall,
    feetY,
    spin: tumble + lie * (-Math.PI / 2),
    stand,
    lie,
    lowestY: feetY + Math.max(0, -Math.cos(tumble)) * 100 * scale,
  }
}

const ceilingBreak = (headY: number, ceilingY: number) => ({
  cracks: stageProgress(headY, ceilingY - 280, ceilingY - 20),
  holeOpen: easeOut(stageProgress(headY, ceilingY - 50, ceilingY + 260)),
  travel: Math.max(0, headY - (ceilingY - 50)),
})

const breakStartSeconds = (floorY: number, scale: number, ceilingY: number) => {
  for (let seconds = FALL_START; seconds < FALL_END; seconds += 0.01) {
    if (ceilingBreak(crashMotion(seconds, floorY, scale).lowestY, ceilingY).travel > 0) return seconds
  }
  return FALL_END
}

const traceHole = (path: Path2D, holeX: number, holeY: number, radiusX: number, radiusY: number) => {
  HOLE_EDGE.forEach((reach, index) => {
    const angle = ((index + ((index % 3) - 1) * 0.18) / HOLE_EDGE.length) * Math.PI * 2 - Math.PI / 2
    const x = holeX + Math.cos(angle) * radiusX * reach
    const y = holeY + Math.sin(angle) * radiusY * reach
    if (index === 0) path.moveTo(x, y)
    else path.lineTo(x, y)
  })
  path.closePath()
}

const ceilingCover = (width: number, ceilingY: number, holeOpen: number) => {
  const ceiling = new Path2D()
  ceiling.rect(0, 0, width, ceilingY)
  if (holeOpen > 0.02) {
    const { holeX, holeY, radiusX, radiusY } = holePlacement(width, ceilingY, holeOpen)
    traceHole(ceiling, holeX, holeY, radiusX, radiusY)
  }
  return ceiling
}

const drawCeilingBoards = (context: Context, width: number, ceilingY: number, holeOpen: number) => {
  context.save()
  clipToCeiling(context, width, ceilingY)
  context.clip(ceilingCover(width, ceilingY, holeOpen), "evenodd")
  context.fillStyle = WOOD_DARK
  context.fillRect(0, 0, width, ceilingY)
  for (let board = 0; board < 9; board += 1) {
    const boardX = (width / 9) * board
    paintLine(context, "rgba(255, 220, 170, 0.35)", 2, linePath(boardX, 0, boardX, ceilingY))
  }
  paintShape(context, WOOD, (path) => path.rect(0, ceilingY - 10, width, 10))
  context.restore()
}

const NIGHT_STARS = [
  { x: 0.32, y: -0.28, size: 1 },
  { x: -0.08, y: -0.42, size: 0.62 },
  { x: 0.46, y: 0.08, size: 0.55 },
  { x: 0.12, y: 0.34, size: 0.78 },
  { x: -0.42, y: 0.22, size: 0.5 },
  { x: 0.38, y: 0.4, size: 0.42 },
  { x: -0.22, y: 0.46, size: 0.66 },
] as const

const drawSparkle = (context: Context, centerX: number, centerY: number, size: number, spin: number) => {
  context.save()
  context.translate(centerX, centerY)
  context.rotate(spin)
  paintShape(context, "#fff8dc", (path) => {
    path.moveTo(0, -size)
    path.lineTo(size * 0.18, -size * 0.18)
    path.lineTo(size, 0)
    path.lineTo(size * 0.18, size * 0.18)
    path.lineTo(0, size)
    path.lineTo(-size * 0.18, size * 0.18)
    path.lineTo(-size, 0)
    path.lineTo(-size * 0.18, -size * 0.18)
    path.closePath()
  })
  paintFill(context, "#ffffff", ellipsePath(0, 0, size * 0.16, size * 0.16))
  context.restore()
}

const drawMoon = (context: Context, centerX: number, centerY: number, radius: number) => {
  const glow = context.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 2.2)
  glow.addColorStop(0, "rgba(255, 244, 196, 0.55)")
  glow.addColorStop(1, "rgba(255, 244, 196, 0)")
  paintFill(context, glow, ellipsePath(centerX, centerY, radius * 2.2, radius * 2.2))
  context.lineWidth = Math.max(2, radius * 0.08)
  paintShape(context, "#fff3c4", ellipsePath(centerX, centerY, radius, radius))
  paintFill(context, "#f3e2a4", ellipsePath(centerX - radius * 0.35, centerY - radius * 0.15, radius * 0.22, radius * 0.16))
  paintFill(context, "#f6e7b0", ellipsePath(centerX + radius * 0.28, centerY + radius * 0.32, radius * 0.14, radius * 0.1))
  for (const side of [-1, 1]) {
    paintFill(context, OUTLINE, ellipsePath(centerX + side * radius * 0.32, centerY - radius * 0.08, radius * 0.07, radius * 0.1))
    paintFill(context, "rgba(255, 170, 150, 0.55)", ellipsePath(centerX + side * radius * 0.52, centerY + radius * 0.22, radius * 0.14, radius * 0.08))
  }
  paintLine(context, OUTLINE, Math.max(1.4, radius * 0.07), (path) => path.arc(centerX, centerY + radius * 0.12, radius * 0.28, Math.PI * 0.15, Math.PI * 0.85))
}

const drawNightHole = (context: Context, width: number, ceilingY: number, holeOpen: number, time: number) => {
  if (holeOpen <= 0.02) return
  const { holeX, holeY, radiusX, radiusY } = holePlacement(width, ceilingY, holeOpen)
  const depth = ceilingY * 0.14 * holeOpen
  const hole = new Path2D()
  traceHole(hole, holeX, holeY, radiusX, radiusY)
  const woodLayer = new Path2D()
  traceHole(woodLayer, holeX, holeY + depth * 0.35, radiusX * 0.97, radiusY * 0.95)
  const sky = new Path2D()
  traceHole(sky, holeX, holeY + depth, radiusX * 0.93, radiusY * 0.88)
  context.save()
  clipToCeiling(context, width, ceilingY)
  context.clip(hole)
  context.fillStyle = PLASTER
  context.fill(hole)
  context.fillStyle = HOLE_INSIDE
  context.fill(woodLayer)
  context.fillStyle = NIGHT
  context.fill(sky)
  paintLine(context, OUTLINE, 2, (path) => path.addPath(sky))
  context.clip(sky)
  const moonRadius = Math.min(radiusX, radiusY) * 0.45
  drawMoon(context, holeX - radiusX * 0.3, holeY + depth * 0.5, moonRadius)
  NIGHT_STARS.forEach((star, index) => {
    const twinkle = 0.82 + Math.sin(time * 2.4 + index) * 0.18
    drawSparkle(context, holeX + star.x * radiusX, holeY + depth * 0.5 + star.y * radiusY, Math.max(6, moonRadius * 0.36 * star.size) * twinkle, index * 0.4)
  })
  context.restore()
}

const drawCeilingCracks = (context: Context, width: number, ceilingY: number, cracks: number) => {
  if (cracks <= 0) return
  context.save()
  context.clip(ceilingCover(width, ceilingY, 0))
  const { holeX, holeY } = holePlacement(width, ceilingY, 1)
  for (const crack of [{ angle: -0.6, length: 46 }, { angle: 0.35, length: 38 }, { angle: 1.1, length: 28 }, { angle: 2.5, length: 42 }, { angle: 3.5, length: 34 }] as const) {
    const reach = crack.length * cracks
    const bend = crack.angle + 0.35
    paintLine(context, OUTLINE, 2.6, (path) => {
      path.moveTo(holeX, holeY)
      path.quadraticCurveTo(
        holeX + Math.cos(bend) * reach * 0.55,
        holeY + Math.sin(bend) * reach * 0.4,
        holeX + Math.cos(crack.angle) * reach,
        holeY + Math.sin(crack.angle) * reach * 0.7,
      )
    })
  }
  context.restore()
}

const drawHoleRim = (context: Context, width: number, ceilingY: number, holeOpen: number) => {
  if (holeOpen <= 0.04) return
  const { holeX, holeY, radiusX, radiusY } = holePlacement(width, ceilingY, holeOpen)
  const hole = new Path2D()
  traceHole(hole, holeX, holeY, radiusX, radiusY)
  context.save()
  clipToCeiling(context, width, ceilingY)
  context.lineJoin = "round"
  context.lineWidth = 9
  context.strokeStyle = PLASTER
  context.stroke(hole)
  context.lineWidth = 3
  context.strokeStyle = OUTLINE
  context.stroke(hole)
  for (const crack of RIM_CRACKS) {
    const reach = crack.length * holeOpen
    const startX = holeX + Math.cos(crack.angle) * radiusX * 1.05
    const startY = holeY + Math.sin(crack.angle) * radiusY * 1.05
    const midX = startX + Math.cos(crack.angle) * reach * 0.5
    const midY = startY + Math.sin(crack.angle) * reach * 0.3
    const branchAngle = crack.angle + crack.branch
    paintLine(context, OUTLINE, 2.4, (path) => {
      path.moveTo(startX, startY)
      path.lineTo(midX, midY)
      path.lineTo(startX + Math.cos(crack.angle + 0.15) * reach, startY + Math.sin(crack.angle + 0.15) * reach * 0.6)
    })
    paintLine(context, OUTLINE, 1.8, linePath(midX, midY, midX + Math.cos(branchAngle) * reach * 0.45, midY + Math.sin(branchAngle) * reach * 0.3))
  }
  context.restore()
}

const drawHangingPlanks = (context: Context, width: number, height: number, ceilingY: number, floorY: number, holeOpen: number, sinceBreak: number) => {
  if (holeOpen <= 0.04) return
  const { holeX, holeY, radiusX, radiusY } = holePlacement(width, ceilingY, holeOpen)
  const hang = easeOut(stageProgress(holeOpen, 0.3, 1))
  for (const plank of HANGING_PLANKS) {
    const hangX = holeX + Math.cos(plank.angle) * radiusX * 0.92
    const hangY = holeY + Math.sin(plank.angle) * radiusY * 0.92
    const restY = mix(floorY + 6, height - 10, plank.rest) - plank.width / 2
    const landing = Math.sqrt((2 * (restY - hangY)) / DEBRIS_GRAVITY)
    const fallTime = Math.min(Math.max(0, sinceBreak - plank.drop), landing)
    const tilt = mix(mix(plank.from, plank.tilt, hang), Math.sign(plank.tilt) * Math.PI / 2, fallTime / landing)
    const anchorY = hangY + 0.5 * DEBRIS_GRAVITY * fallTime ** 2
    drawHangingPlank(context, hangX + plank.drift * fallTime, anchorY, plank.width, ceilingY * plank.length, tilt, plank.color)
  }
}

const RIM_CRACKS = [
  { angle: -0.5, length: 34, branch: 0.5 },
  { angle: 0.3, length: 26, branch: -0.6 },
  { angle: 1.3, length: 22, branch: 0.5 },
  { angle: 2.4, length: 30, branch: -0.5 },
  { angle: 3.3, length: 38, branch: 0.6 },
  { angle: 4.1, length: 24, branch: -0.5 },
  { angle: 5.2, length: 30, branch: 0.5 },
] as const

const HANGING_PLANKS = [
  { angle: -1.95, width: 14, length: 0.55, from: 1.6, tilt: 0.3, color: WOOD, drop: 0.7, drift: -60, rest: 0.35 },
  { angle: -1.2, width: 11, length: 0.42, from: -1.5, tilt: -0.2, color: WOOD_DARK, drop: 1.05, drift: 40, rest: 0.15 },
  { angle: -0.35, width: 9, length: 0.32, from: 1.3, tilt: -0.65, color: WOOD, drop: 0.85, drift: 70, rest: 0.5 },
  { angle: 3.55, width: 10, length: 0.36, from: -1.4, tilt: 0.75, color: WOOD_DARK, drop: 1.25, drift: -50, rest: 0.25 },
] as const

const drawHangingPlank = (context: Context, anchorX: number, anchorY: number, plankWidth: number, plankLength: number, tilt: number, color: string) => {
  context.save()
  context.translate(anchorX, anchorY)
  context.rotate(tilt)
  context.lineWidth = 2.5
  paintShape(context, color, (path) => {
    path.moveTo(-plankWidth / 2, -4)
    path.lineTo(plankWidth / 2, -4)
    path.lineTo(plankWidth / 2, plankLength * 0.78)
    path.lineTo(plankWidth * 0.2, plankLength)
    path.lineTo(-plankWidth * 0.05, plankLength * 0.84)
    path.lineTo(-plankWidth * 0.3, plankLength * 0.94)
    path.lineTo(-plankWidth / 2, plankLength * 0.7)
    path.closePath()
  })
  paintLine(context, "rgba(255, 220, 170, 0.5)", 1.5, linePath(-plankWidth * 0.1, 2, -plankWidth * 0.1, plankLength * 0.65))
  context.restore()
}

const debrisRandom = (index: number, salt: number) => {
  const wave = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return wave - Math.floor(wave)
}

const PLASTER_BITS = [PLASTER, "#e9c88c", "#fff1d2"] as const
const DEBRIS_COLORS = { splinter: [WOOD, WOOD_DARK, "#b8702f"], chunk: PLASTER_BITS, crumb: PLASTER_BITS } as const

const DEBRIS_SIZES = { splinter: [16, 30], chunk: [6, 13], crumb: [2, 4.5] } as const

const BREAK_DEBRIS = Array.from({ length: 34 }, (_, index) => {
  const kind = index < 10 ? "splinter" : index < 20 ? "chunk" : "crumb"
  const [smallest, largest] = DEBRIS_SIZES[kind]
  return {
    kind,
    spawn: debrisRandom(index, 1) - 0.5,
    direction: mix(-0.1, 1.1, debrisRandom(index, 2)) * Math.PI,
    speed: mix(140, 380, debrisRandom(index, 3)),
    spin: mix(-9, 9, debrisRandom(index, 4)),
    size: mix(smallest, largest, debrisRandom(index, 5)),
    delay: debrisRandom(index, 6) * 0.22,
    restDepth: debrisRandom(index, 7),
    color: DEBRIS_COLORS[kind][index % 3] ?? PLASTER,
  }
})

type DebrisPiece = (typeof BREAK_DEBRIS)[number]

const DEBRIS_GRAVITY = 1500

const drawDebrisPiece = (context: Context, piece: DebrisPiece, pieceX: number, pieceY: number, rotation: number) => {
  const { size } = piece
  if (piece.kind === "crumb") {
    paintFill(context, piece.color, ellipsePath(pieceX, pieceY, size, size))
    return
  }
  context.save()
  context.translate(pieceX, pieceY)
  context.rotate(rotation)
  context.lineWidth = 2
  paintShape(context, piece.color, (path) => {
    if (piece.kind === "splinter") {
      path.moveTo(-size / 2, -size * 0.12)
      path.lineTo(size * 0.3, -size * 0.14)
      path.lineTo(size / 2, 0)
      path.lineTo(size * 0.32, size * 0.12)
      path.lineTo(-size * 0.42, size * 0.14)
      path.lineTo(-size * 0.36, 0)
    } else {
      path.moveTo(-size, -size * 0.5)
      path.lineTo(size * 0.2, -size)
      path.lineTo(size, -size * 0.2)
      path.lineTo(size * 0.6, size * 0.8)
      path.lineTo(-size * 0.7, size * 0.6)
    }
    path.closePath()
  })
  context.restore()
}

const drawBreakDebris = (context: Context, width: number, height: number, ceilingY: number, floorY: number, sinceBreak: number) => {
  if (sinceBreak <= 0) return
  const { holeX, holeY, radiusX } = holePlacement(width, ceilingY, 1)
  for (const piece of BREAK_DEBRIS) {
    const flight = sinceBreak - piece.delay
    if (flight <= 0) continue
    const velocityX = Math.cos(piece.direction) * piece.speed
    const velocityY = Math.sin(piece.direction) * piece.speed
    const restY = mix(floorY + 2, height - 8, piece.restDepth * 0.7)
    const landing = (-velocityY + Math.sqrt(velocityY ** 2 + 2 * DEBRIS_GRAVITY * (restY - holeY))) / DEBRIS_GRAVITY
    const airTime = Math.min(flight, landing)
    const spun = piece.spin * airTime
    const rotation = flight >= landing && piece.kind === "splinter" ? Math.round(spun / Math.PI) * Math.PI : spun
    const pieceX = holeX + piece.spawn * radiusX * 1.5 + velocityX * airTime
    const pieceY = holeY + velocityY * airTime + 0.5 * DEBRIS_GRAVITY * airTime ** 2
    drawDebrisPiece(context, piece, pieceX, pieceY, rotation)
  }
}

const BREAK_PUFFS = [
  { offset: -0.6, drift: 30, size: 1 },
  { offset: -0.2, drift: 55, size: 1.3 },
  { offset: 0.25, drift: 45, size: 1.15 },
  { offset: 0.65, drift: 25, size: 0.9 },
  { offset: 0, drift: 80, size: 1.5 },
  { offset: -0.4, drift: 95, size: 0.8 },
  { offset: 0.45, drift: 100, size: 0.85 },
] as const

const drawBreakDust = (context: Context, width: number, ceilingY: number, sinceBreak: number) => {
  const billow = stageProgress(sinceBreak, 0, 1.6)
  if (billow <= 0 || billow >= 1) return
  const { holeX, holeY, radiusX, radiusY } = holePlacement(width, ceilingY, 1)
  const grow = easeOut(billow)
  for (const puff of BREAK_PUFFS) {
    const puffRadius = radiusY * puff.size * mix(0.4, 1.3, grow)
    const puffX = holeX + puff.offset * radiusX * mix(0.6, 1.2, grow)
    const puffY = holeY + radiusY * 0.6 + puff.drift * grow * 1.6
    paintFill(context, `rgba(243, 222, 182, ${0.6 * (1 - billow)})`, ellipsePath(puffX, puffY, puffRadius * 1.3, puffRadius))
  }
}

const BURST_RAYS = 12

const drawBreakBurst = (context: Context, width: number, ceilingY: number, sinceBreak: number) => {
  const burst = stageProgress(sinceBreak, 0, 0.35)
  if (burst <= 0 || burst >= 1) return
  const { holeX, holeY, radiusX } = holePlacement(width, ceilingY, 1)
  const glowRadius = radiusX * 1.6
  const glow = context.createRadialGradient(holeX, holeY, 0, holeX, holeY, glowRadius)
  glow.addColorStop(0, `rgba(255, 250, 225, ${0.8 * (1 - burst)})`)
  glow.addColorStop(1, "rgba(255, 250, 225, 0)")
  paintFill(context, glow, ellipsePath(holeX, holeY, glowRadius, glowRadius))
  const inner = mix(1.1, 1.6, burst)
  const outer = mix(1.4, 2.4, easeOut(burst))
  for (let ray = 0; ray < BURST_RAYS; ray += 1) {
    const angle = (ray / BURST_RAYS) * Math.PI * 2 + 0.2
    const rayX = Math.cos(angle) * radiusX
    const rayY = Math.sin(angle) * radiusX * 0.6
    paintLine(context, OUTLINE, 3 * (1 - burst) + 0.5, linePath(holeX + rayX * inner, holeY + rayY * inner, holeX + rayX * outer, holeY + rayY * outer))
  }
}

const drawDust = (context: Context, landingX: number, floorY: number, sceneSeconds: number) => {
  const puff = stageProgress(sceneSeconds, FALL_END, FALL_END + 0.8)
  if (puff <= 0) return
  for (let cloud = 0; cloud < 4; cloud += 1) {
    const spread = (cloud - 1.5) * 34 * puff
    paintFill(context, `rgba(232, 206, 164, ${0.45 * (1 - puff)})`, ellipsePath(landingX + spread, floorY - 8 - puff * 16, 28 + puff * 40, 10 + puff * 12))
  }
}

const drawCrashRadi = (context: Context, landingX: number, floorY: number, scale: number, time: number, sceneSeconds: number) => {
  const { fall, feetY, spin, stand, lie } = crashMotion(sceneSeconds, floorY, scale)
  const grounded = fall >= 1
  const flail = grounded ? 0 : Math.sin(time * 16)
  const cleaning = grounded && sceneSeconds >= GET_UP_END ? cleaningPose(sceneSeconds) : null
  const fallingHands: readonly [Point, Point] = [[-18 - flail * 6, -54], [18 + flail * 6, -48]]
  const settledHands = mixHands(BACK_HANDS, SIDE_HANDS, stand)
  if (fall > 0.62) paintFill(context, "rgba(80, 42, 20, 0.16)", ellipsePath(landingX - lie * 34 * scale, floorY, mix(22, 64, lie) * scale, mix(4, 8, lie) * scale))
  context.save()
  context.translate(landingX, feetY - 22 * scale * lie)
  context.rotate(spin)
  drawRadi(context, stand > 0.82 ? bookwormRadiLook : CRASH_LOOK, 0, 0, scale, {
    faceTurn: grounded ? 0 : flail * 0.2,
    legLifts: grounded ? [0, 0] : [7 + flail * 4, 7 - flail * 4],
    kneeBends: grounded ? [0, 0] : [3, 3],
    hands: cleaning ? cleaning.hands : mixHands(fallingHands, settledHands, Math.max(lie, grounded ? 1 : 0)),
    elbowBends: cleaning ? cleaning.elbows : [0, 0],
  })
  if (cleaning?.brush && cleaning.puff > 0.05) {
    const [brushX, brushY] = cleaning.brush
    paintFill(context, `rgba(232, 206, 164, ${0.55 * cleaning.puff})`, ellipsePath(brushX * scale, brushY * scale, 4.2 * scale, 2.4 * scale))
    paintFill(context, `rgba(255, 248, 230, ${0.4 * cleaning.puff})`, ellipsePath((brushX + 8) * scale, (brushY + 6) * scale, 2.6 * scale, 1.6 * scale))
  }
  context.restore()
}

export const drawLibraryScene = (context: Context, width: number, height: number, time: number, sceneSeconds: number) => {
  const { scale, floorY, ceilingY, landingX } = libraryLayout(width, height)
  const sinceImpact = sceneSeconds - FALL_END
  const { lowestY } = crashMotion(sceneSeconds, floorY, scale)
  const breaking = ceilingBreak(lowestY, ceilingY)
  const sinceBreak = sceneSeconds - breakStartSeconds(floorY, scale, ceilingY)
  const breakShake = breaking.travel > 0 && breaking.travel < 130 ? (1 - breaking.travel / 130) * 8 : 0
  const shake = Math.max(sinceImpact >= 0 ? (1 - stageProgress(sinceImpact, 0, SHAKE_SECONDS)) * SHAKE_STRENGTH : 0, breakShake)
  const flash = sinceImpact >= 0 ? 0.55 * (1 - stageProgress(sinceImpact, 0, FLASH_SECONDS)) : 0
  context.lineJoin = "round"
  context.lineCap = "round"
  context.lineWidth = 3
  context.strokeStyle = OUTLINE
  context.save()
  context.translate(Math.sin(time * 80) * shake, Math.cos(time * 66) * shake * 0.6)
  drawRoom(context, width, height, floorY, ceilingY)
  drawNightHole(context, width, ceilingY, breaking.holeOpen, time)
  drawCrashRadi(context, landingX, floorY, scale, time, sceneSeconds)
  drawCeilingBoards(context, width, ceilingY, breaking.holeOpen)
  drawCeilingCracks(context, width, ceilingY, breaking.holeOpen < 0.55 ? breaking.cracks : 0)
  drawHoleRim(context, width, ceilingY, breaking.holeOpen)
  drawHangingPlanks(context, width, height, ceilingY, floorY, breaking.holeOpen, sinceBreak)
  drawBreakBurst(context, width, ceilingY, sinceBreak)
  drawBreakDust(context, width, ceilingY, sinceBreak)
  drawBreakDebris(context, width, height, ceilingY, floorY, sinceBreak)
  drawBookcase(context, 12, ceilingY - 6, width * 0.2, floorY + 8)
  drawBookcase(context, width * 0.8, ceilingY - 6, width - 12, floorY + 8)
  drawLadder(context, width * 0.75, floorY, height * 0.36)
  drawDust(context, landingX, floorY, sceneSeconds)
  if (sinceImpact >= 0 && sinceImpact < 0.5) {
    const ring = stageProgress(sinceImpact, 0, 0.5)
    context.save()
    context.globalAlpha = 1 - ring
    paintLine(context, "#fff6e4", 4, ellipsePath(landingX, floorY, mix(12, 70, ring) * scale, mix(4, 14, ring) * scale))
    context.restore()
  }
  context.restore()
  if (flash > 0) paintFill(context, `rgba(255, 248, 230, ${flash})`, (path) => path.rect(0, 0, width, height))
  const fullRadius = Math.hypot(width, height)
  if (sceneSeconds < IRIS_IN_END) paintIris(context, width, height, landingX, floorY - 70 * scale, mix(0, fullRadius, stageProgress(sceneSeconds, 0, IRIS_IN_END) ** 2))
}
