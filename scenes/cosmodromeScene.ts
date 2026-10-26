import { ellipsePath, linePath, paintFill, paintLine, paintShape, type Context } from "@/characters/paint"
import { type PartyPose } from "@/characters/partyPerson"
import { drawRadi, type Point, type RadiExpression } from "@/characters/radi"
import { sunnyRadiLook } from "@/characters/radiConcepts"
import { drawShadesDudeFront } from "@/characters/shadesDude"
import { easeInOut, seededRandom } from "@/scenes/libraryScene"
import { bounce, clampToUnit, easeOut, easeOutBack, heartPath, mix, mixPoint, paintComicBubble, paintIris, radiScale, stageProgress, type BubbleButtonLayout } from "@/scenes/openingScene"

type Dish = { x: number; size: number; tilt: number; phase: number }
type Block = readonly [number, number, number]

const OUTLINE = "#2b1d1a"
const WHITE = "#ffffff"
const METAL = "#c9cfe0"
const DARK_METAL = "#8e94a3"
const LIT_WINDOW = "#ffe38a"
const DARK_WINDOW = "#7d84a8"
const IRIS_IN_END = 0.8
const SKIP_END = 4.2
const HOP_COUNT = 9
const TURN_END = SKIP_END + 0.45
const BUBBLE_POP_END = TURN_END + 0.35
const STAR_COUNT = 60
const BUBBLE_LINES = ["So much to do,", "so much to do!"] as const
const RESTING_BOUNCE = { lift: 0, stretchY: 1 }
const RESTING_HANDS: readonly [Point, Point] = [[-14, -33], [14, -33]]
const THINKING_HANDS: readonly [Point, Point] = [[14, -37], [11, -48]]
const THINKING_ELBOWS: readonly [number, number] = [0.3, -2.5]
const CLASPED_HANDS: readonly [Point, Point] = [[-4, -38], [4, -38]]
const RADI_BUBBLE_HIDE_START = 7.4
const RADI_BUBBLE_HIDE_END = 7.7
const DUDE_WALK_START = 7.2
const DUDE_WALK_END = 13.6
const DUDE_STEPS_PER_SECOND = 1.5
const DUDE_SIZE = 1.25
const DUDE_STOP_UNITS = 50
const CAKE_HANDS: readonly [Point, Point] = [[-16, -23], [16, -23]]
const NOTICE_START = 8.4
const NOTICE_END = 8.9
const KISS_START = 14
const KISS_CONTACT = 14.4
const KISS_LEAVE = 15
const KISS_END = 15.4
const HEART_SECONDS = 1.6
const KISS_HEARTS = [[-14, 30, 0.8], [0, 45, 1], [14, 34, 0.85], [-6, 55, 0.6], [9, 60, 0.65]] as const
const WISH_START = 15.6
const WISH_POP_END = WISH_START + 0.35
const WISH_LINES = ["Happy birthday,", "Radi!"] as const
const WISH_CLOSE_SECONDS = 0.3
const KISS_LEAN = 0.14
const RADI_FEET = 0.88
const FAR_BLOCKS: readonly Block[] = [
  [0, 0.05, 0.05], [0.04, 0.03, 0.08], [0.11, 0.06, 0.04], [0.19, 0.04, 0.07], [0.3, 0.05, 0.05], [0.37, 0.03, 0.09],
  [0.46, 0.07, 0.04], [0.52, 0.03, 0.07], [0.62, 0.06, 0.06], [0.69, 0.04, 0.1], [0.78, 0.05, 0.05], [0.86, 0.04, 0.08], [0.93, 0.07, 0.05],
]
const DISHES: Dish[] = [
  { x: 0.035, size: 1.3, tilt: -0.5, phase: 0 },
  { x: 0.665, size: 1, tilt: 0.45, phase: 1.3 },
  { x: 0.52, size: 0.6, tilt: -0.35, phase: 2.6 },
]

