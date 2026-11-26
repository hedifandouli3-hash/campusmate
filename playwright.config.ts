import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    channel: "chrome",
  },
  webServer: {
    command: "npm.cmd run start",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
