import { splitProps } from "solid-js"
import type { ComponentProps } from "solid-js"

export const NavigationLink = (
  props: Omit<ComponentProps<"a">, "class" | "classList">,
) => {
  const [local, anchorProps] = splitProps(props, ["children"])

  return (
    <a
      {...anchorProps}
      class="inline-flex min-h-11 items-center justify-center p-2 text-[0.9375rem] leading-6 font-semibold tracking-normal text-zinc-700 underline decoration-transparent underline-offset-4 transition-colors hover:text-link hover:decoration-link-underline aria-[current=page]:font-bold aria-[current=page]:text-link aria-[current=page]:decoration-link-underline motion-reduce:transition-none"
    >
      {local.children}
    </a>
  )
}