const isMoving = (stage: number) => stage > 0 && stage < 1
const settle = (stage: number) => Math.min(1, stage * 6, (1 - stage) * 6)
const settledStretch = (stretchY: number, stage: number) => 1 + (stretchY - 1) * settle(stage)
const easeOutSoft = (amount: number) => mix(amount, easeOut(amount), amount)
const skipProgress =(sceneSeconds: number) => easeOut(stageProgress(sceneSeconds, IRIS_IN_END * 0.5, SKIP_END))

export const cosmodromeWalkSteps = (sceneSeconds: number) => {
  const skip = skipProgress(sceneSeconds)
  return skip <= 0 ? null : skip * HOP_COUNT
}

const drawSky = (context: Context, width: number, height: number, horizonY: number, time: number) => {
  const gradient = context.createLinearGradient(0, 0, 0, horizonY)
  gradient.addColorStop(0, "#23245e")
  gradient.addColorStop(0.55, "#6a3f9c")
  gradient.addColorStop(1, "#ff9e7a")
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
  const starSize = Math.min(width, height) * 0.004
  for (let star = 0; star < STAR_COUNT; star += 1) {
    const twinkle = 0.5 + 0.5 * Math.sin(time * (1.5 + seededRandom(star, 3) * 2) + star)
    context.globalAlpha = 0.35 + twinkle * 0.65
    const starX = seededRandom(star, 1) * width
    const starY = seededRandom(star, 2) ** 1.6 * horizonY * 0.7
    paintFill(context, WHITE, ellipsePath(starX, starY, starSize * (0.6 + twinkle * 0.5), starSize * (0.6 + twinkle * 0.5)))
  }
  context.globalAlpha = 1
}

const drawFarSkyline = (context: Context, width: number, height: number, horizonY: number) => {
  context.lineWidth = 2
  for (const [x, blockWidth, blockHeight] of FAR_BLOCKS) {
    paintShape(context, "#b08ac0", (path) => path.rect(x * width, horizonY - blockHeight * height, blockWidth * width, blockHeight * height + 4))
  }
}

const drawGround = (context: Context, width: number, height: number, horizonY: number) => {
  context.lineWidth = 4
  paintShape(context, "#d9a95f", (path) => {
    path.moveTo(-10, horizonY)
    path.lineTo(width + 10, horizonY)
    path.lineTo(width + 10, height + 10)
    path.lineTo(-10, height + 10)
    path.closePath()
  })
  const padTop = height * 0.74
  paintShape(context, "#b9bec8", (path) => path.rect(-10, padTop, width + 20, height - padTop + 10), {
    decorateInside: (padContext) => {
      for (let seamX = -width * 0.2; seamX < width * 1.2; seamX += width * 0.12) {
        paintLine(padContext, "#9ea4b0", 2, linePath(seamX, padTop, seamX + (seamX - width / 2) * 0.35, height))
      }
      paintLine(padContext, "#9ea4b0", 2, linePath(0, height * 0.8, width, height * 0.8))
      paintLine(padContext, "#9ea4b0", 2, linePath(0, height * 0.93, width, height * 0.93))
      padContext.setLineDash([width * 0.03, width * 0.02])
      paintLine(padContext, "#ffd23f", height * 0.008, linePath(0, height * 0.755, width, height * 0.755))
      padContext.setLineDash([])
    },
  })
}

const drawWindowRows = (context: Context, left: number, top: number, blockWidth: number, blockHeight: number, columns: number, rows: number, time: number, seed: number) => {
  const cellWidth = blockWidth / columns
  const cellHeight = blockHeight / rows
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column
      const isLit = Math.sin(time * 0.6 + seededRandom(index, seed) * 20) > -0.3
      context.fillStyle = isLit ? LIT_WINDOW : DARK_WINDOW
      context.fillRect(left + cellWidth * (column + 0.25), top + cellHeight * (row + 0.25), cellWidth * 0.5, cellHeight * 0.5)
    }
  }
}

