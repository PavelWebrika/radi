"use client"

import { useEffect, useRef } from "react"
import { drawOpeningScene, greetingButtonLayout } from "@/scenes/openingScene"
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

const placeMoreButton = (button: HTMLButtonElement, layout: ReturnType<typeof greetingButtonLayout>) => {
  button.dataset.visible = String(layout !== null)
  button.tabIndex = layout ? 0 : -1
  if (!layout) return
  button.style.left = `${layout.centerX}px`
  button.style.top = `${layout.centerY}px`
  button.style.width = `${layout.width}px`
  button.style.fontSize = `${layout.fontSize}px`
}

export const FilmCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)

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
      if (moreButtonRef.current) placeMoreButton(moreButtonRef.current, greetingButtonLayout(window.innerWidth, window.innerHeight, shownProgress))
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

  return (
    <>
      <canvas ref={canvasRef} />
      <button ref={moreButtonRef} type="button" className="more-button" data-visible="false" tabIndex={-1}>
        {"Don't you want to know more about me?"}
      </button>
    </>
  )
}
