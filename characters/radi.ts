import { ellipsePath, linePath, paintFill, paintLine, paintShade, paintShape, type BuildPath, type Context, type DecorateInside } from "@/characters/paint"

export const OUTLINE = "#2b1d1a"
export const OUTLINE_WIDTH = 1.6
export const SKIN = "#f5cfb0"
export const HAIR = "#b8873e"
export const HAIR_HIGHLIGHT = "#f0d088"
export const HAIR_STRAND = "rgba(110, 62, 18, 0.45)"
export const EYE = "#5e4425"
export const PUPIL = "#2a1a0f"
export const BLUSH = "rgba(255, 110, 140, 0.45)"
export const MOUTH = "#8a2a2a"
export const TONGUE = "#ff7f9a"
export const WHITE = "#ffffff"
export const DENIM = "#5b8fc9"
export const WOOD = "#6b3f22"
export const BLACK_FABRIC = "#1d1d1d"
const KALPAK_FUR = "#1f1d22"
export const HIGH_TOP_RED = "#e23b3b"
export const TSARVULI_LEATHER = "#8a5a32"
const WOOL_WRAP = "#f4efe4"
const GOLD = "#e8c547"
export const SILVER = "#d5d9de"
export const FOLK_YELLOW = "#f2cf3a"
const LEAF_GREEN = "#3f9b4f"
export const SHADE = "rgba(90, 40, 30, 0.22)"
const SIDES = [-1, 1] as const

type RadiPattern = "mandala" | "flowers" | "comic" | "tieDye" | "folk" | "lace" | "sukman"
type RadiExtra =
  | "denimJacket"
  | "headphones"
  | "pendant"
  | "bandana"
  | "sunglasses"
  | "kalpak"
  | "gaida"
  | "heartNecklace"
  | "apron"
  | "pafti"
  | "puffSleeves"
  | "hairFlower"
export type RadiHair = "ponytail" | "sideTail" | "loose" | "tucked" | "braid" | "bun"
export type RadiExpression = "grin" | "tongue" | "puff" | "surprised" | "angry"
type RadiPose = "wave" | "peace" | "hold"
export type RadiShoes = "sneakers" | "highTops" | "tsarvuli" | "partyHeels" | "folkFlats"
type DrawShoe = (context: Context, side: number, isPolished: boolean) => void
type RadiTop = { color: string; pattern?: RadiPattern }
export type RadiBottom = { kind: "skirt" | "shorts"; color: string; pattern?: RadiPattern }
type CurveLine = readonly [number, number, number, number, number, number]
export type Point = readonly [number, number]
type RadiHands = readonly [Point, Point]

type PerSide = readonly [number, number]

export type RadiMotion = {
  faceTurn: number
  legLifts: PerSide
  kneeBends: PerSide
  hands: RadiHands
  elbowBends: PerSide
}

export type RadiLook = {
  hair: RadiHair
  expression: RadiExpression
  pose: RadiPose
  top: RadiTop
  bottom: RadiBottom
  extras: RadiExtra[]
  shoes?: RadiShoes
  polished?: boolean
}

export const shadeIf = (isPolished: boolean) => (isPolished ? { shade: SHADE } : {})

export const curvesPath = (curves: readonly CurveLine[]): BuildPath => (path) => {
  for (const [startX, startY, controlX, controlY, endX, endY] of curves) {
    path.moveTo(startX, startY)
    path.quadraticCurveTo(controlX, controlY, endX, endY)
  }
}

export const paintTube = (context: Context, color: string, thickness: number, buildPath: BuildPath, isPolished = false) => {
  paintLine(context, OUTLINE, thickness + OUTLINE_WIDTH * 2, buildPath)
  paintLine(context, color, thickness, buildPath)
  if (isPolished) {
    context.save()
    context.translate(thickness * 0.2, thickness * 0.2)
    paintLine(context, SHADE, thickness * 0.35, buildPath)
    context.restore()
  }
}