const drawBlinkingLight = (context: Context, x: number, y: number, radius: number, time: number, phase: number) => {
  const isOn = Math.sin(time * 4 + phase) > 0
  context.lineWidth = 2
  paintShape(context, isOn ? "#ff2d2d" : "#7a1f1f", ellipsePath(x, y, radius, radius))
  if (isOn) paintFill(context, "rgba(255, 60, 60, 0.3)", ellipsePath(x, y, radius * 2.6, radius * 2.6))
}

const drawControlBuilding = (context: Context, width: number, height: number, horizonY: number, time: number) => {
  const left = width * 0.07
  const blockWidth = width * 0.08
  const top = horizonY - height * 0.065
  context.lineWidth = 3
  paintShape(context, "#e8e4f0", (path) => path.rect(left, top, blockWidth, horizonY - top + 2), {
    decorateInside: (buildingContext) => drawWindowRows(buildingContext, left, top + (horizonY - top) * 0.2, blockWidth, (horizonY - top) * 0.6, 5, 2, time, 1),
  })
  paintShape(context, METAL, (path) => path.ellipse(left + blockWidth * 0.3, top, blockWidth * 0.14, blockWidth * 0.14, 0, Math.PI, Math.PI * 2))
}

const drawHangar = (context: Context, width: number, height: number, horizonY: number) => {
  const left = width * 0.215
  const blockWidth = width * 0.095
  const top = horizonY - height * 0.17
  const blockHeight = horizonY - top
  context.lineWidth = 3
  paintShape(context, "#dfe3ee", (path) => path.rect(left, top, blockWidth, blockHeight + 2), {
    decorateInside: (hangarContext) => {
      paintFill(hangarContext, "#4dabf7", (path) => path.rect(left, top + blockHeight * 0.06, blockWidth, blockHeight * 0.08))
      const doorLeft = left + blockWidth * 0.2
      const doorWidth = blockWidth * 0.6
      const doorTop = top + blockHeight * 0.25
      paintFill(hangarContext, "#aab3c8", (path) => path.rect(doorLeft, doorTop, doorWidth, blockHeight))
      for (let stripe = 1; stripe < 6; stripe += 1) paintLine(hangarContext, DARK_METAL, 1.5, linePath(doorLeft + (doorWidth * stripe) / 6, doorTop, doorLeft + (doorWidth * stripe) / 6, horizonY))
    },
  })
  paintLine(context, OUTLINE, 2, (path) => path.rect(left + blockWidth * 0.2, top + blockHeight * 0.25, blockWidth * 0.6, blockHeight * 0.75))
}

const drawTowerBlock = (context: Context, width: number, height: number, horizonY: number, time: number) => {
  const left = width * 0.41
  const blockWidth = width * 0.035
  const top = horizonY - height * 0.2
  context.lineWidth = 3
  paintLine(context, OUTLINE, 2, linePath(left + blockWidth / 2, top, left + blockWidth / 2, top - height * 0.05))
  paintShape(context, "#f1e6d6", (path) => path.rect(left, top, blockWidth, horizonY - top + 2), {
    decorateInside: (towerContext) => drawWindowRows(towerContext, left, top + height * 0.01, blockWidth, horizonY - top - height * 0.02, 2, 7, time, 2),
  })
  drawBlinkingLight(context, left + blockWidth / 2, top - height * 0.05, Math.max(2.5, height * 0.006), time, 0)
}

const drawFuelTanks = (context: Context, width: number, height: number, horizonY: number) => {
  const radius = Math.min(width, height) * 0.035
  for (const tankX of [width * 0.565, width * 0.565 + radius * 2.4]) {
    const centerY = horizonY - radius * 2
    context.lineWidth = 3
    for (const side of [-1, 1]) paintLine(context, OUTLINE, 2.5, linePath(tankX + side * radius * 0.6, centerY, tankX + side * radius * 0.8, horizonY + 2))
    paintShape(context, WHITE, ellipsePath(tankX, centerY, radius, radius), {
      decorateInside: (tankContext) => paintFill(tankContext, "#e63946", (path) => path.rect(tankX - radius, centerY - radius * 0.12, radius * 2, radius * 0.24)),
      shade: "rgba(90, 40, 30, 0.18)",
    })
  }
}

