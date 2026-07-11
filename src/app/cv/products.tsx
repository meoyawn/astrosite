import type { Product } from "./data/cv.types.ts"
import { md2html } from "../markdown.ts"

export interface ProductsProps {
  intro: string
  products: Product[]
}

export const Products = (props: ProductsProps) => {
  const markdown = `${props.intro} ${props.products
    .map(product => `[${product.name}](${product.url})`)
    .join(", ")}`

  return <div innerHTML={md2html(markdown)} />
}
