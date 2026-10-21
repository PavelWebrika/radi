import { ellipsePath, linePath, paintFill, paintLine, paintShape, type Context } from "@/characters/paint"
import { drawRadi, type RadiLook } from "@/characters/radi"
import { nightClubRadiLook } from "@/characters/radiConcepts"
import { easeOut, mix, paintIris, radiScale, stageProgress } from "@/scenes/openingScene"

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
const SETTLE_END = 2.5
const SHAKE_SECONDS = 0.45
const SHAKE_STRENGTH = 11
const FLASH_SECONDS = 0.2
const IRIS_IN_END = 0.7

const CRASH_LOOK: RadiLook = { ...nightClubRadiLook, expression: "surprised" }

const FLYING_BOOKS = [
  { angle: 0.4, speed: 1.15, spin: 7, width: 16, height: 22, color: BOOK_COLORS[0] },
  { angle: 1.1, speed: 0.9, spin: -5, width: 14, height: 20, color: BOOK_COLORS[1] },
  { angle: 1.8, speed: 1.25, spin: 6, width: 18, height: 12, color: BOOK_COLORS[2] },
  { angle: 2.4, speed: 1, spin: -8, width: 13, height: 21, color: BOOK_COLORS[3] },
  { angle: 2.9, speed: 1.35, spin: 4, width: 17, height: 11, color: BOOK_COLORS[4] },
  { angle: 3.6, speed: 0.85, spin: -6, width: 15, height: 22, color: BOOK_COLORS[5] },
  { angle: 4.4, speed: 1.1, spin: 9, width: 12, height: 19, color: BOOK_COLORS[6] },
  { angle: 5.2, speed: 1.3, spin: -4, width: 18, height: 13, color: BOOK_COLORS[7] },
] as const

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