const drawLongBuilding = (context: Context, width: number, height: number, horizonY: number, time: number) => {
  const left = width * 0.72
  const blockWidth = width * 0.13
  const top = horizonY - height * 0.06
  context.lineWidth = 3
  paintShape(context, "#e4d9f2", (path) => path.rect(left, top, blockWidth, horizonY - top + 2), {
    decorateInside: (buildingContext) => drawWindowRows(buildingContext, left, top + (horizonY - top) * 0.2, blockWidth, (horizonY - top) * 0.55, 9, 1, time, 3),
  })
  drawDish(context, left + blockWidth * 0.75, top, Math.min(width, height) * 0.0022, 0.5, time, 4)
}

const drawWaterTower = (context: Context, width: number, height: number, horizonY: number) => {
  const centerX = width * 0.885
  const tankWidth = width * 0.03
  const tankBottom = horizonY - height * 0.08
  context.lineWidth = 3
  for (const side of [-1, 1]) paintLine(context, OUTLINE, 2.5, linePath(centerX + side * tankWidth * 0.3, tankBottom, centerX + side * tankWidth * 0.45, horizonY + 2))
  paintLine(context, OUTLINE, 1.5, linePath(centerX - tankWidth * 0.36, tankBottom + height * 0.04, centerX + tankWidth * 0.36, tankBottom + height * 0.04))
  paintShape(context, "#7cc8ff", (path) => path.roundRect(centerX - tankWidth / 2, tankBottom - height * 0.045, tankWidth, height * 0.045, 4))
  paintShape(context, "#e63946", (path) => {
    path.moveTo(centerX - tankWidth * 0.55, tankBottom - height * 0.045)
    path.lineTo(centerX, tankBottom - height * 0.065)
    path.lineTo(centerX + tankWidth * 0.55, tankBottom - height * 0.045)
    path.closePath()
  })
}

const drawDish = (context: Context, baseX: number, baseY: number, unit: number, tilt: number, time: number, phase: number) => {
  context.save()
  context.translate(baseX, baseY)
  context.scale(unit, unit)
  context.lineWidth = 2.5 / unit
  paintShape(context, DARK_METAL, (path) => {
    path.moveTo(-7, 0)
    path.lineTo(7, 0)
    path.lineTo(4, -5)
    path.lineTo(-4, -5)
    path.closePath()
  })
  paintShape(context, METAL, (path) => path.rect(-2, -22, 4, 17))
  context.translate(0, -22)
  context.rotate(tilt + Math.sin(time * 0.4 + phase) * 0.12)
  paintShape(context, METAL, (path) => {
    path.moveTo(-15, -9)
    path.quadraticCurveTo(0, 8, 15, -9)
    path.closePath()
  })
  paintShape(context, "#f4f6fb", ellipsePath(0, -9, 15, 4.5), {
    decorateInside: (dishContext) => paintFill(dishContext, "#dfe5f0", ellipsePath(0, -8, 10, 2.6)),
  })
  for (const side of [-1, 1]) paintLine(context, OUTLINE, 1, linePath(side * 11, -9, 0, -24))
  paintShape(context, "#e63946", ellipsePath(0, -24, 2.2, 2.2))
  context.restore()
}

const drawCosmodrome = (context: Context, width: number, height: number, horizonY: number, time: number) => {
  const unit = Math.min(width, height) * 0.0042
  drawFarSkyline(context, width, height, horizonY)
  drawGround(context, width, height, horizonY)
  drawControlBuilding(context, width, height, horizonY, time)
  drawHangar(context, width, height, horizonY)
  drawTowerBlock(context, width, height, horizonY, time)
  drawFuelTanks(context, width, height, horizonY)
  drawLongBuilding(context, width, height, horizonY, time)
  drawWaterTower(context, width, height, horizonY)
  for (const dish of DISHES) drawDish(context, dish.x * width, horizonY + 2, unit * dish.size, dish.tilt, time, dish.phase)
}

