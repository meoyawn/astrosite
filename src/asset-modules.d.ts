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
