import { ConceptsButton } from "@/components/ConceptsButton"
import { FilmCanvas } from "@/components/FilmCanvas"

const HomePage = () => {
  return (
    <>
      <FilmCanvas />
      <h1 className="home-title">RADI</h1>
      <ConceptsButton />
      <div className="film-scroll" />
    </>
  )
}

export default HomePage
