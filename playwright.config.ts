import { defineConfig } from "@playwright/test"

export default defineConfig({
  fullyParallel: true,
  testDir: "./e2e",
  testMatch: "**/*.playwright.ts",
  use: {
    browserName: "chromium",
  },
})