const patternPainters: Record<RadiPattern, DecorateInside> = {
  mandala: (context) => {
    for (const radius of [3, 6]) paintLine(context, WHITE, 0.6, ellipsePath(0, -39, radius, radius))
    for (let ray = 0; ray < 12; ray += 1) {
      const angle = (ray * Math.PI) / 6
      paintLine(context, WHITE, 0.6, linePath(Math.cos(angle) * 3, -39 + Math.sin(angle) * 3, Math.cos(angle) * 6, -39 + Math.sin(angle) * 6))
    }
    for (let dot = 0; dot < 8; dot += 1) {
      const angle = (dot * Math.PI) / 4
      paintFill(context, WHITE, ellipsePath(Math.cos(angle) * 7.5, -39 + Math.sin(angle) * 7.5, 0.6, 0.6))
    }
  },
  flowers: (context) => {
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 10; column += 1) {
        const centerX = -27 + column * 6 + (row % 2) * 3
        const centerY = -30 + row * 4.5
        for (const [offsetX, offsetY] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          paintFill(context, "#ff7aa8", ellipsePath(centerX + offsetX, centerY + offsetY, 0.9, 0.9))
        }
        paintFill(context, "#ffd23f", ellipsePath(centerX, centerY, 0.7, 0.7))
      }
    }
  },
  comic: (context) => {
    const cellColors = ["#ffe066", "#ff8fab", "#8ecae6", "#ff5d5d", WHITE]
    const cellSize = 7
    for (let row = 0; row < 9; row += 1) {
      for (let column = 0; column < 9; column += 1) {
        const cellX = -30 + column * cellSize
        const cellY = -60 + row * cellSize
        context.fillStyle = cellColors[(column + row * 2) % cellColors.length]
        context.fillRect(cellX, cellY, cellSize, cellSize)
        paintLine(context, OUTLINE, 0.5, (path) => path.rect(cellX, cellY, cellSize, cellSize))
      }
    }
  },
  tieDye: (context) => {
    const blobs = [
      [-6, -44, "#ff5fa2"],
      [6, -38, "#7b5cff"],
      [-4, -33, "#ffd23f"],
      [7, -47, "#3ec7e0"],
      [-9, -38, "#58d68d"],
    ] as const
    context.globalAlpha = 0.75
    for (const [blobX, blobY, color] of blobs) paintFill(context, color, ellipsePath(blobX, blobY, 5, 4))
  },
  folk: (context) => {
    for (const rowY of [-44, -38, -32]) {
      paintLine(context, WHITE, 0.6, (path) => {
        path.moveTo(-12, rowY)
        for (let zigzagX = -10; zigzagX <= 12; zigzagX += 2) path.lineTo(zigzagX, rowY + (zigzagX % 4 === 0 ? -1.2 : 1.2))
      })
    }
  },
  lace: (context) => {
    paintFill(context, SKIN, (path) => {
      path.moveTo(-10, -50)
      path.lineTo(10, -50)
      path.lineTo(10, -46)
      path.lineTo(6, -46)
      path.lineTo(0, -38)
      path.lineTo(-6, -46)
      path.lineTo(-10, -46)
      path.closePath()
    })
    for (const side of SIDES) paintLine(context, BLACK_FABRIC, 0.9, linePath(side * 6, -50, side * 6, -46))
    paintLine(context, BLACK_FABRIC, 1.4, (path) => {
      path.moveTo(-10, -46)
      path.lineTo(-6, -46)
      path.lineTo(0, -38)
      path.lineTo(6, -46)
      path.lineTo(10, -46)
    })
    for (let step = 1; step < 6; step += 1) {
      for (const side of SIDES) paintFill(context, BLACK_FABRIC, ellipsePath(side * (6 - step), -45 + step * 1.33, 0.7, 0.7))
    }
    paintFill(context, BLACK_FABRIC, (path) => path.rect(-16, -33.5, 32, 3))
    for (let dotX = -15; dotX <= 15; dotX += 2) paintFill(context, "rgba(255, 255, 255, 0.3)", ellipsePath(dotX, -32, 0.5, 0.5))
    paintLine(context, BLACK_FABRIC, 2, curvesPath([[-16, -18.6, 0, -15.6, 16, -18.6]]))
  },
  sukman: (context) => {
    paintFill(context, WHITE, ellipsePath(0, -49.5, 6.5, 4))
    for (const side of SIDES) {
      paintLine(context, GOLD, 0.7, curvesPath([
        [side * 5, -44, side * 6, -38.5, side * 4.5, -33],
        [side * 5.4, -41, side * 7.4, -42, side * 7.6, -39.8],
        [side * 5.3, -37, side * 3, -38, side * 2.6, -35.8],
        [side * 11, -26, side * 12.5, -22.5, side * 11.5, -19.5],
        [side * 11.6, -23.5, side * 13.6, -24, side * 14, -22],
      ]))
    }
    paintLine(context, BLACK_FABRIC, 1.6, curvesPath([[-16, -19.8, 0, -16.8, 16, -19.8]]))
    paintLine(context, WHITE, 1.4, curvesPath([[-16, -18.2, 0, -15.2, 16, -18.2]]))
  },
}

export const decorationFor = (pattern?: RadiPattern) => (pattern ? patternPainters[pattern] : undefined)

const HAIR_STREAKS: readonly CurveLine[] = [
  [-14, -86, -15, -90, -10, -92.5],
  [-2, -87, -3, -91, 1, -93.5],
  [10, -86, 12, -90, 7, -92.5],
]

const POLISHED_HAIR_STRANDS: readonly CurveLine[] = [
  [-18, -80, -20, -88, -14, -93],
  [-6, -84, -8, -90, -4, -94],
  [5, -84, 4, -90, 8, -93.5],
  [16, -81, 19, -88, 13, -92],
]

const PONYTAIL_LOCKS = [
  [17.6, -86.2, 51.2, -100, 22.4, -77.8],
  [20, -86.8, 56, -82, 20, -77.2],
  [22.4, -86.2, 51.2, -64, 17.6, -77.8],
] as const

const BRAID_LINKS: readonly Point[] = [[-26, -67], [-25.5, -62.5], [-24, -58], [-21.5, -54], [-18, -50.5], [-14, -47.5], [-10, -45], [-7, -41.5], [-5.5, -37.5]]

const HAND_POSITIONS: Record<RadiPose, RadiHands> = {
  wave: [[-14, -32], [27, -57]],
  peace: [[-14, -32], [26, -58]],
  hold: [[5.5, -21], [5.5, -29]],
}

const hairFrontPath = (hair: RadiHair): BuildPath => (path) => {
  if (hair === "loose") {
    path.moveTo(-26, -60)
    path.bezierCurveTo(-32, -106, 32, -106, 26, -60)
    path.quadraticCurveTo(22, -70, 19, -79)
    path.quadraticCurveTo(2, -80, -14, -70)
    path.quadraticCurveTo(-18, -76, -20, -74)
    path.quadraticCurveTo(-21, -66, -26, -60)
  } else {
    path.moveTo(-25.5, -68)
    path.bezierCurveTo(-32, -103, 32, -103, 25.5, -68)
    path.quadraticCurveTo(22, -80, 10, -83)
    path.quadraticCurveTo(0, -85, -10, -83)
    path.quadraticCurveTo(-22, -80, -25.5, -68)
  }
  path.closePath()
}

