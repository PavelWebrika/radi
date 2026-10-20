import { ellipsePath, linePath, paintFill, paintLine, paintShape, type BuildPath, type Context } from "@/characters/paint"
import { drawRadi } from "@/characters/radi"
import { everydayRadiLook } from "@/characters/radiConcepts"
import {
  drawClouds,
  drawSun,
  easeOut,
  easeOutBack,
  mix,
  paintComicBubble,
  paintIris,
  radiScale,
  stageProgress,
  type BubbleButtonLayout,
} from "@/scenes/openingScene"

const OUTLINE = "#2b1d1a"
const BENCH = "#c98b52"
const SIDEWALK = "#efe9df"
const SHADOW = "rgba(0, 0, 0, 0.15)"
const PERSON_SHADE = "rgba(70, 80, 140, 0.32)"
const BUILDINGS_BASE = 0.54
const BACK_WALK_BOTTOM = 0.6
const ROAD_BOTTOM = 0.84
const IRIS_IN_START = 0.2
const IRIS_IN_END = 1.2
const BUBBLE_POP_START = 1.3
const BUBBLE_POP_END = 1.7

type CityBuilding = { x: number; width: number; height: number; color: string; hasDoor: boolean }
type Walker = { phase: number; speed: number; size: number }

const CITY_BUILDINGS: CityBuilding[] = [
  { x: -0.01, width: 0.12, height: 0.3, color: "#ff9fb2", hasDoor: true },
  { x: 0.11, width: 0.1, height: 0.4, color: "#ffd166", hasDoor: false },
  { x: 0.21, width: 0.13, height: 0.26, color: "#8ecae6", hasDoor: true },
  { x: 0.34, width: 0.09, height: 0.36, color: "#cdb4db", hasDoor: false },
  { x: 0.43, width: 0.12, height: 0.3, color: "#95d5b2", hasDoor: true },
  { x: 0.55, width: 0.09, height: 0.42, color: "#ffadad", hasDoor: false },
  { x: 0.64, width: 0.13, height: 0.28, color: "#a0c4ff", hasDoor: true },
  { x: 0.77, width: 0.09, height: 0.37, color: "#ffd6a5", hasDoor: false },
  { x: 0.86, width: 0.15, height: 0.31, color: "#bde0fe", hasDoor: true },
]

const TREE_POSITIONS = [0.06, 0.29, 0.52, 0.74, 0.95]

const WALKERS: Walker[] = [
  { phase: 0, speed: 0.035, size: 1 },
  { phase: 0.35, speed: -0.03, size: 0.9 },
  { phase: 0.6, speed: 0.025, size: 1.05 },
  { phase: 0.85, speed: -0.04, size: 0.95 },
]

const BENCH_PARTS: BuildPath[] = [
  (path) => path.roundRect(-31.5, -47, 3, 30, 1),
  (path) => path.roundRect(28.5, -47, 3, 30, 1),
  (path) => path.roundRect(-36, -47, 72, 5, 2),
  (path) => path.roundRect(-36, -39, 72, 5, 2),
  (path) => path.roundRect(-31, -20, 3, 25, 1),
  (path) => path.roundRect(28, -20, 3, 25, 1),
  (path) => path.roundRect(-38, -24, 76, 5, 2),
]

const drawBuildings = (context: Context, width: number, height: number) => {
  const baseY = height * BUILDINGS_BASE
  const windowWidth = Math.max(6, width * 0.016)
  const windowHeight = Math.max(8, height * 0.03)
  context.lineWidth = 3
  CITY_BUILDINGS.forEach(({ x, width: widthRatio, height: heightRatio, color, hasDoor }, buildingIndex) => {
    const left = x * width
    const buildingWidth = widthRatio * width
    const top = baseY - heightRatio * height
    paintShape(context, color, (path) => path.rect(left, top, buildingWidth, baseY - top), {
      decorateInside: (buildingContext) => {
        paintFill(buildingContext, "rgba(0, 0, 0, 0.12)", (path) => path.rect(left, top, buildingWidth, height * 0.015))
        const columns = Math.max(2, Math.floor(buildingWidth / (windowWidth * 2)))
        const gapX = (buildingWidth - columns * windowWidth) / (columns + 1)
        buildingContext.lineWidth = 2
        for (let windowY = top + height * 0.035; windowY < baseY - windowHeight * (hasDoor ? 2.6 : 1.6); windowY += windowHeight * 1.9) {
          for (let column = 0; column < columns; column += 1) {
            const isLit = (buildingIndex + column + Math.round(windowY)) % 4 === 0
            paintShape(buildingContext, isLit ? "#fff3b0" : "#e8f6ff", (path) => path.roundRect(left + gapX + column * (windowWidth + gapX), windowY, windowWidth, windowHeight, 2))
          }
        }
        if (hasDoor) {
          const doorWidth = windowWidth * 1.6
          paintShape(buildingContext, "#8a5a32", (path) => path.roundRect(left + (buildingWidth - doorWidth) / 2, baseY - windowHeight * 2.2, doorWidth, windowHeight * 2.4, [doorWidth / 2, doorWidth / 2, 0, 0]))
        }
      },
    })
  })
}

