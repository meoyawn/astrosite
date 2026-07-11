import type { Component } from "solid-js"
import type { Locale } from "../i18n.ts"
import { CvPage } from "./cv-page.tsx"
import type { CVPageCopy } from "./cvPageCopy.ts"
import type { CV } from "./data/cv.types.ts"

export function createCvRoute(
  cv: CV,
  copy: CVPageCopy,
  locale: Locale,
): Component {
  function CvRoute() {
    return (
      <CvPage
        copy={copy}
        cv={cv}
        locale={locale}
      />
    )
  }

  return CvRoute
}