const bumpyEdgeTo = (path: Path2D, [fromX, fromY]: Point, [toX, toY]: Point, bumps: number, bumpSize: number) => {
  const length = Math.hypot(toX - fromX, toY - fromY)
  const normalX = (toY - fromY) / length
  const normalY = -(toX - fromX) / length
  for (let bump = 0; bump < bumps; bump += 1) {
    const middleProgress = (bump + 0.5) / bumps
    const endProgress = (bump + 1) / bumps
    path.quadraticCurveTo(
      fromX + (toX - fromX) * middleProgress + normalX * bumpSize,
      fromY + (toY - fromY) * middleProgress + normalY * bumpSize,
      fromX + (toX - fromX) * endProgress,
      fromY + (toY - fromY) * endProgress,
    )
  }
}

const kalpakPath: BuildPath = (path) => {
  path.moveTo(-25, -80)
  bumpyEdgeTo(path, [-25, -80], [-27, -113], 6, 1.6)
  bumpyEdgeTo(path, [-27, -113], [0, -117], 5, 1.6)
  bumpyEdgeTo(path, [0, -117], [27, -113], 5, 1.6)
  bumpyEdgeTo(path, [27, -113], [25, -80], 6, 1.6)
  path.quadraticCurveTo(0, -75.5, -25, -80)
  path.closePath()
}

const facePath: BuildPath = (path) => {
  path.ellipse(0, -70, 23, 23, 0, Math.PI, Math.PI * 2)
  path.bezierCurveTo(23, -56, 11, -44, 0, -44)
  path.bezierCurveTo(-11, -44, -23, -56, -23, -70)
  path.closePath()
}

const drawHairBack = (context: Context, hair: RadiHair, isPolished: boolean) => {
  if (hair === "tucked" || hair === "braid") return
  if (hair === "bun") {
    paintShape(context, HAIR, ellipsePath(0, -97, 8, 6.5), shadeIf(isPolished))
    if (isPolished) paintLine(context, HAIR_STRAND, 0.7, curvesPath([[-5, -99, 0, -103, 5, -99]]))
    return
  }
  if (hair === "loose") {
    paintShape(context, HAIR, (path) => {
      path.moveTo(-27, -72)
      path.quadraticCurveTo(-31, -48, -22, -36)
      path.quadraticCurveTo(-11, -32, 0, -36)
      path.quadraticCurveTo(11, -32, 22, -36)
      path.quadraticCurveTo(31, -48, 27, -72)
      path.closePath()
    }, shadeIf(isPolished))
    if (isPolished) paintLine(context, HAIR_STRAND, 0.7, curvesPath([[-24, -62, -27, -50, -20, -40], [24, -62, 27, -50, 20, -40]]))
    return
  }
  if (hair === "sideTail") {
    paintShape(context, HAIR, (path) => {
      path.moveTo(17, -90)
      path.bezierCurveTo(38, -94, 46, -74, 40, -56)
      path.quadraticCurveTo(36, -44, 42, -34)
      path.quadraticCurveTo(30, -42, 30, -58)
      path.bezierCurveTo(30, -72, 26, -80, 21, -78)
      path.closePath()
    }, shadeIf(isPolished))
    paintLine(context, HAIR_HIGHLIGHT, 1.2, curvesPath([[27, -86, 40, -80, 36, -60]]))
    if (isPolished) paintLine(context, HAIR_STRAND, 0.7, curvesPath([[31, -80, 39, -70, 35, -50]]))
    return
  }
  const lockPaths = PONYTAIL_LOCKS.map(([baseStartX, baseStartY, tipX, tipY, baseEndX, baseEndY]): BuildPath => (path) => {
    path.moveTo(baseStartX, baseStartY)
    path.lineTo(tipX, tipY)
    path.lineTo(baseEndX, baseEndY)
    path.closePath()
  })
  for (const lockPath of lockPaths) paintLine(context, OUTLINE, OUTLINE_WIDTH * 2, lockPath)
  for (const lockPath of lockPaths) {
    paintFill(context, HAIR, lockPath)
    if (isPolished) paintShade(context, SHADE, lockPath)
  }
  paintLine(context, HAIR_HIGHLIGHT, 1.2, linePath(27, -83, 42, -82))
}

