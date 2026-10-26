import { FilmCanvas } from "@/components/FilmCanvas"
import { SceneSelect } from "@/components/SceneSelect"

const HomePage = () => {
  return (
    <>
      <FilmCanvas />
      <SceneSelect />
      <div className="film-scroll" />
    </>
  )
}

export default HomePage
