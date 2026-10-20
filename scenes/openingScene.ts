import { ellipsePath, linePath, paintFill, paintLine, paintShape, type BuildPath, type Context } from "@/characters/paint"

const OUTLINE = "#2b1d1a"
const WHITE = "#ffffff"

type Cloud = { x: number; y: number; size: number; speed: number; phase: number }
type Mountain = { x: number; peak: number; halfWidth: number; color: string }
type Building = { x: number; width: number; height: number }

const CLOUDS: Cloud[] = [
  { x: 0.14, y: 0.14, size: 1, speed: 0.22, phase: 0 },
  { x: 0.4, y: 0.08, size: 0.75, speed: 0.3, phase: 1.7 },
  { x: 0.64, y: 0.2, size: 0.9, speed: 0.18, phase: 3.1 },
  { x: 0.3, y: 0.3, size: 0.55, speed: 0.35, phase: 4.4 },
  { x: 0.9, y: 0.34, size: 0.65, speed: 0.26, phase: 2.3 },
]

const CLOUD_PUFFS = [
  [-1.3, 0.25, 0.55],
  [-0.6, -0.2, 0.75],
  [0.35, -0.35, 0.8],
  [1.15, 0.1, 0.6],
  [0.2, 0.3, 0.6],
  [-0.4, 0.35, 0.5],
] as const

const MOUNTAINS: Mountain[] = [
  { x: 0.08, peak: 0.36, halfWidth: 0.2, color: "#8fa5df" },
  { x: 0.33, peak: 0.28, halfWidth: 0.24, color: "#7d95d6" },
  { x: 0.7, peak: 0.34, halfWidth: 0.22, color: "#8fa5df" },
  { x: 0.93, peak: 0.3, halfWidth: 0.2, color: "#7d95d6" },
]

const BUILDINGS: Building[] = [
  { x: 0.46, width: 0.014, height: 0.05 },
  { x: 0.476, width: 0.01, height: 0.08 },
  { x: 0.488, width: 0.016, height: 0.04 },
  { x: 0.506, width: 0.012, height: 0.1 },
  { x: 0.52, width: 0.018, height: 0.06 },
  { x: 0.54, width: 0.01, height: 0.075 },
  { x: 0.552, width: 0.016, height: 0.045 },
  { x: 0.57, width: 0.012, height: 0.065 },
]

const FLOWERS = [
  [0.08, 0.86], [0.13, 0.79], [0.18, 0.93], [0.27, 0.82], [0.38, 0.9], [0.45, 0.96],
  [0.5, 0.85], [0.62, 0.94], [0.71, 0.84], [0.82, 0.9], [0.93, 0.86],
] as const

const FLOWER_COLORS = ["#ff7aa8", WHITE, "#ffd23f"]

const toPath2D = (buildPath: BuildPath) => {
  const path = new Path2D()
  buildPath(path)
  return path
}

const drawSky = (context: Context, width: number, height: number, horizonY: number) => {
  const gradient = context.createLinearGradient(0, 0, 0, horizonY)
  gradient.addColorStop(0, "#3fa9f5")
  gradient.addColorStop(1, "#bfe6ff")
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
}

const drawSun = (context: Context, width: number, height: number, time: number) => {
  const centerX = width * 0.84
  const centerY = height * 0.17
  const radius = Math.min(width, height) * 0.075
  const glow = context.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius * 2.4)
  glow.addColorStop(0, "rgba(255, 236, 150, 0.6)")
  glow.addColorStop(1, "rgba(255, 236, 150, 0)")
  paintFill(context, glow, ellipsePath(centerX, centerY, radius * 2.4, radius * 2.4))
  for (let ray = 0; ray < 12; ray += 1) {
    const angle = (ray * Math.PI) / 6 + time * 0.15
    const outerRadius = radius * (1.6 + Math.sin(time * 2 + ray) * 0.05)
    const rayPath = linePath(
      centerX + Math.cos(angle) * radius * 1.3,
      centerY + Math.sin(angle) * radius * 1.3,
      centerX + Math.cos(angle) * outerRadius,
      centerY + Math.sin(angle) * outerRadius,
    )
    paintLine(context, OUTLINE, radius * 0.12 + 6, rayPath)
    paintLine(context, "#ffb703", radius * 0.12, rayPath)
  }
  context.lineWidth = 4
  paintShape(context, "#ffd23f", ellipsePath(centerX, centerY, radius, radius))
  for (const side of [-1, 1]) {
    paintFill(context, OUTLINE, ellipsePath(centerX + side * radius * 0.32, centerY - radius * 0.1, radius * 0.07, radius * 0.11))
    paintFill(context, "rgba(255, 110, 140, 0.45)", ellipsePath(centerX + side * radius * 0.55, centerY + radius * 0.2, radius * 0.14, radius * 0.08))
  }
  paintLine(context, OUTLINE, radius * 0.07, (path) => path.arc(centerX, centerY + radius * 0.1, radius * 0.25, Math.PI * 0.15, Math.PI * 0.85))
}