const shoePainters: Record<RadiShoes, DrawShoe> = {
  sneakers: (context, side, isPolished) => {
    const shoeX = side * 6
    paintShape(context, WHITE, ellipsePath(shoeX, -3, 5.5, 3.5), {
      ...shadeIf(isPolished),
      decorateInside: isPolished ? (shoeContext) => paintFill(shoeContext, "#ddd6cf", (path) => path.rect(shoeX - 6, -1.4, 12, 3)) : undefined,
    })
    if (isPolished) {
      paintLine(context, OUTLINE, 0.6, linePath(shoeX - 1.6, -5.3, shoeX + 1.6, -3.7))
      paintLine(context, OUTLINE, 0.6, linePath(shoeX + 1.6, -5.3, shoeX - 1.6, -3.7))
    } else {
      paintLine(context, OUTLINE, 0.8, linePath(shoeX - 2, -4.5, shoeX + 2, -4.5))
    }
  },
  highTops: (context, side, isPolished) => {
    const shoeX = side * 6
    const legX = side * 5
    paintShape(context, HIGH_TOP_RED, (path) => path.roundRect(legX - 3.5, -10, 7, 8, 2), shadeIf(isPolished))
    for (const laceY of [-9, -7.2]) paintLine(context, WHITE, 0.7, linePath(legX - 1.2, laceY, legX + 1.2, laceY))
    paintShape(context, WHITE, ellipsePath(side * 7.3, -8, 1.1, 1.1))
    paintShape(context, HIGH_TOP_RED, ellipsePath(shoeX, -3, 5.5, 3.5), {
      ...shadeIf(isPolished),
      decorateInside: (shoeContext) => {
        paintFill(shoeContext, WHITE, (path) => path.rect(shoeX - 6, -1.6, 12, 3))
        paintFill(shoeContext, WHITE, ellipsePath(shoeX, -2, 3.2, 1.8))
      },
    })
  },
  tsarvuli: (context, side, isPolished) => {
    const shoeX = side * 6
    const legX = side * 5
    for (const crossY of [-15, -10]) {
      paintLine(context, OUTLINE, 0.9, linePath(legX - 3, crossY - 2.5, legX + 3, crossY + 2.5))
      paintLine(context, OUTLINE, 0.9, linePath(legX + 3, crossY - 2.5, legX - 3, crossY + 2.5))
    }
    paintShape(context, TSARVULI_LEATHER, ellipsePath(shoeX, -3, 5.8, 3.4), {
      ...shadeIf(isPolished),
      decorateInside: isPolished ? (shoeContext) => paintFill(shoeContext, "rgba(255, 255, 255, 0.2)", ellipsePath(shoeX - 2, -4.6, 1.5, 0.7)) : undefined,
    })
    paintLine(context, OUTLINE, 0.6, curvesPath([
      [shoeX - 3, -4.8, shoeX - 2.6, -3.6, shoeX - 2.2, -2.6],
      [shoeX, -5.2, shoeX, -3.9, shoeX, -2.6],
      [shoeX + 3, -4.8, shoeX + 2.6, -3.6, shoeX + 2.2, -2.6],
    ]))
    paintShape(context, "#e0453a", ellipsePath(shoeX, -6, 1.3, 1.3))
  },
  partyHeels: (context, side, isPolished) => {
    const shoeX = side * 6
    const legX = side * 5
    paintTube(context, BLACK_FABRIC, 0.9, linePath(legX - 3, -7.5, legX + 3, -7.5), isPolished)
    paintShape(context, BLACK_FABRIC, ellipsePath(shoeX, -3, 5.2, 3.3), shadeIf(isPolished))
    paintFill(context, "rgba(255, 255, 255, 0.45)", ellipsePath(shoeX - 2, -4.4, 1.6, 0.7))
    for (const [sparkleX, sparkleY] of [[1.5, -4], [3, -2.5], [-0.5, -2]]) {
      paintFill(context, SILVER, ellipsePath(shoeX + side * sparkleX, sparkleY, 0.45, 0.45))
    }
  },
  folkFlats: (context, side, isPolished) => {
    const shoeX = side * 6
    const legX = side * 5
    paintShape(context, BLACK_FABRIC, ellipsePath(shoeX, -3, 5.5, 3.3), shadeIf(isPolished))
    paintFill(context, "rgba(255, 255, 255, 0.35)", ellipsePath(shoeX - 2, -4.2, 1.6, 0.7))
    paintTube(context, BLACK_FABRIC, 0.9, linePath(legX - 3, -6.5, legX + 3, -6.5), isPolished)
    paintFill(context, SILVER, ellipsePath(side * 7.3, -6.5, 0.6, 0.6))
  },
}

export const LEG_COVERS: Partial<Record<RadiShoes, string>> = { tsarvuli: WOOL_WRAP, folkFlats: WHITE }

const drawLegs = (context: Context, shoes: RadiShoes, legLifts: PerSide, kneeBends: PerSide, isPolished: boolean) => {
  SIDES.forEach((side, index) => {
    const legX = side * 5
    context.save()
    context.translate(0, -legLifts[index])
    paintTube(context, LEG_COVERS[shoes] ?? SKIN, 6, (path) => {
      path.moveTo(legX, -19)
      path.lineTo(legX + side * kneeBends[index], -12.5)
      path.lineTo(legX, -6)
    }, isPolished)
    shoePainters[shoes](context, side, isPolished)
    context.restore()
  })
}

const drawBottom = (context: Context, bottom: RadiBottom, isPolished: boolean) => {
  if (bottom.kind === "skirt") {
    paintShape(context, bottom.color, (path) => {
      path.moveTo(-9, -32)
      path.lineTo(9, -32)
      path.lineTo(15, -18)
      path.quadraticCurveTo(0, -15, -15, -18)
      path.closePath()
    }, { ...shadeIf(isPolished), decorateInside: decorationFor(bottom.pattern) })
    return
  }
  paintShape(context, bottom.color, (path) => {
    path.moveTo(-9, -32)
    path.lineTo(9, -32)
    path.lineTo(10.5, -19)
    path.lineTo(1, -19)
    path.lineTo(0, -24)
    path.lineTo(-1, -19)
    path.lineTo(-10.5, -19)
    path.closePath()
  }, { ...shadeIf(isPolished), decorateInside: decorationFor(bottom.pattern) })
}

export const drawTorso = (context: Context, top: RadiTop, isPolished: boolean, halfWidth = 9) => {
  const pattern = decorationFor(top.pattern)
  paintShape(context, top.color, (path) => path.roundRect(-halfWidth, -49, halfWidth * 2, 19, 5), {
    ...shadeIf(isPolished),
    decorateInside: isPolished
      ? (torsoContext) => {
          if (pattern) {
            torsoContext.save()
            pattern(torsoContext)
            torsoContext.restore()
          }
          paintFill(torsoContext, SHADE, ellipsePath(0, -47.5, 8, 3))
        }
      : pattern,
  })
}

