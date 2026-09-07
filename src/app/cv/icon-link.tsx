import email from "./icon/email.svg?no-inline"
import github from "./icon/github.svg?no-inline"
import link from "./icon/link.svg?no-inline"
import linkedin from "./icon/linkedin.svg?no-inline"

const icons = { email, github, link, linkedin }

export interface IconLinkProps {
  alt: string
  asset: keyof typeof icons
  href: string
}

export const IconLink = (props: IconLinkProps) => (
  <a
    class="flex w-fit max-w-full items-center gap-2 text-sm leading-6 font-medium text-sky-700 hover-underline sm:text-[15px] print:gap-1.5 print:text-[12px] print:leading-[1.35]"
    target="_blank"
    rel="noreferrer"
    href={props.href}
  >
    <img
      class="not-prose size-4 shrink-0"
      src={icons[props.asset]}
      alt={props.alt}
      height="16"
      width="16"
    />
    <span class="min-w-0 wrap-anywhere">
      {props.href
        .replace("mailto:", "")
        .replace("https://", "")
        .replace("tel:", "")}
    </span>
  </a>
)
