import { resolve } from "node:path";
import { qwikVite } from "@qwik.dev/core/optimizer";
import { qwikRouter } from "@qwik.dev/router/vite";
import { defineConfig } from "vite";

// Alias to lib src/: playground consumes the lib from source, no rebuild.
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