const drawDenimJacket = (context: Context, isPolished: boolean) => {
  for (const side of SIDES) {
    paintShape(context, DENIM, (path) => {
      path.moveTo(side * 9.5, -49)
      path.lineTo(side * 3, -49)
      path.lineTo(side * 4.5, -31)
      path.lineTo(side * 9.5, -31)
      path.closePath()
    }, {
      ...shadeIf(isPolished),
      decorateInside: isPolished
        ? (jacketContext) => {
            jacketContext.setLineDash([0.9, 0.7])
            paintLine(jacketContext, "#f0b25a", 0.5, linePath(side * 4.9, -44, side * 5.8, -32))
          }
        : undefined,
    })
    paintShape(context, DENIM, (path) => {
      path.moveTo(side * 3, -49)
      path.lineTo(side * 7.5, -49)
      path.lineTo(side * 4, -44)
      path.closePath()
    }, shadeIf(isPolished))
    paintLine(context, OUTLINE, 0.6, (path) => path.rect(side * 7 - 1.5, -41, 3, 2.5))
    if (isPolished) paintFill(context, "#d9b25a", ellipsePath(side * 5.6, -37, 0.7, 0.7))
  }
}

const drawPendant = (context: Context, isPolished: boolean) => {
  paintLine(context, OUTLINE, 0.6, (path) => {
    path.moveTo(-5, -48)
    path.lineTo(0, -41)
    path.lineTo(5, -48)
  })
  paintShape(context, "#2ec4b6", ellipsePath(0, -40, 1.8, 2.2))
  if (isPolished) paintFill(context, WHITE, ellipsePath(-0.6, -40.9, 0.5, 0.6))
}

const drawHeartNecklace = (context: Context, isPolished: boolean) => {
  paintLine(context, SILVER, 0.5, (path) => {
    path.moveTo(-6, -46.5)
    path.lineTo(0, -41.5)
    path.lineTo(6, -46.5)
  })
  paintShape(context, SILVER, (path) => {
    path.moveTo(0, -38.6)
    path.bezierCurveTo(-2.6, -40.2, -2, -42.6, 0, -41.4)
    path.bezierCurveTo(2, -42.6, 2.6, -40.2, 0, -38.6)
    path.closePath()
  }, shadeIf(isPolished))
  if (isPolished) paintFill(context, WHITE, ellipsePath(-0.8, -40.9, 0.4, 0.4))
}

const drawApron = (context: Context, isPolished: boolean) => {
  paintShape(context, FOLK_YELLOW, (path) => {
    path.moveTo(-6.5, -31)
    path.lineTo(6.5, -31)
    path.lineTo(8.5, -17.4)
    path.quadraticCurveTo(0, -16, -8.5, -17.4)
    path.closePath()
  }, {
    ...shadeIf(isPolished),
    decorateInside: (apronContext) => {
      for (const stripeY of [-27, -21.5]) {
        paintFill(apronContext, "#8f9a8c", (path) => path.rect(-10, stripeY, 20, 1.5))
        for (const edgeY of [stripeY - 0.4, stripeY + 1.9]) paintLine(apronContext, WHITE, 0.5, linePath(-10, edgeY, 10, edgeY))
      }
    },
  })
}

const drawPafti = (context: Context, isPolished: boolean) => {
  paintShape(context, BLACK_FABRIC, (path) => path.roundRect(-9.5, -33.5, 19, 3, 1), shadeIf(isPolished))
  for (const side of SIDES) {
    paintShape(context, SILVER, ellipsePath(side * 2.6, -32, 2.8, 2.3), {
      ...shadeIf(isPolished),
      decorateInside: (buckleContext) => paintLine(buckleContext, "#8d939b", 0.5, ellipsePath(side * 2.6, -32, 1.4, 1.1)),
    })
  }
}

const drawPuffSleeves = (context: Context, isPolished: boolean) => {
  for (const side of SIDES) {
    paintShape(context, WHITE, ellipsePath(side * 11, -41.9, 3.8, 3.4), shadeIf(isPolished))
    paintShape(context, FOLK_YELLOW, ellipsePath(side * 11, -43.3, 4, 3.5), shadeIf(isPolished))
  }
}

const braidTuftPath: BuildPath = (path) => {
  path.moveTo(-3.4, -34.4)
  path.lineTo(-5.6, -29.5)
  path.lineTo(-7.4, -34.7)
  path.closePath()
}

const drawBraid = (context: Context, isPolished: boolean) => {
  const braidPaths = [...BRAID_LINKS.map(([linkX, linkY]) => ellipsePath(linkX, linkY, 3, 3.2)), braidTuftPath]
  for (const braidPath of braidPaths) paintLine(context, OUTLINE, OUTLINE_WIDTH * 2, braidPath)
  for (const braidPath of braidPaths) {
    paintFill(context, HAIR, braidPath)
    if (isPolished) paintShade(context, SHADE, braidPath)
  }
  paintLine(context, OUTLINE, 0.6, curvesPath(BRAID_LINKS.map(([linkX, linkY]) => [linkX - 2.4, linkY + 1, linkX, linkY + 3, linkX + 2.4, linkY + 1] as const)))
  if (isPolished) {
    paintLine(context, HAIR_HIGHLIGHT, 0.8, curvesPath(BRAID_LINKS.map(([linkX, linkY]) => [linkX - 1.8, linkY - 1, linkX - 1, linkY - 2.2, linkX + 0.2, linkY - 2.4] as const)))
  }
  paintShape(context, BLACK_FABRIC, ellipsePath(-5.4, -34.6, 2.2, 1.4))
}

