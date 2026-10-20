"use client"

import { useEffect, useRef } from "react"
import { drawOpeningScene } from "@/scenes/openingScene"
import { useFilmStore } from "@/store/film"

const resizeCanvas = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.floor(window.innerWidth * ratio)
  canvas.height = Math.floor(window.innerHeight * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
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
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    let animationFrameId = 0
    let shownProgress = readScrollProgress()
    let previousTimeMilliseconds: number | null = null
    const drawFrame = (timeMilliseconds: number) => {
      const elapsedSeconds = previousTimeMilliseconds === null ? 0 : (timeMilliseconds - previousTimeMilliseconds) / 1000
      previousTimeMilliseconds = timeMilliseconds
      const targetProgress = useFilmStore.getState().progress
      shownProgress += (targetProgress - shownProgress) * (1 - Math.exp(-elapsedSeconds * 6))
      drawOpeningScene(context, window.innerWidth, window.innerHeight, timeMilliseconds / 1000, shownProgress)
      animationFrameId = requestAnimationFrame(drawFrame)
    }
    const updateProgress = () => {
      useFilmStore.getState().setProgress(readScrollProgress())
    }
    const onResize = () => {
      resizeCanvas(canvas, context)
      updateProgress()
    }

    resizeCanvas(canvas, context)
    updateProgress()
    animationFrameId = requestAnimationFrame(drawFrame)
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", updateProgress, { passive: true })
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", updateProgress)
    }
  }, [])

  return <canvas ref={canvasRef} />
}
