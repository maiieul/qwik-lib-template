import { qwikVite } from "@qwik.dev/core/optimizer";
import { qwikRouter } from "@qwik.dev/router/vite";
import { defineConfig } from "vite";
import pkg from "./package.json";
import tsconfigPaths from "vite-tsconfig-paths";

const { dependencies = {}, peerDependencies = {} } = pkg as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
const makeRegex = (dep: string) => new RegExp(`^${dep}(/.*)?$`);
const excludeAll = (obj: Record<string, string>) =>
  Object.keys(obj).map(makeRegex);

export default defineConfig(() => {
  return {
    build: {
      outDir: "lib",
      target: "es2020",
      lib: {
        entry: "./src/index.ts",
        // ESM-only: matches @qwik.dev/core and @qwik.dev/router. Consumers on
        // Node >=20.19/>=22.12 can require(esm) if they really need CJS.
        formats: ["es"] as const,
        // The .qwik.mjs suffix is load-bearing: the consuming app's qwikVite
        // only re-runs the optimizer over imports matching /\.qwik\.[mc]?js$/.
        fileName: (_format, entryName) => `${entryName}.qwik.mjs`,
      },
      rollupOptions: {
        output: {
          preserveModules: true,
          preserveModulesRoot: "src",
          // Any future shared chunk must also keep the .qwik.mjs suffix so it
          // stays visible to the consumer-side optimizer.
          chunkFileNames: "[name]-[hash].qwik.mjs",
        },
        // externalize deps that shouldn't be bundled into the library
        external: [
          /^node:.*/,
          ...excludeAll(dependencies),
          ...excludeAll(peerDependencies),
        ],
      },
    },
    plugins: [qwikVite(), qwikRouter(), tsconfigPaths({ root: "." })],
  };
});