const drawBubble = (context: Context, centerX: number, centerY: number, bubbleWidth: number, bubbleHeight: number, popScale: number, lines: readonly [string, string], textY = 0) => {
  if (popScale <= 0) return
  context.save()
  context.translate(centerX, centerY)
  context.scale(popScale, popScale)
  paintComicBubble(context, [
    ellipsePath(0, 0, bubbleWidth / 2, bubbleHeight / 2),
    (path) => {
      path.moveTo(-bubbleWidth * 0.3, bubbleHeight * 0.25)
      path.lineTo(-bubbleWidth * 0.52, bubbleHeight * 0.55)
      path.lineTo(-bubbleWidth * 0.15, bubbleHeight * 0.38)
      path.closePath()
    },
  ], Math.max(3, bubbleWidth * 0.012), lines, 0, textY, bubbleWidth * 0.095)
  context.restore()
}

const bubbleWidthFor = (width: number) => Math.min(width * 0.4, 360)

const drawRadiBubble = (context: Context, width: number, radiX: number, feetY: number, scale: number, sceneSeconds: number) => {
  const bubbleWidth = bubbleWidthFor(width)
  const pop = easeOutBack(stageProgress(sceneSeconds, TURN_END, BUBBLE_POP_END)) * (1 - easeOut(stageProgress(sceneSeconds, RADI_BUBBLE_HIDE_START, RADI_BUBBLE_HIDE_END)))
  drawBubble(context, Math.min(width - bubbleWidth / 2 - 12, radiX + 44 * scale + bubbleWidth / 2), feetY - 118 * scale, bubbleWidth, bubbleWidth * 0.6, pop, BUBBLE_LINES)
}

const wishBubbleGeometry = (width: number, height: number) => {
  const scale = radiScale(width, height)
  const feetY = height * RADI_FEET
  const radiX = width / 2
  const bubbleWidth = bubbleWidthFor(width)
  const bubbleHeight = bubbleWidth * 0.75
  return {
    bubbleWidth,
    bubbleHeight,
    centerX: Math.min(width - bubbleWidth / 2 - 12, radiX + DUDE_STOP_UNITS * scale + 20 * scale + bubbleWidth * 0.4),
    centerY: Math.max(bubbleHeight / 2 + 12, feetY - 150 * scale - bubbleHeight * 0.2),
  }
}

export const wishButtonLayout = (width: number, height: number, sceneSeconds: number, wishSeconds: number | null): BubbleButtonLayout => {
  if (sceneSeconds < WISH_POP_END || wishSeconds !== null) return null
  const { bubbleWidth, bubbleHeight, centerX, centerY } = wishBubbleGeometry(width, height)
  return { centerX, centerY: centerY + bubbleHeight * 0.24, width: bubbleWidth * 0.7, fontSize: Math.max(14, bubbleWidth * 0.1) }
}

const drawWishBubble = (context: Context, width: number, height: number, sceneSeconds: number, wishSeconds: number | null) => {
  const { bubbleWidth, bubbleHeight, centerX, centerY } = wishBubbleGeometry(width, height)
  const pop = easeOutBack(stageProgress(sceneSeconds, WISH_START, WISH_POP_END)) * (1 - easeOut(clampToUnit((wishSeconds ?? 0) / WISH_CLOSE_SECONDS)))
  drawBubble(context, centerX, centerY, bubbleWidth, bubbleHeight, pop, WISH_LINES, -bubbleHeight * 0.14)
}

