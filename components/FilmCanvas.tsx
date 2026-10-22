"use client"

import { useEffect, useRef } from "react"
import { drawRadiConcepts } from "@/characters/radiConcepts"
import { anywayButtonLayout, CITY_SCENE_END, drawCityScene, DRIVE_CRUISE_SECONDS, DRIVE_MAX_BOOST, DRIVE_READY_SECONDS, KIRA_POP_PROGRESS, RADI_EXIT_START } from "@/scenes/cityScene"
import { CLUB_SCENE_END, drawClubScene, LAUNCH_START, letsDanceButtonLayout, playedClubSeconds } from "@/scenes/clubScene"
import { FILM_SCENES } from "@/scenes/filmScenes"
import {
  drawLibraryScene,
  libraryQuizChoiceLayouts,
  QUIZ_ADVANCE_AFTER_WRONG,
  RIGHT_CHEER_SECONDS,
  CHEER_MOVE_SECONDS,
  type CaptainChoice,
  type FinalChoice,
  type JokeChoice,
  type LibraryQuizPhase,
} from "@/scenes/libraryScene"
import { drawOpeningScene, greetingButtonLayout, KIRA_SCENE_END, startButtonLayout, type BubbleButtonLayout } from "@/scenes/openingScene"
import { createBackgroundPlaylist } from "@/audio/backgroundPlaylist"
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

