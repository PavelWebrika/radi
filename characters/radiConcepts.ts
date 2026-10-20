import { drawRadi, type RadiLook } from "@/characters/radi"

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

export const everydayRadiLook = polishConcept(everydayConcept).look

const radiConcepts: RadiConcept[] = [
  polishConcept(everydayConcept),
  polishConcept(popArtConcept, { shoes: "highTops" }),
  polishConcept(sunnyConcept),
  polishConcept(gaidaConcept, { hair: "tucked", extras: ["pendant", "gaida", "kalpak"], shoes: "tsarvuli" }),
  polishConcept({
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
  }),
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

const CHARACTER_HEIGHT_UNITS = 125
const CHARACTER_WIDTH_UNITS = 116
const PANEL_TOP = 72
const PANEL_GAP = 16

const drawConceptPanel = (
  context: CanvasRenderingContext2D,
  concept: RadiConcept,
  label: string,
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number,
) => {
  const fontSize = Math.min(28, Math.max(14, Math.min(panelWidth, panelHeight) * 0.07))
  const labelSpace = fontSize * 2.4
  const feetX = panelX + panelWidth / 2
  const feetY = panelY + panelHeight - labelSpace
  const characterScale = Math.min(
    (panelHeight - labelSpace - 20) / CHARACTER_HEIGHT_UNITS,
    panelWidth / CHARACTER_WIDTH_UNITS,
  )

  context.beginPath()
  context.roundRect(panelX, panelY, panelWidth, panelHeight, 18)
  context.fillStyle = concept.background
  context.fill()
  context.lineWidth = 4
  context.strokeStyle = "#2b1d1a"
  context.stroke()

  context.beginPath()
  context.ellipse(feetX, feetY, 22 * characterScale, 3 * characterScale, 0, 0, Math.PI * 2)
  context.fillStyle = "rgba(0, 0, 0, 0.15)"
  context.fill()

  drawRadi(context, concept.look, feetX, feetY, characterScale)

  context.font = `${fontSize}px "Comic Sans MS", "Comic Sans", cursive`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillStyle = "#2b1d1a"
  context.fillText(label, feetX, panelY + panelHeight - labelSpace / 2)
}

export const drawRadiConcepts = (context: CanvasRenderingContext2D, width: number, height: number) => {
  const columns = width >= 900 ? 4 : 2
  const rows = Math.ceil(radiConcepts.length / columns)
  const panelWidth = (width - PANEL_GAP * (columns + 1)) / columns
  const panelHeight = (height - PANEL_TOP - PANEL_GAP * rows) / rows

  radiConcepts.forEach((concept, index) => {
    const panelX = PANEL_GAP + (index % columns) * (panelWidth + PANEL_GAP)
    const panelY = PANEL_TOP + Math.floor(index / columns) * (panelHeight + PANEL_GAP)
    drawConceptPanel(context, concept, `${index + 1}. ${concept.name}`, panelX, panelY, panelWidth, panelHeight)
  })
}
