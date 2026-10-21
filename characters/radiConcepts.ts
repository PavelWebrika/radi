import { drawKiraFront, drawKiraSide } from "@/characters/kira"
import { drawRadi, type RadiLook } from "@/characters/radi"
import { drawRadiSide } from "@/characters/radiSide"

type RadiConcept = {
  name: string
  background: string
  look: RadiLook
}

const originalConcepts: RadiConcept[] = [
  {
    name: "Everyday Radi",
    background: "#ffd23f",
    look: {
      hair: "sideTail",
      expression: "grin",
      pose: "wave",
      top: { color: "#222222", pattern: "mandala" },
      bottom: { kind: "skirt", color: "#fff4dc", pattern: "flowers" },
      extras: [],
    },
  },
  {
    name: "Pop Art Radi",
    background: "#ff6fb5",
    look: {
      hair: "loose",
      expression: "tongue",
      pose: "peace",
      top: { color: "#ffffff", pattern: "comic" },
      bottom: { kind: "skirt", color: "#ffffff", pattern: "comic" },
      extras: ["denimJacket"],
    },
  },
  {
    name: "Sunny Radi",
    background: "#ff9f43",
    look: {
      hair: "ponytail",
      expression: "grin",
      pose: "wave",
      top: { color: "#ffffff", pattern: "tieDye" },
      bottom: { kind: "shorts", color: "#4a74b8" },
      extras: ["bandana", "pendant"],
    },
  },
  {
    name: "Gaida Radi",
    background: "#7bd66b",
    look: {
      hair: "ponytail",
      expression: "puff",
      pose: "hold",
      top: { color: "#e0453a", pattern: "folk" },
      bottom: { kind: "shorts", color: "#c2b8a0" },
      extras: ["pendant", "gaida"],
    },
  },
]

const polishConcept = (concept: RadiConcept, lookChanges: Partial<RadiLook> = {}): RadiConcept => ({
  ...concept,
  name: `${concept.name} (polished)`,
  look: { ...concept.look, ...lookChanges, polished: true },
})

const [everydayConcept, popArtConcept, sunnyConcept, gaidaConcept] = originalConcepts

const polishedPopArtConcept = polishConcept(popArtConcept, { shoes: "highTops" })

const polishedNightClubConcept = polishConcept({
  name: "Night Club Radi",
  background: "#8a5cff",
  look: {
    hair: "braid",
    expression: "tongue",
    pose: "wave",
    top: { color: "#d7263d", pattern: "lace" },
    bottom: { kind: "skirt", color: "#d7263d", pattern: "lace" },
    extras: ["heartNecklace"],
    shoes: "partyHeels",
  },
})

export const everydayRadiLook = polishConcept(everydayConcept).look
export const popArtRadiLook = polishedPopArtConcept.look
export const nightClubRadiLook = polishedNightClubConcept.look

const bookwormConcept = polishConcept({
  name: "Bookworm Radi",
  background: "#7ec8c3",
  look: {
    hair: "bob",
    expression: "grin",
    pose: "wave",
    top: { color: "#ff6d8f", label: "BOOKS!" },
    bottom: { kind: "shorts", color: "#1b2438", pattern: "tropical" },
    extras: ["readingGlasses"],
    shoes: "sneakers",
  },
})

export const bookwormRadiLook = bookwormConcept.look

const radiConcepts: RadiConcept[] = [
  polishConcept(everydayConcept),
  polishedPopArtConcept,
  polishConcept(sunnyConcept),
  polishConcept(gaidaConcept, { hair: "tucked", extras: ["pendant", "gaida", "kalpak"], shoes: "tsarvuli" }),
  polishedNightClubConcept,
  bookwormConcept,
  polishConcept({
    name: "Folk Dance Radi",
    background: "#7cc8ff",
    look: {
      hair: "bun",
      expression: "grin",
      pose: "wave",
      top: { color: "#1f7a45", pattern: "sukman" },
      bottom: { kind: "skirt", color: "#1f7a45", pattern: "sukman" },
      extras: ["apron", "pafti", "puffSleeves", "hairFlower"],
      shoes: "folkFlats",
    },
  }),
]

