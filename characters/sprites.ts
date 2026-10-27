import type { Context } from "@/characters/paint"

export type SpriteBounds = readonly [left: number, top: number, right: number, bottom: number]
type Sprite = { canvas: HTMLCanvasElement; layer: Context; left: number; top: number; scale: number }

const SPRITE_PAD_PIXELS = 2
const MAX_SPRITES = 400
const sprites = new Map<string, Sprite>()

const forgetSprite = (key: string, { canvas }: Sprite) => {
  canvas.width = 0
  canvas.height = 0
  sprites.delete(key)
}

export const releaseSprites = (prefix: string) => {
  for (const [key, sprite] of sprites) {
    if (key.startsWith(prefix)) forgetSprite(key, sprite)
  }
}

export const snapToPixel = (context: Context, x: number, y: number): readonly [number, number] => {
  const { a, b, c, d, e, f } = context.getTransform()
  if (b !== 0 || c !== 0 || a === 0 || d === 0) return [x, y]
  return [x + (Math.round(a * x + e) - (a * x + e)) / a, y + (Math.round(d * y + f) - (d * y + f)) / d]
}

const isLayerLost =(layer: Context) => (layer as Context & { isContextLost?: () => boolean }).isContextLost?.() === true

const buildSprite = (context: Context, scale: number, [left, top, right, bottom]: SpriteBounds, draw: (layer: Context) => void): Sprite | null => {
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil((right - left) * scale) + SPRITE_PAD_PIXELS * 2
  canvas.height = Math.ceil((bottom - top) * scale) + SPRITE_PAD_PIXELS * 2
  const layer = canvas.getContext("2d")
  if (!layer) return null
  layer.setTransform(scale, 0, 0, scale, SPRITE_PAD_PIXELS - left * scale, SPRITE_PAD_PIXELS - top * scale)
  layer.strokeStyle = context.strokeStyle
  layer.lineWidth = context.lineWidth
  layer.lineJoin = context.lineJoin
  layer.lineCap = context.lineCap
  draw(layer)
  return { canvas, layer, left: left - SPRITE_PAD_PIXELS / scale, top: top - SPRITE_PAD_PIXELS / scale, scale }
}

export const paintSprite = (context: Context, key: string, anchorX: number, anchorY: number, bounds: SpriteBounds, draw: (layer: Context) => void) => {
  const { a, b, c, d, e, f } = context.getTransform()
  const scale = Math.round(Math.hypot(a, b) * 1000) / 1000
  const fullKey = `${key} ${scale} ${context.strokeStyle} ${context.lineWidth} ${context.lineJoin} ${context.lineCap}`
  let sprite = sprites.get(fullKey)
  if (sprite) sprites.delete(fullKey)
  if (!sprite || isLayerLost(sprite.layer)) {
    sprite = buildSprite(context, scale, bounds, draw) ?? undefined
    if (!sprite) {
      context.save()
      context.translate(anchorX, anchorY)
      draw(context)
      context.restore()
      return
    }
    const oldest = sprites.entries().next().value
    if (oldest && sprites.size >= MAX_SPRITES) forgetSprite(...oldest)
  }
  sprites.set(fullKey, sprite)
  const left = anchorX + sprite.left
  const top = anchorY + sprite.top
  if (b === 0 && c === 0 && Math.abs(a) === Math.abs(d)) {
    context.save()
    context.setTransform(Math.sign(a), 0, 0, Math.sign(d), Math.round(a * left + e), Math.round(d * top + f))
    context.drawImage(sprite.canvas, 0, 0)
    context.restore()
    return
  }
  context.drawImage(sprite.canvas, left, top, sprite.canvas.width / sprite.scale, sprite.canvas.height / sprite.scale)
}
