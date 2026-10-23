const REV_SRC = "/motorcycle-rev.mp3"
const VOLUME = 0.75
const BLAST_MS = 1000

export const createEngineRev = () => {
  const audio = new Audio(REV_SRC)
  audio.preload = "auto"
  audio.volume = VOLUME
  let blasting = false
  let stopTimer = 0

  const cut = () => {
    window.clearTimeout(stopTimer)
    stopTimer = 0
    blasting = false
    if (audio.paused && audio.currentTime === 0) return
    audio.pause()
    try {
      audio.currentTime = 0
    } catch {
      audio.pause()
    }
  }

  audio.addEventListener("timeupdate", () => {
    if (audio.currentTime >= 1) cut()
  })

  const vroom = (boost: number) => {
    const rate = Math.min(1, 0.8 + boost * 0.05)
    audio.playbackRate = rate
    audio.volume = VOLUME
    if (blasting) return
    try {
      if (audio.currentTime > 0) audio.currentTime = 0
    } catch {
      return
    }
    blasting = true
    window.clearTimeout(stopTimer)
    stopTimer = window.setTimeout(cut, BLAST_MS)
    void audio.play().catch(() => {
      window.clearTimeout(stopTimer)
      stopTimer = 0
      blasting = false
    })
  }

  return { vroom, stop: cut }
}