const drawMountains = (context: Context, width: number, height: number, horizonY: number) => {
  const baseY = horizonY + height * 0.05
  context.lineWidth = 3
  for (const { x, peak, halfWidth, color } of MOUNTAINS) {
    const peakX = x * width
    const peakY = peak * height
    const half = halfWidth * width
    const tip = width * 0.025
    const slope = (baseY - peakY) / half
    const snowY = peakY + (baseY - peakY) * 0.28
    const capHalf = ((snowY - peakY) / slope) * 1.5
    paintShape(context, color, (path) => {
      path.moveTo(peakX - half, baseY)
      path.lineTo(peakX - tip, peakY + tip * slope)
      path.quadraticCurveTo(peakX, peakY, peakX + tip, peakY + tip * slope)
      path.lineTo(peakX + half, baseY)
      path.closePath()
    }, {
      decorateInside: (mountainContext) => paintFill(mountainContext, WHITE, (path) => {
        path.moveTo(peakX - capHalf, peakY - 20)
        path.lineTo(peakX + capHalf, peakY - 20)
        path.lineTo(peakX + capHalf, snowY)
        for (let tooth = 1; tooth <= 6; tooth += 1) {
          path.lineTo(peakX + capHalf - (tooth * capHalf) / 3, snowY + (tooth % 2 === 1 ? height * 0.015 : 0))
        }
        path.closePath()
      }),
    })
  }
}

const drawCity = (context: Context, width: number, height: number, horizonY: number) => {
  context.lineWidth = 1.5
  for (const building of BUILDINGS) {
    const left = building.x * width
    const top = horizonY - building.height * height
    const buildingWidth = building.width * width
    paintShape(context, "#b8c6ec", (path) => path.rect(left, top, buildingWidth, horizonY + height * 0.04 - top), {
      decorateInside: (buildingContext) => {
        buildingContext.fillStyle = "#fff3b0"
        for (let windowY = top + 4; windowY < horizonY - 3; windowY += 7) {
          for (let windowX = left + 3; windowX < left + buildingWidth - 3; windowX += 5) buildingContext.fillRect(windowX, windowY, 2, 3)
        }
      },
    })
  }
}

const drawHills = (context: Context, width: number, height: number, horizonY: number) => {
  context.lineWidth = 4
  paintShape(context, "#8ddc6e", (path) => {
    path.moveTo(0, horizonY + height * 0.02)
    path.quadraticCurveTo(width * 0.2, horizonY - height * 0.04, width * 0.45, horizonY + height * 0.01)
    path.quadraticCurveTo(width * 0.7, horizonY + height * 0.05, width, horizonY - height * 0.02)
    path.lineTo(width, height)
    path.lineTo(0, height)
    path.closePath()
  })
  paintShape(context, "#5cc45a", (path) => {
    path.moveTo(0, height * 0.76)
    path.quadraticCurveTo(width * 0.3, height * 0.68, width * 0.6, height * 0.75)
    path.quadraticCurveTo(width * 0.85, height * 0.8, width, height * 0.72)
    path.lineTo(width, height)
    path.lineTo(0, height)
    path.closePath()
  })
}

const drawFlowers = (context: Context, width: number, height: number) => {
  const petalRadius = Math.min(width, height) * 0.008
  context.lineWidth = 1.5
  FLOWERS.forEach(([x, y], index) => {
    const centerX = x * width
    const centerY = y * height
    for (const [offsetX, offsetY] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      paintShape(context, FLOWER_COLORS[index % FLOWER_COLORS.length], ellipsePath(centerX + offsetX * petalRadius, centerY + offsetY * petalRadius, petalRadius, petalRadius))
    }
    paintFill(context, "#ffb703", ellipsePath(centerX, centerY, petalRadius * 0.7, petalRadius * 0.7))
  })
}

