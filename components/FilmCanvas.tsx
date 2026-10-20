"use client"

import { useEffect, useRef } from "react"
import { drawRadiConcepts } from "@/characters/radiConcepts"
import { anywayButtonLayout, CITY_SCENE_END, drawCityScene, DRIVE_CRUISE_SECONDS, DRIVE_MAX_BOOST, DRIVE_READY_SECONDS, KIRA_POP_PROGRESS } from "@/scenes/cityScene"
import { drawClubScene } from "@/scenes/clubScene"
import { FILM_SCENES } from "@/scenes/filmScenes"
import { drawOpeningScene, greetingButtonLayout, KIRA_SCENE_END, type BubbleButtonLayout } from "@/scenes/openingScene"
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

const DRIVE_BOOST_PER_PIXEL = 0.006
const WHEEL_LINE_PIXELS = 16

const placeBubbleButton = (button: HTMLButtonElement, layout: BubbleButtonLayout) => {
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
  const anywayButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    let animationFrameId = 0
    let shownProgress = readScrollProgress()
    let previousTimeMilliseconds: number | null = null
    let meetingStartMilliseconds: number | null = null
    let anywayStartMilliseconds: number | null = null
    let latestAnywaySeconds: number | null = null
    let driveProgress: number | null = null
    let driveSpeed = 0
    let driveBoost = 0
    let arrivalStartMilliseconds: number | null = null
    let kiraStartMilliseconds: number | null = null
    let clubStartMilliseconds: number | null = null
    let lastTouchY: number | null = null
    const drawFrame = (timeMilliseconds: number) => {
      const elapsedSeconds = previousTimeMilliseconds === null ? 0 : (timeMilliseconds - previousTimeMilliseconds) / 1000
      previousTimeMilliseconds = timeMilliseconds
      const { progress: targetProgress, isShowingConcepts } = useFilmStore.getState()
      shownProgress += (targetProgress - shownProgress) * (1 - Math.exp(-elapsedSeconds * 6))
      const greetingLayout = greetingButtonLayout(window.innerWidth, window.innerHeight, shownProgress)
      if (!greetingLayout) {
        meetingStartMilliseconds = null
        clubStartMilliseconds = null
      }
      const meetingSeconds = meetingStartMilliseconds === null ? null : Math.max(0, timeMilliseconds - meetingStartMilliseconds) / 1000
      const citySeconds = meetingSeconds !== null && meetingSeconds >= KIRA_SCENE_END ? meetingSeconds - KIRA_SCENE_END : null
      if (citySeconds === null) anywayStartMilliseconds = null
      const anywaySeconds = anywayStartMilliseconds === null ? null : Math.max(0, timeMilliseconds - anywayStartMilliseconds) / 1000
      latestAnywaySeconds = isShowingConcepts ? null : anywaySeconds
      if (anywaySeconds === null) {
        driveProgress = null
        driveSpeed = 0
        driveBoost = 0
        arrivalStartMilliseconds = null
        kiraStartMilliseconds = null
      }
      if (driveProgress !== null) {
        driveSpeed += (1 + driveBoost - driveSpeed) * (1 - Math.exp(-elapsedSeconds * 4))
        driveProgress = Math.min(1, driveProgress + (driveSpeed * elapsedSeconds) / DRIVE_CRUISE_SECONDS)
        driveBoost *= Math.exp(-elapsedSeconds * 4)
        if (driveProgress >= KIRA_POP_PROGRESS) kiraStartMilliseconds ??= timeMilliseconds
        if (driveProgress >= 1) arrivalStartMilliseconds ??= timeMilliseconds
      }
      const secondsSince = (startMilliseconds: number | null) => (startMilliseconds === null ? null : Math.max(0, timeMilliseconds - startMilliseconds) / 1000)
      const drive = driveProgress === null
        ? null
        : { progress: driveProgress, speed: driveSpeed, kiraSeconds: secondsSince(kiraStartMilliseconds), arrivalSeconds: secondsSince(arrivalStartMilliseconds) }
      if (drive?.arrivalSeconds != null && drive.arrivalSeconds >= CITY_SCENE_END) clubStartMilliseconds ??= timeMilliseconds
      const clubSeconds = secondsSince(clubStartMilliseconds)
      if (isShowingConcepts) {
        context.fillStyle = "#000000"
        context.fillRect(0, 0, window.innerWidth, window.innerHeight)
        drawRadiConcepts(context, window.innerWidth, window.innerHeight)
      } else if (clubSeconds !== null) {
        drawClubScene(context, window.innerWidth, window.innerHeight, timeMilliseconds / 1000, clubSeconds)
      } else if (citySeconds !== null) {
        drawCityScene(context, window.innerWidth, window.innerHeight, timeMilliseconds / 1000, citySeconds, anywaySeconds, drive)
      } else {
        drawOpeningScene(context, window.innerWidth, window.innerHeight, timeMilliseconds / 1000, shownProgress, meetingSeconds)
      }
      const moreLayout = isShowingConcepts || meetingSeconds !== null ? null : greetingLayout
      const anywayLayout = isShowingConcepts || citySeconds === null || clubSeconds !== null ? null : anywayButtonLayout(window.innerWidth, window.innerHeight, citySeconds, anywaySeconds)
      if (moreButtonRef.current) placeBubbleButton(moreButtonRef.current, moreLayout)
      if (anywayButtonRef.current) placeBubbleButton(anywayButtonRef.current, anywayLayout)
      animationFrameId = requestAnimationFrame(drawFrame)
    }
    const startMeetingKira = () => {
      meetingStartMilliseconds = performance.now()
    }
    const startCoolRadi = () => {
      anywayStartMilliseconds = performance.now()
    }
    const pressGas = (scrollPixels: number) => {
      if (scrollPixels <= 0 || latestAnywaySeconds === null || latestAnywaySeconds < DRIVE_READY_SECONDS) return
      driveProgress ??= 0
      driveBoost = Math.min(DRIVE_MAX_BOOST, driveBoost + scrollPixels * DRIVE_BOOST_PER_PIXEL)
    }
    const onWheel = (event: WheelEvent) => {
      pressGas(event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? event.deltaY : event.deltaY * WHEEL_LINE_PIXELS)
    }
    const onTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? null
    }
    const onTouchMove = (event: TouchEvent) => {
      const touchY = event.touches[0]?.clientY
      if (touchY === undefined) return
      if (lastTouchY !== null) pressGas(lastTouchY - touchY)
      lastTouchY = touchY
    }
    const unsubscribeFromScenes = useFilmStore.subscribe(({ sceneSelection }, previousState) => {
      if (!sceneSelection || sceneSelection === previousState.sceneSelection) return
      const chosenScene = FILM_SCENES.find(({ id }) => id === sceneSelection.sceneId)
      const startSeconds = chosenScene?.meetingStartSeconds ?? null
      window.scrollTo({ top: startSeconds === null ? 0 : document.documentElement.scrollHeight, behavior: "instant" })
      updateProgress()
      shownProgress = useFilmStore.getState().progress
      meetingStartMilliseconds = startSeconds === null ? null : performance.now() - startSeconds * 1000
      anywayStartMilliseconds = null
      clubStartMilliseconds = sceneSelection.sceneId === "nightClub" ? performance.now() : null
    })
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
    window.addEventListener("wheel", onWheel, { passive: true })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    const moreButton = moreButtonRef.current
    moreButton?.addEventListener("click", startMeetingKira)
    const anywayButton = anywayButtonRef.current
    anywayButton?.addEventListener("click", startCoolRadi)
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", updateProgress)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      moreButton?.removeEventListener("click", startMeetingKira)
      anywayButton?.removeEventListener("click", startCoolRadi)
      unsubscribeFromScenes()
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} />
      <button ref={moreButtonRef} type="button" className="more-button" data-visible="false" tabIndex={-1}>
        {"Don't you want to know more about me?"}
      </button>
      <button ref={anywayButtonRef} type="button" className="more-button" data-visible="false" tabIndex={-1}>
        Anyway...
      </button>
    </>
  )
}