const drawBraidBehindHead = (context: Context, isPolished: boolean) => {
  const headShapes: BuildPath[] = [facePath, hairFrontPath("braid"), ...SIDES.map((side) => ellipsePath(side * 22.5, -66, 4, 5))]
  context.save()
  for (const buildHeadShape of headShapes) {
    const headShape = new Path2D()
    buildHeadShape(headShape)
    const outsideHeadShape = new Path2D()
    outsideHeadShape.rect(-60, -130, 120, 140)
    outsideHeadShape.addPath(headShape)
    context.clip(outsideHeadShape, "evenodd")
  }
  drawBraid(context, isPolished)
  context.restore()
}

export const drawHairFlower = (context: Context, isPolished: boolean) => {
  for (const [leafX, leafY] of [[21.5, -89.5], [13.5, -93.5]]) {
    paintShape(context, LEAF_GREEN, (path) => path.ellipse(leafX, leafY, 3.2, 1.4, 0.46, 0, Math.PI * 2), shadeIf(isPolished))
  }
  const petalPaths = Array.from({ length: 5 }, (_, petal) => {
    const angle = (petal * Math.PI * 2) / 5 - Math.PI / 2
    return ellipsePath(17.5 + Math.cos(angle) * 2.2, -91.5 + Math.sin(angle) * 2.2, 1.8, 1.8)
  })
  for (const petalPath of petalPaths) paintLine(context, OUTLINE, OUTLINE_WIDTH * 2, petalPath)
  for (const petalPath of petalPaths) paintFill(context, WHITE, petalPath)
  paintFill(context, "#ffd23f", ellipsePath(17.5, -91.5, 1.2, 1.2))
}

const drawGaida = (context: Context, isPolished: boolean) => {
  paintShape(context, "#efe3c4", ellipsePath(10, -38, 8, 6.5), {
    ...shadeIf(isPolished),
    decorateInside: isPolished
      ? (bagContext) => {
          for (const [furX, furY] of [[6, -41], [10, -37], [13, -40], [8, -34], [13, -35], [10, -42]]) {
            paintLine(bagContext, "#c9b48c", 0.6, curvesPath([[furX, furY, furX + 1, furY - 1.2, furX + 2, furY]]))
          }
        }
      : undefined,
  })
  paintShape(context, WOOD, (path) => path.roundRect(4.5, -36, 3, 26, 1.5), shadeIf(isPolished))
  if (isPolished) for (const holeY of [-31, -26, -21, -16]) paintFill(context, "#2a1608", ellipsePath(6, holeY, 0.6, 0.6))
  paintShape(context, WOOD, ellipsePath(6, -9, 3, 1.6), shadeIf(isPolished))
}

const drawGaidaBlowpipe = (context: Context, isPolished: boolean) => {
  paintTube(context, WOOD, 1.6, linePath(8, -43, 3, -53.5), isPolished)
}

const drawHead = (context: Context, hair: RadiHair, hasKalpak: boolean, isPolished: boolean) => {
  for (const side of SIDES) paintShape(context, SKIN, ellipsePath(side * 22.5, -66, 4, 5), shadeIf(isPolished))
  paintShape(context, SKIN, facePath, {
    ...shadeIf(isPolished),
    decorateInside: isPolished
      ? (faceContext) => {
          faceContext.translate(0.8, 2.2)
          paintFill(faceContext, SHADE, hairFrontPath(hair))
          if (hasKalpak) paintFill(faceContext, SHADE, kalpakPath)
        }
      : undefined,
  })
}

export const createIrisGradient = (context: Context) => {
  const gradient = context.createLinearGradient(0, -69.5, 0, -58.5)
  gradient.addColorStop(0, "#3a2814")
  gradient.addColorStop(1, "#9a7444")
  return gradient
}

const drawEye = (context: Context, side: number, isOpen: boolean, isPolished: boolean) => {
  const centerX = side * 9
  if (!isOpen) {
    paintLine(context, OUTLINE, 1.6, (path) => {
      path.moveTo(centerX - 4, -63)
      path.quadraticCurveTo(centerX, -69, centerX + 4, -63)
    })
    return
  }
  paintShape(context, isPolished ? createIrisGradient(context) : EYE, ellipsePath(centerX, -64, 4.2, 5.5), {
    decorateInside: isPolished
      ? (irisContext) => {
          paintFill(irisContext, "rgba(0, 0, 0, 0.25)", ellipsePath(centerX, -69, 5, 2.6))
          paintLine(irisContext, "rgba(255, 230, 170, 0.6)", 0.7, (path) => path.ellipse(centerX, -64, 3, 4.3, 0, Math.PI * 0.2, Math.PI * 0.8))
        }
      : undefined,
  })
  paintFill(context, PUPIL, ellipsePath(centerX, -63.2, 2.2, 3))
  paintFill(context, WHITE, ellipsePath(centerX - 1.4, -66.2, 1.5, 1.5))
  paintFill(context, WHITE, ellipsePath(centerX + 1.5, -61.6, 0.7, 0.7))
  if (isPolished) {
    paintFill(context, WHITE, ellipsePath(centerX - 2, -62.6, 0.4, 0.4))
    paintLine(context, OUTLINE, 1.2, (path) => {
      path.moveTo(centerX - 4, -67)
      path.quadraticCurveTo(centerX, -71.2, centerX + 4, -67)
    })
  }
  paintLine(context, OUTLINE, 1.2, linePath(side * 12.5, -67.5, side * 14.5, -69.5))
}