const drawCake = (context: Context, time: number) => {
  context.lineWidth = 1.4
  paintShape(context, "#e9edf5", ellipsePath(0, -24, 16, 3))
  paintShape(context, "#ff8fab", (path) => path.roundRect(-11, -35, 22, 11, 2.5), {
    decorateInside: (cakeContext) => {
      paintFill(cakeContext, "#ffd6e0", (path) => path.rect(-12, -30.5, 24, 2))
      for (const [sprinkleX, sprinkleY, sprinkleColor] of [[-7, -27, "#4cc9f0"], [-2, -26, "#ffd23f"], [4, -27.5, "#3ddc97"], [8, -26, "#9b5de5"]] as const) {
        paintFill(cakeContext, sprinkleColor, ellipsePath(sprinkleX, sprinkleY, 0.9, 0.6))
      }
    },
  })
  paintShape(context, WHITE, (path) => {
    path.moveTo(-11.5, -33)
    path.lineTo(-11.5, -35.5)
    path.quadraticCurveTo(0, -38, 11.5, -35.5)
    path.lineTo(11.5, -33)
    for (let drip = 0; drip < 5; drip += 1) {
      const dripX = 11.5 - drip * 4.6
      path.quadraticCurveTo(dripX - 1.2, drip % 2 === 0 ? -30 : -31.5, dripX - 2.3, -33)
      path.lineTo(dripX - 4.6, -33)
    }
    path.closePath()
  })
  ;[-5, 0, 5].forEach((candleX, index) => {
    paintShape(context, ["#4cc9f0", "#ffd23f", "#ff5d8f"][index], (path) => path.rect(candleX - 0.9, -42, 1.8, 6))
    const flicker = 1 + Math.sin(time * 18 + index * 2) * 0.15
    paintFill(context, "rgba(255, 200, 80, 0.35)", ellipsePath(candleX, -44, 2.6, 3))
    paintFill(context, "#ff9f1c", ellipsePath(candleX, -44, 1.2 * flicker, 2 * flicker))
    paintFill(context, "#fff3b0", ellipsePath(candleX, -43.6, 0.5, 0.9))
  })
}

const dudeKiss = (sceneSeconds: number) => easeInOut(stageProgress(sceneSeconds, KISS_START, KISS_CONTACT)) * (1 - easeInOut(stageProgress(sceneSeconds, KISS_LEAVE, KISS_END)))

const dudeX = (width: number, radiX: number, scale: number, sceneSeconds: number) =>
  mix(width + 50 * scale, radiX + DUDE_STOP_UNITS * scale, easeOutSoft(stageProgress(sceneSeconds, DUDE_WALK_START, DUDE_WALK_END)))

const drawShadesDude = (context: Context, width: number, radiX: number, feetY: number, scale: number, time: number, sceneSeconds: number) => {
  if (sceneSeconds < DUDE_WALK_START) return
  const walk = stageProgress(sceneSeconds, DUDE_WALK_START, DUDE_WALK_END)
  const walking = isMoving(walk) ? settle(walk) : 0
  const stepPhase = (sceneSeconds - DUDE_WALK_START) * DUDE_STEPS_PER_SECOND * Math.PI
  const step = Math.sin(stepPhase) * walking
  const kiss = dudeKiss(sceneSeconds)
  const x = dudeX(width, radiX, scale, sceneSeconds)
  const dudeScale = scale * DUDE_SIZE
  const pose: PartyPose = {
    hands: CAKE_HANDS,
    bounce: -Math.abs(step) * 1.6,
    sway: step * 3.5,
    headTilt: step * 0.07 - kiss * 0.15,
    footLifts: [Math.max(0, step) * 3, Math.max(0, -step) * 3],
    lookUp: 0,
  }
  paintFill(context, "rgba(0, 0, 0, 0.18)", ellipsePath(x, feetY, 30 * dudeScale, 3.5 * dudeScale))
  context.save()
  context.translate(x, feetY)
  context.rotate(-kiss * KISS_LEAN)
  drawShadesDudeFront(context, 0, 0, dudeScale, pose)
  context.scale(dudeScale, dudeScale)
  context.translate(pose.sway, pose.bounce)
  context.lineJoin = "round"
  context.lineCap = "round"
  context.strokeStyle = OUTLINE
  drawCake(context, time)
  context.restore()
}