const drawSidewalk = (context: Context, width: number, top: number, bottom: number, tileWidth: number) => {
  context.lineWidth = 3
  paintShape(context, SIDEWALK, (path) => path.rect(-4, top, width + 8, bottom - top))
  for (let tileX = tileWidth; tileX < width; tileX += tileWidth) paintLine(context, "rgba(43, 29, 26, 0.18)", 2, linePath(tileX, top, tileX, bottom))
}

const drawRoad = (context: Context, width: number, height: number) => {
  const top = height * BACK_WALK_BOTTOM
  const bottom = height * ROAD_BOTTOM
  context.lineWidth = 3
  paintShape(context, "#6d7a8c", (path) => path.rect(-4, top, width + 8, bottom - top))
  const dashWidth = width * 0.05
  const dashHeight = Math.max(6, height * 0.01)
  context.fillStyle = "#ffffff"
  for (let dashX = dashWidth * 0.5; dashX < width; dashX += dashWidth * 2) context.fillRect(dashX, (top + bottom - dashHeight) / 2, dashWidth, dashHeight)
}

const drawWalker = (context: Context, centerX: number, feetY: number, size: number, step: number, facing: number) => {
  const swing = Math.sin(step) * size * 0.18
  context.save()
  context.translate(centerX, feetY)
  context.scale(facing, 1)
  paintLine(context, PERSON_SHADE, size * 0.12, (path) => {
    path.moveTo(-swing, 0)
    path.lineTo(0, -size * 0.42)
    path.lineTo(swing, 0)
  })
  paintLine(context, PERSON_SHADE, size * 0.1, (path) => {
    path.moveTo(swing * 0.8, -size * 0.5)
    path.lineTo(0, -size * 0.72)
    path.lineTo(-swing * 0.8, -size * 0.5)
  })
  paintFill(context, PERSON_SHADE, (path) => path.roundRect(-size * 0.13, -size * 0.8, size * 0.26, size * 0.42, size * 0.1))
  paintFill(context, PERSON_SHADE, ellipsePath(size * 0.02, -size * 0.92, size * 0.12, size * 0.12))
  context.restore()
}

const drawWalkers = (context: Context, width: number, height: number, time: number) => {
  const feetY = height * (BUILDINGS_BASE + 0.045)
  for (const { phase, speed, size } of WALKERS) {
    const travel = (((phase + time * speed) % 1.2) + 1.2) % 1.2
    drawWalker(context, (travel - 0.1) * width, feetY, height * 0.1 * size, time * 7 + phase * 10, Math.sign(speed))
  }
}

const drawTrees = (context: Context, width: number, height: number) => {
  const groundY = height * (BUILDINGS_BASE + 0.05)
  const crownRadius = height * 0.04
  context.lineWidth = 3
  for (const treeX of TREE_POSITIONS) {
    const centerX = treeX * width
    paintShape(context, "#8a5a32", (path) => path.roundRect(centerX - crownRadius * 0.18, groundY - crownRadius * 2.4, crownRadius * 0.36, crownRadius * 2.4, 3))
    const crown: BuildPath = (path) => {
      for (const [offsetX, offsetY] of [[-0.6, 0], [0.6, 0], [0, -0.55]]) {
        path.moveTo(centerX + (offsetX + 1) * crownRadius, groundY - crownRadius * (2.6 - offsetY))
        path.ellipse(centerX + offsetX * crownRadius, groundY - crownRadius * (2.6 - offsetY), crownRadius, crownRadius, 0, 0, Math.PI * 2)
      }
    }
    paintLine(context, OUTLINE, 6, crown)
    paintFill(context, "#5cc45a", crown)
    paintFill(context, "rgba(255, 255, 255, 0.25)", ellipsePath(centerX - crownRadius * 0.5, groundY - crownRadius * 3.3, crownRadius * 0.35, crownRadius * 0.22))
  }
}

