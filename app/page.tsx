import { ConceptsButton } from "@/components/ConceptsButton"
import { FilmCanvas } from "@/components/FilmCanvas"
import { SceneSelect } from "@/components/SceneSelect"

const HomePage = () => {
  return (
    <>
      <FilmCanvas />
      <h1 className="home-title">RADI</h1>
      <ConceptsButton />
      <SceneSelect />
      <div className="film-scroll" />
    </>
  )
}

export default HomePage