const drawKissSmack = (context: Context, radiX: number, feetY: number, scale: number, sceneSeconds: number) => {
  const smack = stageProgress(sceneSeconds, KISS_CONTACT, KISS_CONTACT + 0.7)
  if (smack <= 0 || smack >= 1) return
  const size = 10 * scale * easeOutBack(clampToUnit(smack * 4)) * (1 - easeOut(stageProgress(smack, 0.6, 1)))
  context.save()
  context.translate(radiX + 20 * scale, feetY - (62 + smack * 8) * scale)
  context.rotate(0.3)
  context.lineWidth = 1.4 * scale
  paintShape(context, "#ff4d8d", heartPath(size))
  context.restore()
}

const drawKissHearts = (context: Context, radiX: number, feetY: number, scale: number, time: number, sceneSeconds: number) => {
  const sinceKiss = sceneSeconds - KISS_CONTACT
  if (sinceKiss < 0 || sinceKiss > HEART_SECONDS + 0.5) return
  const middleX = radiX + DUDE_STOP_UNITS * 0.45 * scale
  KISS_HEARTS.forEach(([offsetX, rise, sizeRatio], index) => {
    const life = clampToUnit((sinceKiss - index * 0.12) / HEART_SECONDS)
    if (life <= 0 || life >= 1) return
    const pop = easeOutBack(clampToUnit(life * 5)) * (1 - easeOut(stageProgress(life, 0.75, 1)))
    const size = 15 * sizeRatio * scale * pop
    context.save()
    context.translate(middleX + (offsetX + Math.sin(time * 4 + index) * 3) * scale, feetY - (115 + rise * life) * scale)
    context.rotate(Math.sin(time * 3 + index) * 0.25)
    context.lineWidth = 1.6 * scale
    paintShape(context, index % 2 === 0 ? "#ff4d6d" : "#ff8fab", heartPath(size))
    paintFill(context, "rgba(255, 255, 255, 0.7)", ellipsePath(-size * 0.25, -size * 0.25, size * 0.09, size * 0.06))
    context.restore()
  })
}

const radiExpression = (thinking: number, sceneSeconds: number): RadiExpression => {
  if (sceneSeconds >= NOTICE_START && sceneSeconds < NOTICE_START + 1.2) return "surprised"
  if (thinking > 0.5 && sceneSeconds < NOTICE_START) return "thinking"
  return sunnyRadiLook.expression
}

