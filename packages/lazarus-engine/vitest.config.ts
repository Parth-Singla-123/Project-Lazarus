import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 60000,
    hookTimeout: 60000,
    setupFiles: [],
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
  },
});
