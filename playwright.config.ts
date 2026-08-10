import { defineConfig } from "@playwright/test"

export default defineConfig({
  fullyParallel: true,
  testDir: "./e2e",
  testMatch: "**/*.playwright.ts",
  timeout: 10_000,
  workers: 2,
  use: {
    browserName: "chromium",
  },
})
