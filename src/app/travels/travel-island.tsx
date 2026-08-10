import { render } from "solid-js/web"
import { TravelMap } from "./travel-map.tsx"
import "./travels.css"

const mount = document.querySelector("#travel-island")

if (!(mount instanceof HTMLElement)) {
  throw new TypeError("Travel island mount is missing")
}

mount.replaceChildren()
render(() => <TravelMap />, mount)