const benchRadiPosition = (width: number, height: number) => {
  const scale = radiScale(width, height)
  return { scale, radiX: Math.max(width * 0.22, 45 * scale), groundY: height * 0.95, feetY: height * 0.95 - 5 * scale }
}

const drawBenchRadi = (context: Context, width: number, height: number, time: number) => {
  const { scale, radiX, groundY, feetY } = benchRadiPosition(width, height)
  const kick = Math.sin(time * 3) * 1.5
  paintFill(context, SHADOW, ellipsePath(radiX, groundY, 40 * scale, 3.5 * scale))
  context.save()
  context.translate(radiX, feetY)
  context.scale(scale, scale)
  context.lineWidth = 1.6
  for (const benchPart of BENCH_PARTS) paintShape(context, BENCH, benchPart)
  context.restore()
  drawRadi(context, everydayRadiLook, radiX, feetY, scale, {
    faceTurn: 0,
    hands: [[-17, -25], [17, -25]],
    legLifts: [1.5 + kick, 1.5 - kick],
  })
}

const anywayBubbleGeometry = (width: number, height: number) => {
  const { scale, radiX, feetY } = benchRadiPosition(width, height)
  const bubbleWidth = Math.min(width * 0.3, 260)
  const bubbleHeight = bubbleWidth * 0.55
  return {
    bubbleWidth,
    bubbleHeight,
    centerX: Math.max(bubbleWidth / 2 + 12, radiX),
    centerY: feetY - 100 * scale - bubbleHeight / 2 - 18,
    headX: radiX,
    headY: feetY - 98 * scale,
  }
}

const drawAnywayBubble = (context: Context, width: number, height: number, popScale: number) => {
  if (popScale <= 0) return
  const { bubbleWidth, bubbleHeight, centerX, centerY, headX, headY } = anywayBubbleGeometry(width, height)
  context.save()
  context.translate(centerX, centerY)
  context.scale(popScale, popScale)
  paintComicBubble(context, [
    ellipsePath(0, 0, bubbleWidth / 2, bubbleHeight / 2),
    (path) => {
      path.moveTo(-bubbleWidth * 0.1, bubbleHeight * 0.4)
      path.lineTo(headX - centerX, headY - centerY)
      path.lineTo(bubbleWidth * 0.1, bubbleHeight * 0.4)
      path.closePath()
    },
  ], Math.max(3, bubbleWidth * 0.012), ["", ""], 0, 0, bubbleWidth * 0.12)
  context.restore()
}

export const anywayButtonLayout = (width: number, height: number, citySeconds: number): BubbleButtonLayout => {
  if (citySeconds < BUBBLE_POP_END) return null
  const { bubbleWidth, centerX, centerY } = anywayBubbleGeometry(width, height)
  return { centerX, centerY, width: bubbleWidth * 0.8, fontSize: Math.max(14, bubbleWidth * 0.14) }
}

export const drawCityScene = (context: Context, width: number, height: number, time: number, citySeconds: number) => {
  context.lineJoin = "round"
  context.lineCap = "round"
  context.strokeStyle = OUTLINE
  const sky = context.createLinearGradient(0, 0, 0, height * BUILDINGS_BASE)
  sky.addColorStop(0, "#3fa9f5")
  sky.addColorStop(1, "#bfe6ff")
  context.fillStyle = sky
  context.fillRect(0, 0, width, height)
  drawSun(context, width, height, time)
  drawClouds(context, width, height, time)
  drawBuildings(context, width, height)
  drawSidewalk(context, width, height * BUILDINGS_BASE, height * BACK_WALK_BOTTOM, width * 0.06)
  drawWalkers(context, width, height, time)
  drawTrees(context, width, height)
  drawRoad(context, width, height)
  drawSidewalk(context, width, height * ROAD_BOTTOM, height + 4, width * 0.1)
  drawBenchRadi(context, width, height, time)
  drawAnywayBubble(context, width, height, easeOutBack(stageProgress(citySeconds, BUBBLE_POP_START, BUBBLE_POP_END)))
  const { radiX, feetY, scale } = benchRadiPosition(width, height)
  const irisIn = easeOut(stageProgress(citySeconds, IRIS_IN_START, IRIS_IN_END)) ** 2
  if (irisIn < 1) paintIris(context, width, height, radiX, feetY - 60 * scale, mix(0, Math.hypot(width, height), irisIn))
}