const drawSkippingRadi = (context: Context, width: number, feetY: number, scale: number, time: number, sceneSeconds: number, onlyFaceAndBody = false) => {
  const skip = skipProgress(sceneSeconds)
  const turn = stageProgress(sceneSeconds, SKIP_END, TURN_END)
  const radiX = mix(-45 * scale, width / 2, skip)
  const hopsDone = skip * HOP_COUNT
  const hopPhase = hopsDone - Math.floor(hopsDone)
  const leadSide = Math.floor(hopsDone) % 2 === 0 ? 1 : -1
  const walkBounce = isMoving(skip) ? bounce(hopPhase) : RESTING_BOUNCE
  const turnBounce = isMoving(turn) ? bounce(turn) : RESTING_BOUNCE
  const lift = walkBounce.lift * 18 + turnBounce.lift * 24
  const stretchY = settledStretch(walkBounce.stretchY, skip) * settledStretch(turnBounce.stretchY, turn)
  const knee = isMoving(skip) ? Math.sin(hopPhase * Math.PI) * 9 : 0
  const tuck = turnBounce.lift * 6
  const armPump = isMoving(skip) ? Math.sin(hopPhase * Math.PI) * leadSide : 0
  const notice = easeOut(stageProgress(sceneSeconds, NOTICE_START, NOTICE_END))
  const thinking = easeOut(stageProgress(sceneSeconds, TURN_END, BUBBLE_POP_END)) * (1 - notice)
  const chinTap = Math.max(0, Math.sin(time * 2.2)) * 1.2 * thinking
  const lean = isMoving(skip) ? (0.12 + Math.sin(hopPhase * Math.PI * 2) * 0.05) * settle(skip) : Math.sin(time * 1.2) * 0.03 * thinking
  const skippingHands: readonly [Point, Point] = [
    [RESTING_HANDS[0][0] - Math.abs(armPump) * 3, RESTING_HANDS[0][1] - armPump * 10],
    [RESTING_HANDS[1][0] + Math.abs(armPump) * 3, RESTING_HANDS[1][1] + armPump * 10],
  ]
  const hands: readonly [Point, Point] = [
    mixPoint(mixPoint(skippingHands[0], THINKING_HANDS[0], thinking), CLASPED_HANDS[0], notice),
    mixPoint(mixPoint(skippingHands[1], [THINKING_HANDS[1][0], THINKING_HANDS[1][1] + chinTap], thinking), CLASPED_HANDS[1], notice),
  ]

  if (!onlyFaceAndBody) paintFill(context, "rgba(0, 0, 0, 0.18)", ellipsePath(radiX, feetY, 22 * scale * (1 - lift / 60), 3 * scale))
  context.save()
  context.translate(radiX, feetY - lift * scale)
  context.rotate(lean)
  context.scale(1 / stretchY, stretchY)
  if (onlyFaceAndBody) {
    const faceAndBody = new Path2D()
    faceAndBody.ellipse(0, -70 * scale, 25 * scale, 27 * scale, 0, 0, Math.PI * 2)
    faceAndBody.rect(-18 * scale, -46 * scale, 36 * scale, 50 * scale)
    context.clip(faceAndBody)
  }
  drawRadi(context, { ...sunnyRadiLook, expression: radiExpression(thinking, sceneSeconds) }, 0, 0, scale, {
    faceTurn: 1 - easeOut(turn) + Math.sin(time * 0.9) * 0.15 * thinking + notice * 0.55,
    headTilt: 0.12 * thinking + 0.14 * dudeKiss(sceneSeconds),
    legLifts: leadSide === 1 ? [knee + tuck, knee * 0.2 + tuck] : [knee * 0.2 + tuck, knee + tuck],
    kneeBends: leadSide === 1 ? [knee * 0.5 + tuck * 0.8, knee * 0.1 + tuck * 0.8] : [knee * 0.1 + tuck * 0.8, knee * 0.5 + tuck * 0.8],
    elbowBends: [THINKING_ELBOWS[0] * thinking, THINKING_ELBOWS[1] * thinking],
    hands,
  })
  context.restore()
}

export const drawCosmodromeScene = (context: Context, width: number, height: number, time: number, sceneSeconds: number, wishSeconds: number | null) => {
  const horizonY = height * 0.62
  const feetY = height * RADI_FEET
  const scale = radiScale(width, height)
  context.lineJoin = "round"
  context.lineCap = "round"
  context.strokeStyle = OUTLINE
  drawSky(context, width, height, horizonY, time)
  drawCosmodrome(context, width, height, horizonY, time)
  const radiX = mix(-45 * scale, width / 2, skipProgress(sceneSeconds))
  drawSkippingRadi(context, width, feetY, scale, time, sceneSeconds)
  if (sceneSeconds >= DUDE_WALK_START) {
    drawShadesDude(context, width, radiX, feetY, scale, time, sceneSeconds)
    drawSkippingRadi(context, width, feetY, scale, time, sceneSeconds, true)
  }
  drawKissSmack(context, radiX, feetY, scale, sceneSeconds)
  drawKissHearts(context, radiX, feetY, scale, time, sceneSeconds)
  drawRadiBubble(context, width, radiX, feetY, scale, sceneSeconds)
  drawWishBubble(context, width, height, sceneSeconds, wishSeconds)
  if (sceneSeconds < IRIS_IN_END) paintIris(context, width, height, width / 2, feetY - 60 * scale, Math.hypot(width, height) * clampToUnit(sceneSeconds / IRIS_IN_END) ** 2)
}
