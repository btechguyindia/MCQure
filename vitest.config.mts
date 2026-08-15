import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Tests run against the shared Neon database (slow remote roundtrips),
    // so raise the per-test timeout above Vitest's default of 5s.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
