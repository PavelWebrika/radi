import { ConceptsButton } from "@/components/ConceptsButton"
import { FilmCanvas } from "@/components/FilmCanvas"
import { SceneSelect } from "@/components/SceneSelect"

const HomePage = () => {
  return (
    <>
      <FilmCanvas />
      <ConceptsButton />
      <SceneSelect />
      <div className="film-scroll" />
    </>
  )
}

export default HomePage
