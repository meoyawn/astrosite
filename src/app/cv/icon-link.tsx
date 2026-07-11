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
    class="flex items-center gap-1"
    target="_blank"
    rel="noreferrer"
    href={props.href}
  >
    <img
      class="not-prose"
      src={icons[props.asset]}
      alt={props.alt}
      height="16"
      width="16"
    />
    <span>
      {props.href
        .replace("mailto:", "")
        .replace("https://", "")
        .replace("tel:", "")}
    </span>
  </a>
)
