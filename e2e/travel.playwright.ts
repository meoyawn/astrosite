import { expect, test } from "@playwright/test"
import { routes, travelRoute } from "../src/routes.ts"
import { builtOrigin, routeBuiltFiles } from "./site.ts"

test.use({ launchOptions: { args: ["--disable-webgl"] } })

test.describe("travel page", () => {
  test("travel stay clicks update the timeline fragment", async ({ page }) => {
    await routeBuiltFiles(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ height: 800, width: 1200 })
    await page.goto(
      `${builtOrigin}${travelRoute("2023-05-02-kuala-lumpur")}`,
    )

    await expect(
      page.getByRole("heading", { level: 2, name: "Kuala Lumpur, Malaysia" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "2 May — 14 Jun 2023" }),
    ).toHaveAttribute("aria-pressed", "true")

    const august2022 = page.getByRole("button", {
      name: "5 Aug — 24 Aug 2022",
    })
    const sliderInput = page.locator("[data-travel-thumb] input")

    await august2022.click()
    await expect(august2022).toHaveAttribute("aria-pressed", "true")
    await expect(page).toHaveURL(
      `${builtOrigin}${travelRoute("2022-08-05-kuala-lumpur")}`,
    )
    await expect(sliderInput).toHaveValue(
      String(Math.floor(Date.parse("2022-08-05T00:00:00Z") / 86_400_000)),
    )
  })

  test("travel timeline remains usable on mobile without WebGL", async ({
    page,
  }) => {
    await routeBuiltFiles(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ height: 844, width: 390 })
    await page.goto(`${builtOrigin}${routes.travel}`)

    await expect(
      page.getByRole("navigation", { name: "Site navigation" }),
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { level: 2, name: "All journeys" }),
    ).toBeVisible()
    await expect(page.locator("[data-travel-globe-status]")).toHaveText(
      /^Map unavailable:/,
    )

    const slider = page.getByRole("slider", { name: "Travel timeline" })
    const sliderInput = page.locator("[data-travel-thumb] input")
    const initialValue = await sliderInput.inputValue()

    await expect(slider).toBeVisible()
    await slider.focus()
    await slider.press("ArrowRight")
    await expect(sliderInput).toHaveValue(String(Number(initialValue) + 1))
    await slider.press("Home")
    await expect(sliderInput).toHaveValue(initialValue)
  })
})
