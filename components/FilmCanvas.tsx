"use client"

import { useEffect, useRef } from "react"
import { drawRadiConcepts } from "@/characters/radiConcepts"
import { useFilmStore } from "@/store/film"

const paintConcepts = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d")
  if (!context) return

  const ratio = window.devicePixelRatio || 1
  const width = window.innerWidth
  const height = window.innerHeight

  canvas.width = Math.floor(width * ratio)
  canvas.height = Math.floor(height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.fillStyle = "#000000"
  context.fillRect(0, 0, width, height)
  drawRadiConcepts(context, width, height)
}

const readScrollProgress = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
  if (scrollableHeight <= 0) return 0
  return Math.min(1, Math.max(0, window.scrollY / scrollableHeight))
}

export const FilmCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => paintConcepts(canvas)
    const updateProgress = () => {
      useFilmStore.getState().setProgress(readScrollProgress())
    }
    const onResize = () => {
      draw()
      updateProgress()
    }

    draw()
    updateProgress()
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", updateProgress, { passive: true })
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", updateProgress)
    }
  }, [])

  return <canvas ref={canvasRef} />
}