const drawMouth = (context: Context, expression: RadiExpression, isPolished: boolean) => {
  if (expression === "puff") {
    paintShape(context, MOUTH, ellipsePath(2.5, -54, 1.8, 1.8))
    return
  }
  if (expression === "surprised") {
    paintShape(context, MOUTH, ellipsePath(0, -51.5, 3.4, 4.4), {
      decorateInside: (mouthContext) => paintFill(mouthContext, TONGUE, ellipsePath(0, -47.8, 2.8, 1.8)),
    })
    return
  }
  if (expression === "angry") {
    paintShape(context, MOUTH, (path) => {
      path.moveTo(-5.5, -50)
      path.quadraticCurveTo(0, -57, 5.5, -50)
      path.quadraticCurveTo(0, -52.4, -5.5, -50)
      path.closePath()
    }, {
      decorateInside: (mouthContext) => {
        mouthContext.fillStyle = WHITE
        mouthContext.fillRect(-7, -55.4, 14, 2.4)
      },
    })
    return
  }
  paintShape(context, MOUTH, (path) => {
    path.moveTo(-6, -55)
    path.quadraticCurveTo(0, -54, 6, -55)
    path.quadraticCurveTo(0, -45, -6, -55)
    path.closePath()
  }, {
    decorateInside: (mouthContext) => {
      mouthContext.fillStyle = WHITE
      mouthContext.fillRect(-7, -56, 14, 2.6)
      if (isPolished) paintFill(mouthContext, "rgba(0, 0, 0, 0.2)", (path) => path.rect(-7, -53.4, 14, 0.9))
      paintFill(mouthContext, TONGUE, ellipsePath(0, -50, 3, 1.5))
    },
  })
  if (expression === "tongue") {
    paintShape(context, TONGUE, (path) => path.roundRect(-2.8, -52, 5.6, 6.5, 2.8))
    paintLine(context, OUTLINE, 0.6, linePath(0, -50, 0, -47.5))
  }
}

const drawFace = (context: Context, expression: RadiExpression, isPolished: boolean) => {
  const blushSize = expression === "puff" && !isPolished ? 1.4 : 1
  const isAngry = expression === "angry"
  for (const side of SIDES) {
    drawEye(context, side, !(expression === "tongue" && side === 1), isPolished)
    if (isAngry) {
      paintFill(context, SKIN, (path) => {
        path.moveTo(side * 4, -66.4)
        path.lineTo(side * 14, -70.2)
        path.lineTo(side * 14, -73)
        path.lineTo(side * 4, -73)
        path.closePath()
      })
      paintLine(context, OUTLINE, 1.2, linePath(side * 4.2, -66.4, side * 13.8, -70.2))
      paintLine(context, OUTLINE, 1.8, linePath(side * 4.5, -69.4, side * 13, -73.4))
    } else {
      const browLift = expression === "surprised" ? 3 : 0
      paintLine(context, HAIR, 1.2, (path) => {
        path.moveTo(side * 6, -72.5 - browLift)
        path.quadraticCurveTo(side * 9, -74.5 - browLift * 1.4, side * 12, -72.5 - browLift)
      })
    }
    paintFill(context, isAngry ? "rgba(240, 60, 60, 0.5)" : BLUSH, ellipsePath(side * 14, -57, 4 * blushSize, 2.4 * blushSize))
    if (isPolished) paintFill(context, "rgba(255, 255, 255, 0.7)", ellipsePath(side * 14 - 1.6, -58, 0.8, 0.6))
  }
  paintLine(context, OUTLINE, 0.8, linePath(0, -59.5, 0.8, -58.5))
  drawMouth(context, expression, isPolished)
  if (isAngry) {
    paintLine(context, HIGH_TOP_RED, 1.3, curvesPath([
      [12.5, -84, 15, -82.5, 15.2, -80],
      [17.5, -85, 17.8, -82.5, 20.2, -82],
      [13, -78.2, 15.6, -78.4, 16.4, -76],
      [18.6, -80.2, 18.4, -77.6, 21, -77.4],
    ]))
  }
}

const drawSunglasses = (context: Context) => {
  for (const side of SIDES) {
    paintShape(context, "#2b8cff", (path) => {
      path.moveTo(side * 3.5, -68.5)
      path.lineTo(side * 15.5, -68.5)
      path.quadraticCurveTo(side * 16.5, -58, side * 10, -58.5)
      path.quadraticCurveTo(side * 3, -59, side * 3.5, -68.5)
      path.closePath()
    }, { decorateInside: (lensContext) => paintLine(lensContext, "#bfe4ff", 1.5, linePath(side * 6, -60, side * 13, -68)) })
    paintLine(context, OUTLINE, 1.2, linePath(side * 15.5, -67.5, side * 24, -69))
  }
  paintLine(context, OUTLINE, 1.2, linePath(-3.5, -67, 3.5, -67))
}

const drawHairFront = (context: Context, hair: RadiHair, isPolished: boolean) => {
  paintShape(context, HAIR, hairFrontPath(hair), shadeIf(isPolished))
  if (hair === "ponytail" || hair === "sideTail") {
    paintShape(context, "#ff5fa2", ellipsePath(19.5, -87, 2.6, 3))
    if (isPolished) paintFill(context, "rgba(255, 255, 255, 0.6)", ellipsePath(18.7, -88.2, 0.7, 0.9))
  }
  if (isPolished) paintLine(context, HAIR_STRAND, 0.6, curvesPath(POLISHED_HAIR_STRANDS))
  paintLine(context, HAIR_HIGHLIGHT, 1.4, curvesPath(HAIR_STREAKS))
}