const drawCloud = (context: Context, centerX: number, centerY: number, unit: number) => {
  const cloudShape: BuildPath = (path) => {
    for (const [offsetX, offsetY, radius] of CLOUD_PUFFS) {
      path.moveTo(centerX + (offsetX + radius) * unit, centerY + offsetY * unit)
      path.ellipse(centerX + offsetX * unit, centerY + offsetY * unit, radius * unit, radius * unit, 0, 0, Math.PI * 2)
    }
  }
  paintLine(context, OUTLINE, 6, cloudShape)
  paintFill(context, WHITE, cloudShape)
  context.save()
  context.clip(toPath2D(cloudShape))
  paintFill(context, "#dcecff", ellipsePath(centerX, centerY + unit * 0.8, unit * 2.2, unit * 0.45))
  context.restore()
}

const drawClouds = (context: Context, width: number, height: number, time: number) => {
  const baseUnit = Math.min(width, height) * 0.07
  for (const cloud of CLOUDS) {
    const driftX = Math.sin(time * cloud.speed + cloud.phase) * width * 0.03
    drawCloud(context, cloud.x * width + driftX, cloud.y * height, baseUnit * cloud.size)
  }
}

const drawBird = (context: Context, width: number, height: number, time: number) => {
  const size = Math.min(width, height) * 0.025
  const travel = width + size * 10
  const birdX = ((time * width * 0.06 + width * 0.3) % travel) - size * 5
  const birdY = height * 0.26 + Math.sin(time * 1.3) * height * 0.02
  const wingTipY = birdY + Math.sin(time * 9) * size * 0.5
  paintLine(context, OUTLINE, size * 0.28, (path) => {
    path.moveTo(birdX - size, wingTipY)
    path.quadraticCurveTo(birdX - size * 0.45, birdY - size * 0.45, birdX, birdY)
    path.quadraticCurveTo(birdX + size * 0.45, birdY - size * 0.45, birdX + size, wingTipY)
  })
}

const drawSpeechBubble = (context: Context, width: number, height: number, time: number) => {
  const bubbleWidth = Math.min(width * 0.72, 560)
  const bubbleHeight = bubbleWidth * 0.42
  const centerX = width / 2
  const centerY = height * 0.44 + Math.sin(time * 1.6) * height * 0.008
  const outlineWidth = Math.max(4, bubbleWidth * 0.012)
  const bubbleParts: BuildPath[] = [
    ellipsePath(centerX, centerY, bubbleWidth / 2, bubbleHeight / 2),
    (path) => {
      path.moveTo(centerX - bubbleWidth * 0.08, centerY + bubbleHeight * 0.38)
      path.lineTo(centerX - bubbleWidth * 0.16, centerY + bubbleHeight * 0.85)
      path.lineTo(centerX + bubbleWidth * 0.06, centerY + bubbleHeight * 0.4)
      path.closePath()
    },
  ]
  context.save()
  context.translate(outlineWidth * 1.2, outlineWidth * 1.2)
  for (const bubblePart of bubbleParts) paintFill(context, "rgba(0, 0, 0, 0.18)", bubblePart)
  context.restore()
  for (const bubblePart of bubbleParts) paintLine(context, OUTLINE, outlineWidth * 2, bubblePart)
  for (const bubblePart of bubbleParts) paintFill(context, WHITE, bubblePart)

  const fontSize = bubbleWidth * 0.09
  context.font = `${fontSize}px "Comic Sans MS", "Comic Sans", cursive`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillStyle = OUTLINE
  context.fillText("Scroll down", centerX, centerY - fontSize * 0.6)
  context.fillText("to meet me!", centerX, centerY + fontSize * 0.6)
}

export const drawOpeningScene = (context: Context, width: number, height: number, time: number) => {
  const horizonY = height * 0.6
  context.lineJoin = "round"
  context.lineCap = "round"
  context.strokeStyle = OUTLINE
  drawSky(context, width, height, horizonY)
  drawSun(context, width, height, time)
  drawMountains(context, width, height, horizonY)
  drawCity(context, width, height, horizonY)
  drawHills(context, width, height, horizonY)
  drawFlowers(context, width, height)
  drawClouds(context, width, height, time)
  drawBird(context, width, height, time)
  drawSpeechBubble(context, width, height, time)
}