const drawGlobe = (context: Context, centerX: number, floorY: number, roll: number) => {
  const globeX = centerX + roll
  paintShape(context, WOOD_DARK, (path) => {
    path.moveTo(globeX - 16, floorY)
    path.lineTo(globeX + 16, floorY)
    path.lineTo(globeX + 8, floorY - 16)
    path.lineTo(globeX - 8, floorY - 16)
    path.closePath()
  })
  paintShape(context, "#7ec8f0", ellipsePath(globeX, floorY - 34, 16, 16), {
    decorateInside: (globeContext) => {
      paintFill(globeContext, "#3aaa6a", ellipsePath(globeX - 4, floorY - 36, 7, 5))
      paintFill(globeContext, "#3aaa6a", ellipsePath(globeX + 6, floorY - 30, 4, 3))
    },
  })
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

const HOLE_WOBBLE = [1.02, 0.72, 1.18, 0.8, 1.24, 0.7, 1.1, 0.84, 1.2, 0.76, 1.14, 0.68, 1.22, 0.86, 1.08, 0.78] as const

const HOLE_CENTER_Y = 0.78

const holePlacement = (width: number, ceilingY: number, holeOpen: number) => ({
  holeX: width * 0.52,
  holeY: ceilingY * HOLE_CENTER_Y,
  radiusX: Math.min(width * 0.11, ceilingY * 1.35) * holeOpen,
  radiusY: ceilingY * 0.62 * holeOpen,
})

const crashMotion = (sceneSeconds: number, floorY: number, scale: number, time: number) => {
  const fall = stageProgress(sceneSeconds, FALL_START, FALL_END)
  const settle = easeOut(stageProgress(sceneSeconds, FALL_END, SETTLE_END))
  const rebound = Math.sin(stageProgress(sceneSeconds, FALL_END, SETTLE_END) * Math.PI) * (1 - settle) * 34 * scale
  const idle = sceneSeconds > SETTLE_END ? Math.sin(time * 2.2) * 1.4 * scale : 0
  const feetY = mix(-40 * scale, floorY, fall ** 1.15) - rebound - idle
  const spin = (1 - easeOut(fall)) * Math.PI * -2.15 + (1 - settle) * 0.4
  return {
    fall,
    feetY,
    spin,
    lowestY: feetY + Math.max(0, -Math.cos(spin)) * 100 * scale,
    squash: Math.sin(stageProgress(sceneSeconds, FALL_END, FALL_END + 0.28) * Math.PI),
    flail: Math.sin(time * 16),
  }
}

const ceilingBreak = (headY: number, ceilingY: number) => ({
  cracks: stageProgress(headY, ceilingY - 280, ceilingY - 20),
  holeOpen: easeOut(stageProgress(headY, ceilingY - 50, ceilingY + 260)),
  travel: Math.max(0, headY - (ceilingY - 50)),
})

const traceHole = (path: Path2D, holeX: number, holeY: number, radiusX: number, radiusY: number) => {
  HOLE_WOBBLE.forEach((wobble, index) => {
    const angle = (index / HOLE_WOBBLE.length) * Math.PI * 2 - Math.PI / 2
    const x = holeX + Math.cos(angle) * radiusX * wobble
    const y = holeY + Math.sin(angle) * radiusY * wobble
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
  const ceiling = ceilingCover(width, ceilingY, holeOpen)
  context.fillStyle = WOOD_DARK
  context.fill(ceiling, "evenodd")
  context.save()
  context.clip(ceiling, "evenodd")
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
  const hole = new Path2D()
  traceHole(hole, holeX, holeY, radiusX, radiusY)
  context.fillStyle = NIGHT
  context.fill(hole)
  context.save()
  context.clip(hole)
  const moonRadius = Math.min(radiusX, radiusY) * 0.34
  drawMoon(context, holeX - radiusX * 0.28, holeY - radiusY * 0.08, moonRadius)
  NIGHT_STARS.forEach((star, index) => {
    const twinkle = 0.82 + Math.sin(time * 2.4 + index) * 0.18
    drawSparkle(context, holeX + star.x * radiusX, holeY + star.y * radiusY, Math.max(7, moonRadius * 0.42 * star.size) * twinkle, index * 0.4)
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
  context.lineJoin = "round"
  context.lineWidth = 10
  context.strokeStyle = PLASTER
  context.stroke(hole)
  context.lineWidth = 3.5
  context.strokeStyle = OUTLINE
  context.stroke(hole)
  const fullHole = holePlacement(width, ceilingY, 1)
  for (const crack of [{ angle: -0.7, length: 36 }, { angle: 0.45, length: 28 }, { angle: 1.7, length: 32 }, { angle: 2.6, length: 40 }, { angle: 3.7, length: 30 }] as const) {
    const startX = holeX + Math.cos(crack.angle) * fullHole.radiusX * holeOpen
    const startY = holeY + Math.sin(crack.angle) * fullHole.radiusY * holeOpen
    paintLine(context, OUTLINE, 2.4, linePath(startX, startY, startX + Math.cos(crack.angle) * crack.length, startY + Math.sin(crack.angle) * crack.length * 0.75))
  }
  const hang = easeOut(stageProgress(holeOpen, 0.35, 1))
  context.save()
  context.translate(holeX + radiusX * 0.12, holeY - radiusY * 0.9)
  context.rotate(mix(-1.15, 0.45, hang))
  paintShape(context, WOOD, (path) => path.roundRect(-8, 0, 16, 28, 2))
  context.restore()
}

const BREAK_SHARDS = [
  { angle: 0.35, speed: 1.2, spin: 5, width: 26, height: 11, color: WOOD_DARK },
  { angle: 0.9, speed: 0.85, spin: -4, width: 18, height: 14, color: PLASTER },
  { angle: 1.45, speed: 1.15, spin: 6, width: 22, height: 10, color: WOOD },
  { angle: 2.05, speed: 0.95, spin: -5, width: 16, height: 13, color: PLASTER },
  { angle: 2.6, speed: 1.25, spin: 4, width: 24, height: 9, color: WOOD_DARK },
  { angle: 1.15, speed: 0.7, spin: -7, width: 14, height: 12, color: PLASTER },
] as const

const drawBreakShards = (context: Context, width: number, ceilingY: number, floorY: number, travel: number) => {
  if (travel <= 2) return
  const { holeX, holeY } = holePlacement(width, ceilingY, 1)
  for (const shard of BREAK_SHARDS) {
    const burst = Math.min(1, travel / 150)
    const distance = shard.speed * 150 * burst
    const gravity = Math.min(floorY - holeY - 12, (travel / 80) ** 2 * 200)
    const shardX = holeX + Math.cos(shard.angle) * distance
    const shardY = Math.min(floorY - shard.height, holeY + Math.sin(shard.angle) * distance * 0.4 + gravity)
    context.save()
    context.translate(shardX, shardY)
    context.rotate(shard.spin * Math.min(travel * 0.012, 2.4))
    paintShape(context, shard.color, (path) => path.roundRect(-shard.width / 2, -shard.height / 2, shard.width, shard.height, 2))
    context.restore()
  }
}

const drawBreakDust = (context: Context, width: number, ceilingY: number, holeOpen: number, travel: number) => {
  const puff = holeOpen * (1 - Math.min(1, travel / 170))
  if (puff <= 0) return
  const { holeX, holeY, radiusX, radiusY } = holePlacement(width, ceilingY, Math.max(holeOpen, 0.35))
  paintFill(context, `rgba(243, 215, 162, ${0.55 * puff})`, ellipsePath(holeX, holeY + radiusY * 0.2, radiusX * 0.85, radiusY * 0.55))
}

const drawFlyingBooks = (context: Context, landingX: number, floorY: number, sceneSeconds: number) => {
  if (sceneSeconds < FALL_END) return
  const flightTime = sceneSeconds - FALL_END
  for (const book of FLYING_BOOKS) {
    const bookWidth = book.width * 1.7
    const bookHeight = book.height * 1.7
    const distance = book.speed * 190 * Math.min(flightTime, 0.55)
    const rise = Math.sin(Math.min(flightTime, 0.7) * 4.2) * 90 * book.speed
    const drop = flightTime * flightTime * 320
    const restY = floorY - bookHeight / 2
    const bookX = landingX + Math.cos(book.angle) * distance
    const bookY = Math.min(restY, restY - rise + drop)
    const tilt = bookY >= restY - 1 ? book.angle : flightTime * book.spin
    drawBook(context, bookX, bookY, bookWidth, bookHeight, book.color, tilt, "plain")
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
  const { fall, feetY, spin, squash, flail } = crashMotion(sceneSeconds, floorY, scale, time)
  const hasLanded = fall >= 1
  if (fall > 0.62) paintFill(context, "rgba(80, 42, 20, 0.16)", ellipsePath(landingX, floorY, 22 * scale * (1 + squash * 0.4), 4 * scale))
  context.save()
  context.translate(landingX, feetY)
  context.rotate(spin)
  context.scale(1 + squash * 0.22, 1 - squash * 0.32)
  drawRadi(context, CRASH_LOOK, 0, 0, scale, {
    faceTurn: hasLanded ? Math.sin(time * 1.4) * 0.08 : flail * 0.2,
    legLifts: hasLanded ? [6, 5] : [7 + flail * 4, 7 - flail * 4],
    kneeBends: hasLanded ? [11, 10] : [3, 3],
    hands: hasLanded ? [[-30, -28], [28, -30]] : [[-18 - flail * 6, -54], [18 + flail * 6, -48]],
  })
  context.restore()
}

export const drawLibraryScene = (context: Context, width: number, height: number, time: number, sceneSeconds: number) => {
  const { scale, floorY, ceilingY, landingX } = libraryLayout(width, height)
  const sinceImpact = sceneSeconds - FALL_END
  const { lowestY } = crashMotion(sceneSeconds, floorY, scale, time)
  const breaking = ceilingBreak(lowestY, ceilingY)
  const breakShake = breaking.travel > 0 && breaking.travel < 130 ? (1 - breaking.travel / 130) * 8 : 0
  const shake = Math.max(sinceImpact >= 0 ? (1 - stageProgress(sinceImpact, 0, SHAKE_SECONDS)) * SHAKE_STRENGTH : 0, breakShake)
  const flash = sinceImpact >= 0 ? 0.55 * (1 - stageProgress(sinceImpact, 0, FLASH_SECONDS)) : 0
  const globeRoll = easeOut(stageProgress(sceneSeconds, FALL_END, SETTLE_END)) * 28
  context.lineJoin = "round"
  context.lineCap = "round"
  context.lineWidth = 3
  context.strokeStyle = OUTLINE
  context.save()
  context.translate(Math.sin(time * 80) * shake, Math.cos(time * 66) * shake * 0.6)
  drawRoom(context, width, height, floorY, ceilingY)
  drawNightHole(context, width, ceilingY, breaking.holeOpen, time)
  drawBreakDust(context, width, ceilingY, breaking.holeOpen, breaking.travel)
  drawGlobe(context, width * 0.42, floorY, -globeRoll)
  drawCrashRadi(context, landingX, floorY, scale, time, sceneSeconds)
  drawFlyingBooks(context, landingX, floorY, sceneSeconds)
  drawCeilingBoards(context, width, ceilingY, breaking.holeOpen)
  drawCeilingCracks(context, width, ceilingY, breaking.holeOpen < 0.55 ? breaking.cracks : 0)
  drawHoleRim(context, width, ceilingY, breaking.holeOpen)
  drawBreakShards(context, width, ceilingY, floorY, breaking.travel)
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