const placeQuizButton = (button: HTMLButtonElement, layout: { centerX: number; centerY: number; width: number; height: number } | null, chosen: boolean) => {
  button.dataset.visible = String(layout !== null)
  button.dataset.chosen = String(chosen)
  button.tabIndex = layout ? 0 : -1
  if (!layout) return
  button.style.left = `${layout.centerX}px`
  button.style.top = `${layout.centerY}px`
  button.style.width = `${layout.width}px`
  button.style.height = `${layout.height}px`
}

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
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const anywayButtonRef = useRef<HTMLButtonElement>(null)
  const letsDanceButtonRef = useRef<HTMLButtonElement>(null)
  const nemoButtonRef = useRef<HTMLButtonElement>(null)
  const americaButtonRef = useRef<HTMLButtonElement>(null)
  const janewayButtonRef = useRef<HTMLButtonElement>(null)

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
    let songFadeDirection: "in" | "out" | null = null
    let songFadeStartedAt: number | null = null
    const driveSong = new Audio("/song1.mp3")
    const stopDriveSong = () => {
      driveSong.volume = 0
      driveSong.pause()
      if (driveSong.currentTime > 0) driveSong.currentTime = 0
      driveSong.volume = 1
      songFadeDirection = null
      songFadeStartedAt = null
    }
    const fadeSong = (timeMilliseconds: number) => {
      if (songFadeDirection === null || songFadeStartedAt === null) return
      const fadeUnit = Math.min(1, Math.max(0, (timeMilliseconds - songFadeStartedAt) / 2000))
      const fade = fadeUnit * fadeUnit * (3 - 2 * fadeUnit)
      driveSong.volume = songFadeDirection === "in" ? fade : 1 - fade
      if (songFadeDirection === "out" && fadeUnit >= 1) stopDriveSong()
    }
    let danceFadeDirection: "in" | "out" | null = null
    let danceFadeStartedAt: number | null = null
    const danceSong = new Audio("/song2.mp3")
    const stopDanceSong = () => {
      danceSong.volume = 0
      danceSong.pause()
      if (danceSong.currentTime > 0) danceSong.currentTime = 0
      danceSong.volume = 1
      danceFadeDirection = null
      danceFadeStartedAt = null
    }
    const fadeDanceSong = (timeMilliseconds: number) => {
      if (danceFadeDirection === null || danceFadeStartedAt === null) return
      const fadeUnit = Math.min(1, Math.max(0, (timeMilliseconds - danceFadeStartedAt) / (danceFadeDirection === "in" ? 1000 : 3000)))
      const fade = fadeUnit * fadeUnit * (3 - 2 * fadeUnit)
      danceSong.volume = danceFadeDirection === "in" ? fade : 1 - fade
      if (danceFadeDirection === "out" && fadeUnit >= 1) stopDanceSong()
    }
    const backgroundPlaylist = createBackgroundPlaylist()
    let arrivalStartMilliseconds: number | null = null
    let kiraStartMilliseconds: number | null = null
    let clubStartMilliseconds: number | null = null
    let letsDanceStartMilliseconds: number | null = null
    let libraryStartMilliseconds: number | null = null
    let libraryQuizPhase: LibraryQuizPhase = "captain"
    let captainChoice: CaptainChoice | null = null
    let hoveredCaptain: CaptainChoice | null = null
    let jokeChoice: JokeChoice | null = null
    let hoveredJoke: JokeChoice | null = null
    let finalChoice: FinalChoice | null = null
    let hoveredFinal: FinalChoice | null = null
    let jokeQuizStartSeconds: number | null = null
    let finalQuizStartSeconds: number | null = null
    let wrongStartMilliseconds: number | null = null
    let cheerStartMilliseconds: number | null = null
    let cheerQuestionStarted = false
    let batmanStartMilliseconds: number | null = null
    let boringShakeStartMilliseconds: number | null = null
    let lastTouchY: number | null = null
    let scrollOpen = false
    const drawFrame = (timeMilliseconds: number) => {
      const elapsedSeconds = previousTimeMilliseconds === null ? 0 : (timeMilliseconds - previousTimeMilliseconds) / 1000
      previousTimeMilliseconds = timeMilliseconds
      const { progress: targetProgress, isShowingConcepts } = useFilmStore.getState()
      shownProgress += (targetProgress - shownProgress) * (1 - Math.exp(-elapsedSeconds * 6))
      const greetingLayout = greetingButtonLayout(window.innerWidth, window.innerHeight, shownProgress)
      if (!greetingLayout) {
        meetingStartMilliseconds = null
        clubStartMilliseconds = null
        libraryStartMilliseconds = null
      }
      const meetingSeconds = meetingStartMilliseconds === null ? null : Math.max(0, timeMilliseconds - meetingStartMilliseconds) / 1000
      const citySeconds = meetingSeconds !== null && meetingSeconds >= KIRA_SCENE_END ? meetingSeconds - KIRA_SCENE_END : null
      if (citySeconds === null) anywayStartMilliseconds = null
      const anywaySeconds = anywayStartMilliseconds === null ? null : Math.max(0, timeMilliseconds - anywayStartMilliseconds) / 1000
      latestAnywaySeconds = isShowingConcepts ? null : anywaySeconds
      if (anywaySeconds === null) {
        if (driveProgress !== null) stopDriveSong()
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
      if (songFadeDirection === "in" && !driveSong.paused && drive?.arrivalSeconds != null && drive.arrivalSeconds >= RADI_EXIT_START) {
        songFadeDirection = "out"
        songFadeStartedAt = timeMilliseconds
      }
      fadeSong(timeMilliseconds)
      if (drive?.arrivalSeconds != null && drive.arrivalSeconds >= CITY_SCENE_END) clubStartMilliseconds ??= timeMilliseconds
      const clubSeconds = secondsSince(clubStartMilliseconds)
      if (clubSeconds === null) letsDanceStartMilliseconds = null
      const letsDanceSeconds = secondsSince(letsDanceStartMilliseconds)
      const playedClub = clubSeconds === null ? null : playedClubSeconds(clubSeconds, letsDanceSeconds)
      if (playedClub !== null && playedClub >= CLUB_SCENE_END) libraryStartMilliseconds ??= timeMilliseconds
      if (letsDanceStartMilliseconds === null) {
        if (!danceSong.paused || danceFadeStartedAt !== null) stopDanceSong()
      } else if (playedClub !== null && playedClub >= LAUNCH_START && danceFadeDirection === "in" && !danceSong.paused) {
        danceFadeDirection = "out"
        danceFadeStartedAt = timeMilliseconds
      }
      fadeDanceSong(timeMilliseconds)
      backgroundPlaylist.update(timeMilliseconds, songFadeDirection !== null || danceFadeDirection !== null)
      const librarySeconds = secondsSince(libraryStartMilliseconds)
      const shakingBoring = libraryQuizPhase === "final" && boringShakeStartMilliseconds !== null && timeMilliseconds - boringShakeStartMilliseconds < 1000 && finalChoice === null
      if (isShowingConcepts) {
        context.fillStyle = "#000000"
        context.fillRect(0, 0, window.innerWidth, window.innerHeight)
        drawRadiConcepts(context, window.innerWidth, window.innerHeight)
      } else if (librarySeconds !== null) {
        const wrongSeconds = secondsSince(wrongStartMilliseconds)
        if (wrongSeconds !== null && wrongSeconds >= QUIZ_ADVANCE_AFTER_WRONG) {
          if (libraryQuizPhase === "captain") {
            libraryQuizPhase = "joke"
            jokeQuizStartSeconds = librarySeconds
            wrongStartMilliseconds = null
            captainChoice = null
            hoveredCaptain = null
          } else if (libraryQuizPhase === "joke") {
            libraryQuizPhase = "final"
            finalQuizStartSeconds = librarySeconds
            wrongStartMilliseconds = null
            jokeChoice = null
            hoveredJoke = null
          }
        }
        let cheerSeconds = secondsSince(cheerStartMilliseconds)
        if (cheerSeconds !== null && cheerSeconds >= RIGHT_CHEER_SECONDS && !cheerQuestionStarted) {
          cheerQuestionStarted = true
          if (libraryQuizPhase === "captain") startJokeQuiz(librarySeconds)
          else if (libraryQuizPhase === "joke") startFinalQuiz(librarySeconds)
        }
        if (cheerSeconds !== null && cheerSeconds >= RIGHT_CHEER_SECONDS + CHEER_MOVE_SECONDS) {
          cheerStartMilliseconds = null
          cheerQuestionStarted = false
          cheerSeconds = null
        }
        drawLibraryScene(
          context,
          window.innerWidth,
          window.innerHeight,
          timeMilliseconds / 1000,
          librarySeconds,
          libraryQuizPhase,
          captainChoice,
          hoveredCaptain,
          jokeChoice,
          hoveredJoke,
          secondsSince(wrongStartMilliseconds),
          jokeQuizStartSeconds,
          finalQuizStartSeconds,
          cheerSeconds,
          shakingBoring ? "boring" : finalChoice,
          hoveredFinal,
          secondsSince(batmanStartMilliseconds),
          secondsSince(boringShakeStartMilliseconds),
        )
      } else if (clubSeconds !== null) {
        drawClubScene(context, window.innerWidth, window.innerHeight, timeMilliseconds / 1000, clubSeconds, letsDanceSeconds)
      } else if (citySeconds !== null) {
        drawCityScene(context, window.innerWidth, window.innerHeight, timeMilliseconds / 1000, citySeconds, anywaySeconds, drive)
      } else {
        drawOpeningScene(context, window.innerWidth, window.innerHeight, timeMilliseconds / 1000, shownProgress, meetingSeconds, scrollOpen)
      }
      const onOpening = !isShowingConcepts && meetingSeconds === null && citySeconds === null && clubSeconds === null && librarySeconds === null
      const startLayout = scrollOpen || !onOpening ? null : startButtonLayout(window.innerWidth, window.innerHeight, timeMilliseconds / 1000)
      if (startButtonRef.current) placeBubbleButton(startButtonRef.current, startLayout)
      const moreLayout = isShowingConcepts || meetingSeconds !== null ? null : greetingLayout
      const anywayLayout = isShowingConcepts || citySeconds === null || clubSeconds !== null || librarySeconds !== null ? null : anywayButtonLayout(window.innerWidth, window.innerHeight, citySeconds, anywaySeconds)
      if (moreButtonRef.current) placeBubbleButton(moreButtonRef.current, moreLayout)
      if (anywayButtonRef.current) placeBubbleButton(anywayButtonRef.current, anywayLayout)
      const letsDanceLayout = isShowingConcepts || clubSeconds === null ? null : letsDanceButtonLayout(window.innerWidth, window.innerHeight, clubSeconds, letsDanceSeconds)
      if (letsDanceButtonRef.current) placeBubbleButton(letsDanceButtonRef.current, letsDanceLayout)
      if (librarySeconds === null) {
        libraryQuizPhase = "captain"
        captainChoice = null
        hoveredCaptain = null
        jokeChoice = null
        hoveredJoke = null
        finalChoice = null
        hoveredFinal = null
        jokeQuizStartSeconds = null
        finalQuizStartSeconds = null
        wrongStartMilliseconds = null
        cheerStartMilliseconds = null
        cheerQuestionStarted = false
        batmanStartMilliseconds = null
        boringShakeStartMilliseconds = null
      }
      const wrongSeconds = librarySeconds === null ? null : secondsSince(wrongStartMilliseconds)
      const cheering = librarySeconds !== null && cheerStartMilliseconds !== null
      const quizLayouts = isShowingConcepts || librarySeconds === null || cheering || finalChoice === "batman"
        ? null
        : libraryQuizChoiceLayouts(window.innerWidth, window.innerHeight, libraryQuizPhase, librarySeconds, wrongSeconds, jokeQuizStartSeconds, finalQuizStartSeconds)
      const quizButtons = [nemoButtonRef.current, americaButtonRef.current, janewayButtonRef.current]
      const quizChoices = libraryQuizPhase === "captain"
        ? (["nemo", "america", "janeway"] as const)
        : libraryQuizPhase === "joke"
          ? (["furmidable", "catastrophe", "purplexing"] as const)
          : (["batman", "unicorn", "boring"] as const)
      const chosenQuiz = libraryQuizPhase === "captain" ? captainChoice : libraryQuizPhase === "joke" ? jokeChoice : shakingBoring ? "boring" : finalChoice
      quizButtons.forEach((button, index) => {
        if (!button) return
        const choice = quizChoices?.[index] ?? null
        placeQuizButton(button, quizLayouts?.[index] ?? null, choice !== null && chosenQuiz === choice)
      })
      animationFrameId = requestAnimationFrame(drawFrame)
    }
    const openScroll = () => {
      if (scrollOpen) return
      scrollOpen = true
      document.documentElement.dataset.scrollOpen = "true"
      if (startButtonRef.current) startButtonRef.current.dataset.visible = "false"
      backgroundPlaylist.nudge()
    }
    const startMeetingKira = () => {
      meetingStartMilliseconds = performance.now()
    }
    const startCoolRadi = () => {
      anywayStartMilliseconds = performance.now()
      driveSong.muted = true
      void driveSong.play().then(() => {
        if (driveProgress !== null) return
        driveSong.pause()
        driveSong.currentTime = 0
        driveSong.muted = false
      }).catch(() => {
        driveSong.muted = false
      })
    }
    const startDancing = () => {
      if (letsDanceStartMilliseconds !== null) return
      letsDanceStartMilliseconds = performance.now()
      danceFadeDirection = "in"
      danceFadeStartedAt = performance.now()
      danceSong.volume = 0
      danceSong.currentTime = 0
      void danceSong.play().catch(() => {})
    }
    const pressGas = (scrollPixels: number) => {
      if (scrollPixels <= 0 || latestAnywaySeconds === null || latestAnywaySeconds < DRIVE_READY_SECONDS) return
      const startingDrive = driveProgress === null
      driveProgress ??= 0
      if (startingDrive) {
        driveSong.muted = false
        driveSong.volume = 0
        driveSong.currentTime = 0
        songFadeDirection = "in"
        songFadeStartedAt = performance.now()
        void driveSong.play().catch(() => {})
      }
      driveBoost = Math.min(DRIVE_MAX_BOOST, driveBoost + scrollPixels * DRIVE_BOOST_PER_PIXEL)
    }
    const onWheel = (event: WheelEvent) => {
      backgroundPlaylist.nudge()
      const wheelPixels = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? event.deltaY : event.deltaY * WHEEL_LINE_PIXELS
      pressGas(wheelPixels)
    }
    const onTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? null
    }
    const onTouchMove = (event: TouchEvent) => {
      const touchY = event.touches[0]?.clientY
      if (touchY === undefined) return
      backgroundPlaylist.nudge()
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
      libraryStartMilliseconds = sceneSelection.sceneId === "library" ? performance.now() : null
      libraryQuizPhase = "captain"
      captainChoice = null
      hoveredCaptain = null
      jokeChoice = null
      hoveredJoke = null
      finalChoice = null
      hoveredFinal = null
      jokeQuizStartSeconds = null
      finalQuizStartSeconds = null
      wrongStartMilliseconds = null
      cheerStartMilliseconds = null
      cheerQuestionStarted = false
      batmanStartMilliseconds = null
      boringShakeStartMilliseconds = null
      letsDanceStartMilliseconds = null
    })
    const updateProgress = () => {
      useFilmStore.getState().setProgress(readScrollProgress())
    }
    const onScroll = () => {
      if (!scrollOpen) {
        if (window.scrollY !== 0) window.scrollTo(0, 0)
        return
      }
      backgroundPlaylist.nudge()
      updateProgress()
    }
    const onResize = () => {
      resizeCanvas(canvas, context)
      updateProgress()
    }

    resizeCanvas(canvas, context)
    updateProgress()
    animationFrameId = requestAnimationFrame(drawFrame)
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("wheel", onWheel, { passive: true })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("pointerdown", backgroundPlaylist.nudge, true)
    window.addEventListener("keydown", backgroundPlaylist.nudge, true)
    const startButton = startButtonRef.current
    startButton?.addEventListener("pointerdown", backgroundPlaylist.nudge)
    startButton?.addEventListener("click", openScroll)
    const moreButton = moreButtonRef.current
    moreButton?.addEventListener("click", startMeetingKira)
    const anywayButton = anywayButtonRef.current
    anywayButton?.addEventListener("click", startCoolRadi)
    const letsDanceButton = letsDanceButtonRef.current
    letsDanceButton?.addEventListener("click", startDancing)
    const startJokeQuiz = (librarySeconds: number) => {
      libraryQuizPhase = "joke"
      jokeQuizStartSeconds = librarySeconds
      captainChoice = null
      hoveredCaptain = null
    }
    const startFinalQuiz = (librarySeconds: number) => {
      libraryQuizPhase = "final"
      finalQuizStartSeconds = librarySeconds
      jokeChoice = null
      hoveredJoke = null
    }
    const chooseCaptain = (choice: CaptainChoice) => {
      if (libraryQuizPhase !== "captain" || wrongStartMilliseconds !== null || cheerStartMilliseconds !== null) return
      captainChoice = choice
      if (choice === "janeway") {
        cheerStartMilliseconds = performance.now()
        cheerQuestionStarted = false
        return
      }
      wrongStartMilliseconds = performance.now()
    }
    const chooseJoke = (choice: JokeChoice) => {
      if (libraryQuizPhase !== "joke" || wrongStartMilliseconds !== null || cheerStartMilliseconds !== null) return
      jokeChoice = choice
      if (choice === "catastrophe") {
        cheerStartMilliseconds = performance.now()
        cheerQuestionStarted = false
        return
      }
      wrongStartMilliseconds = performance.now()
    }
    const chooseFinal = (choice: FinalChoice) => {
      if (libraryQuizPhase !== "final" || cheerStartMilliseconds !== null) return
      if (choice === "boring") {
        if (finalChoice !== null) return
        boringShakeStartMilliseconds = performance.now()
        return
      }
      if (finalChoice !== null || wrongStartMilliseconds !== null) return
      finalChoice = choice
      if (choice === "batman") batmanStartMilliseconds = performance.now()
    }
    const chooseQuizA = () => {
      if (libraryQuizPhase === "captain") chooseCaptain("nemo")
      else if (libraryQuizPhase === "joke") chooseJoke("furmidable")
      else if (libraryQuizPhase === "final") chooseFinal("batman")
    }
    const chooseQuizB = () => {
      if (libraryQuizPhase === "captain") chooseCaptain("america")
      else if (libraryQuizPhase === "joke") chooseJoke("catastrophe")
      else if (libraryQuizPhase === "final") chooseFinal("unicorn")
    }
    const chooseQuizC = () => {
      if (libraryQuizPhase === "captain") chooseCaptain("janeway")
      else if (libraryQuizPhase === "joke") chooseJoke("purplexing")
      else if (libraryQuizPhase === "final") chooseFinal("boring")
    }
    const nemoButton = nemoButtonRef.current
    const americaButton = americaButtonRef.current
    const janewayButton = janewayButtonRef.current
    const hoverQuizA = () => {
      if (libraryQuizPhase === "captain") hoveredCaptain = "nemo"
      else if (libraryQuizPhase === "joke") hoveredJoke = "furmidable"
      else if (libraryQuizPhase === "final") hoveredFinal = "batman"
    }
    const hoverQuizB = () => {
      if (libraryQuizPhase === "captain") hoveredCaptain = "america"
      else if (libraryQuizPhase === "joke") hoveredJoke = "catastrophe"
      else if (libraryQuizPhase === "final") hoveredFinal = "unicorn"
    }
    const hoverQuizC = () => {
      if (libraryQuizPhase === "captain") hoveredCaptain = "janeway"
      else if (libraryQuizPhase === "joke") hoveredJoke = "purplexing"
      else if (libraryQuizPhase === "final") hoveredFinal = "boring"
    }
    const clearQuizHover = () => {
      hoveredCaptain = null
      hoveredJoke = null
      hoveredFinal = null
    }
    nemoButton?.addEventListener("click", chooseQuizA)
    americaButton?.addEventListener("click", chooseQuizB)
    janewayButton?.addEventListener("click", chooseQuizC)
    nemoButton?.addEventListener("mouseenter", hoverQuizA)
    americaButton?.addEventListener("mouseenter", hoverQuizB)
    janewayButton?.addEventListener("mouseenter", hoverQuizC)
    nemoButton?.addEventListener("mouseleave", clearQuizHover)
    americaButton?.addEventListener("mouseleave", clearQuizHover)
    janewayButton?.addEventListener("mouseleave", clearQuizHover)
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("pointerdown", backgroundPlaylist.nudge, true)
      window.removeEventListener("keydown", backgroundPlaylist.nudge, true)
      delete document.documentElement.dataset.scrollOpen
      startButton?.removeEventListener("pointerdown", backgroundPlaylist.nudge)
      startButton?.removeEventListener("click", openScroll)
      moreButton?.removeEventListener("click", startMeetingKira)
      anywayButton?.removeEventListener("click", startCoolRadi)
      letsDanceButton?.removeEventListener("click", startDancing)
      nemoButton?.removeEventListener("click", chooseQuizA)
      americaButton?.removeEventListener("click", chooseQuizB)
      janewayButton?.removeEventListener("click", chooseQuizC)
      nemoButton?.removeEventListener("mouseenter", hoverQuizA)
      americaButton?.removeEventListener("mouseenter", hoverQuizB)
      janewayButton?.removeEventListener("mouseenter", hoverQuizC)
      nemoButton?.removeEventListener("mouseleave", clearQuizHover)
      americaButton?.removeEventListener("mouseleave", clearQuizHover)
      janewayButton?.removeEventListener("mouseleave", clearQuizHover)
      unsubscribeFromScenes()
      stopDriveSong()
      stopDanceSong()
      backgroundPlaylist.stop()
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} />
      <button ref={startButtonRef} type="button" className="more-button start-button" data-visible="false" tabIndex={-1}>
        Let's get started
      </button>
      <button ref={moreButtonRef} type="button" className="more-button" data-visible="false" tabIndex={-1}>
        {"Don't you want to know more about me?"}
      </button>
      <button ref={anywayButtonRef} type="button" className="more-button" data-visible="false" tabIndex={-1}>
        Anyway...
      </button>
      <button ref={letsDanceButtonRef} type="button" className="more-button" data-visible="false" tabIndex={-1}>
        {"Let's dance!"}
      </button>
      <button ref={nemoButtonRef} type="button" className="quiz-answer" data-visible="false" tabIndex={-1} aria-label="Answer A" />
      <button ref={americaButtonRef} type="button" className="quiz-answer" data-visible="false" tabIndex={-1} aria-label="Answer B" />
      <button ref={janewayButtonRef} type="button" className="quiz-answer" data-visible="false" tabIndex={-1} aria-label="Answer C" />
    </>
  )
}
