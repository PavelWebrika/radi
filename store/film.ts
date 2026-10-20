import { create } from "zustand"

export type Chapter = {
  id: string
  name: string
  order: number
  color: string
  start: number
  end: number
}

type FilmState = {
  chapters: Chapter[]
  progress: number
  activeChapterId: string | null
  soundOn: boolean
  setProgress: (progress: number) => void
}

const findActiveChapterId = (chapters: Chapter[], progress: number) => {
  const ordered = [...chapters].sort((chapter, laterChapter) => chapter.order - laterChapter.order)
  const match = ordered.find((chapter, index) => {
    const isLast = index === ordered.length - 1
    return progress >= chapter.start && (isLast ? progress <= chapter.end : progress < chapter.end)
  })
  return match?.id ?? null
}

export const useFilmStore = create<FilmState>((set) => ({
  chapters: [],
  progress: 0,
  activeChapterId: null,
  soundOn: false,
  setProgress: (progress) =>
    set((state) => ({
      progress,
      activeChapterId: findActiveChapterId(state.chapters, progress),
    })),
}))