const drawBandana = (context: Context, isPolished: boolean) => {
  paintShape(context, BLACK_FABRIC, (path) => {
    path.moveTo(-25.4, -75)
    path.quadraticCurveTo(0, -95, 25.4, -75)
    path.lineTo(24.2, -81)
    path.quadraticCurveTo(0, -100, -24.2, -81)
    path.closePath()
  }, shadeIf(isPolished))
  paintLine(context, WHITE, 0.7, (path) => {
    path.moveTo(-3.5, -89.3)
    path.lineTo(3.5, -89.3)
    path.lineTo(0, -86)
    path.closePath()
  })
  paintFill(context, WHITE, ellipsePath(0, -88.2, 0.6, 0.6))
}

export const drawKalpak = (context: Context, isPolished: boolean) => {
  paintShape(context, KALPAK_FUR, kalpakPath, {
    ...shadeIf(isPolished),
    decorateInside: (hatContext) => {
      paintFill(hatContext, "rgba(255, 255, 255, 0.08)", ellipsePath(-12, -98, 7, 16))
      for (let row = 0; row < 8; row += 1) {
        for (let column = 0; column < 11; column += 1) {
          const curlX = -25 + column * 5 + (row % 2) * 2.5
          const curlY = -112 + row * 4.3
          paintLine(hatContext, "#45424d", 0.7, (path) => path.arc(curlX, curlY, 1.2, Math.PI * 0.9, Math.PI * 2.3))
        }
      }
    },
  })
}

const drawArms = (context: Context, look: RadiLook, hands: RadiHands, elbowBends: PerSide, isPolished: boolean) => {
  const sleeveColor = look.extras.includes("denimJacket") ? DENIM : SKIN
  SIDES.forEach((side, index) => {
    const [handX, handY] = hands[index]
    const shoulderX = side * 8.5
    const shoulderY = -42.5
    const bendPerUnit = elbowBends[index] / (Math.hypot(handX - shoulderX, handY - shoulderY) || 1)
    const elbowX = (shoulderX + handX) / 2 + side * (handY - shoulderY) * bendPerUnit
    const elbowY = (shoulderY + handY) / 2 - side * (handX - shoulderX) * bendPerUnit
    paintTube(context, sleeveColor, 4.5, (path) => {
      path.moveTo(shoulderX, shoulderY)
      path.lineTo(elbowX, elbowY)
      path.lineTo(handX, handY)
    }, isPolished)
    if (look.pose === "peace" && side === 1) {
      paintTube(context, SKIN, 1.8, linePath(handX, handY, handX - 1.5, handY - 6))
      paintTube(context, SKIN, 1.8, linePath(handX, handY, handX + 2.5, handY - 6))
    }
    paintShape(context, SKIN, ellipsePath(handX, handY, 2.8, 2.8), shadeIf(isPolished))
  })
}

const drawHeadphones = (context: Context, isPolished: boolean) => {
  paintTube(context, WHITE, 2, (path) => {
    path.moveTo(-10, -43)
    path.quadraticCurveTo(0, -35, 10, -43)
  }, isPolished)
  for (const side of SIDES) {
    paintShape(context, WHITE, ellipsePath(side * 10.5, -43.5, 3.4, 3.8), shadeIf(isPolished))
    paintFill(context, "#333333", ellipsePath(side * 10.5, -43.5, 1.6, 1.8))
  }
}

export const drawRadi = (context: Context, look: RadiLook, feetX: number, feetY: number, scale: number, motion: Partial<RadiMotion> = {}) => {
  const hasExtra = (extra: RadiExtra) => look.extras.includes(extra)
  const isPolished = look.polished === true
  const { faceTurn = 0, legLifts = [0, 0], kneeBends = [0, 0], hands = HAND_POSITIONS[look.pose], elbowBends = [0, 0] } = motion

  context.save()
  context.translate(feetX, feetY)
  context.scale(scale, scale)
  context.lineJoin = "round"
  context.lineCap = "round"
  context.lineWidth = OUTLINE_WIDTH
  context.strokeStyle = OUTLINE

  drawHairBack(context, look.hair, isPolished)
  drawLegs(context, look.shoes ?? "sneakers", legLifts, kneeBends, isPolished)
  drawBottom(context, look.bottom, isPolished)
  drawTorso(context, look.top, isPolished)
  if (hasExtra("apron")) drawApron(context, isPolished)
  if (hasExtra("pafti")) drawPafti(context, isPolished)
  if (hasExtra("denimJacket")) drawDenimJacket(context, isPolished)
  if (hasExtra("pendant")) drawPendant(context, isPolished)
  if (hasExtra("heartNecklace")) drawHeartNecklace(context, isPolished)
  if (hasExtra("gaida")) drawGaida(context, isPolished)
  drawHead(context, look.hair, hasExtra("kalpak"), isPolished)
  context.save()
  context.translate(faceTurn * 4, 0)
  drawFace(context, look.expression, isPolished)
  context.restore()
  if (hasExtra("sunglasses")) drawSunglasses(context)
  drawHairFront(context, look.hair, isPolished)
  if (hasExtra("bandana")) drawBandana(context, isPolished)
  if (hasExtra("kalpak")) drawKalpak(context, isPolished)
  if (hasExtra("hairFlower")) drawHairFlower(context, isPolished)
  drawArms(context, look, hands, elbowBends, isPolished)
  if (hasExtra("puffSleeves")) drawPuffSleeves(context, isPolished)
  if (look.hair === "braid") drawBraidBehindHead(context, isPolished)
  if (hasExtra("headphones")) drawHeadphones(context, isPolished)
  if (hasExtra("gaida")) drawGaidaBlowpipe(context, isPolished)

  context.restore()
}
