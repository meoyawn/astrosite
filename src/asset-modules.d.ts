declare module "*?url&no-inline" {
  const href: string
  export default href
}

declare module "*?no-inline" {
  const href: string
  export default href
}

declare module "*?raw" {
  const source: string
  export default source
}

declare module "*?url" {
  const href: string
  export default href
}

declare module "*?worker&url" {
  const href: string
  export default href
}

declare module "*?island" {
  const href: string
  export default href
}

declare module "*.css" {}

declare module "world-atlas/countries-110m.json" {
  import type { feature } from "topojson-client"

  const topology: Parameters<typeof feature>[0]
  export default topology
}
