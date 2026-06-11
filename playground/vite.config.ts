import { resolve } from "node:path";
import { qwikVite } from "@qwik.dev/core/optimizer";
import { qwikRouter } from "@qwik.dev/router/vite";
import { defineConfig } from "vite";

/**
 * Playground app for developing the library (`pnpm dev` at the root).
 *
 * The library is aliased to its src/ so edits HMR straight into the
 * playground without rebuilding `lib/` — the built output only matters
 * for publishing (and for the pack-smoke tests, which do NOT alias).
 */
export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        "my-qwik-library-name": resolve(import.meta.dirname, "../packages/lib/src"),
      },
    },
    plugins: [qwikVite(), qwikRouter()],
  };
});