type DrawFigure = (context: CanvasRenderingContext2D, feetX: number, feetY: number, scale: number) => void

type ConceptPanel = {
  name: string
  background: string
  heightUnits: number
  sideShadowUnits: number
  drawFront: DrawFigure
  drawSide: DrawFigure
}

const conceptPanels: ConceptPanel[] = [
  ...radiConcepts.map(({ name, background, look }): ConceptPanel => ({
    name,
    background,
    heightUnits: 125,
    sideShadowUnits: 22,
    drawFront: (context, feetX, feetY, scale) => drawRadi(context, look, feetX, feetY, scale),
    drawSide: (context, feetX, feetY, scale) => drawRadiSide(context, look, feetX, feetY, scale),
  })),
  { name: "Kira", background: "#ffb3c7", heightUnits: 80, sideShadowUnits: 40, drawFront: drawKiraFront, drawSide: drawKiraSide },
]

const FRONT_HALF_WIDTH_UNITS = 58
const SIDE_BACK_UNITS = 55
const SIDE_FRONT_UNITS = 35
const PAIR_WIDTH_UNITS = FRONT_HALF_WIDTH_UNITS * 2 + SIDE_BACK_UNITS + SIDE_FRONT_UNITS
const PANEL_TOP = 72
const PANEL_GAP = 16

const drawConceptPanel = (
  context: CanvasRenderingContext2D,
  panel: ConceptPanel,
  label: string,
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number,
) => {
  const fontSize = Math.min(28, Math.max(14, Math.min(panelWidth, panelHeight) * 0.07))
  const labelSpace = fontSize * 2.4
  const centerX = panelX + panelWidth / 2
  const feetY = panelY + panelHeight - labelSpace
  const characterScale = Math.min(
    (panelHeight - labelSpace - 20) / panel.heightUnits,
    panelWidth / PAIR_WIDTH_UNITS,
  )
  const frontFeetX = centerX - (PAIR_WIDTH_UNITS / 2 - FRONT_HALF_WIDTH_UNITS) * characterScale
  const sideFeetX = frontFeetX + (FRONT_HALF_WIDTH_UNITS + SIDE_BACK_UNITS) * characterScale

  context.beginPath()
  context.roundRect(panelX, panelY, panelWidth, panelHeight, 18)
  context.fillStyle = panel.background
  context.fill()
  context.lineWidth = 4
  context.strokeStyle = "#2b1d1a"
  context.stroke()

  context.fillStyle = "rgba(0, 0, 0, 0.15)"
  for (const [shadowX, shadowUnits] of [[frontFeetX, 22], [sideFeetX, panel.sideShadowUnits]]) {
    context.beginPath()
    context.ellipse(shadowX, feetY, shadowUnits * characterScale, 3 * characterScale, 0, 0, Math.PI * 2)
    context.fill()
  }

  panel.drawFront(context, frontFeetX, feetY, characterScale)
  panel.drawSide(context, sideFeetX, feetY, characterScale)

  context.font = `${fontSize}px "Comic Sans MS", "Comic Sans", cursive`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillStyle = "#2b1d1a"
  context.fillText(label, centerX, panelY + panelHeight - labelSpace / 2)
}

export const drawRadiConcepts = (context: CanvasRenderingContext2D, width: number, height: number) => {
  const columns = width >= 1200 ? 4 : width >= 900 ? 3 : 2
  const rows = Math.ceil(conceptPanels.length / columns)
  const panelWidth = (width - PANEL_GAP * (columns + 1)) / columns
  const panelHeight = (height - PANEL_TOP - PANEL_GAP * rows) / rows

  conceptPanels.forEach((panel, index) => {
    const panelX = PANEL_GAP + (index % columns) * (panelWidth + PANEL_GAP)
    const panelY = PANEL_TOP + Math.floor(index / columns) * (panelHeight + PANEL_GAP)
    drawConceptPanel(context, panel, `${index + 1}. ${panel.name}`, panelX, panelY, panelWidth, panelHeight)
  })
}
