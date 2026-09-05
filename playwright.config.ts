import { defineConfig } from "@playwright/test"

export default defineConfig({
  fullyParallel: true,
  reporter: process.env.CI
    ? [
        ["dot"],
        ["github"],
        ["html", { open: "never" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
      ]
    : "list",
  testDir: "./e2e",
  testMatch: "**/*.playwright.ts",
  timeout: 10_000,
  workers: 2,
  use: {
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
})
