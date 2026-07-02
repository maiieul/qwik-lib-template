import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { qwikRollup } from "@qwik.dev/core/optimizer";
import type { Plugin } from "rolldown";
import type { PackUserConfig } from "vite-plus/pack";
import { inlineCss } from "./inline-css.ts";

type PackageManifest = {
  name: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const escapeForRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const dependencyPattern = (name: string) => new RegExp(`^${escapeForRegex(name)}(/.*)?$`);

/** .qwik.mjs suffix required by consumer optimizer's TRANSFORM_REGEX; preserveModules keeps per-component lazy loading. */
const qwikOutputPlugin = (srcDir: string, outDir: string): Plugin => ({
  name: "qwik-lib-output-options",
  outputOptions(outputOptions) {
    return Object.assign(outputOptions, {
      dir: outDir,
      // rolldown strips all extensions when naming preserved modules, colliding counter.css vs counter.tsx.
      entryFileNames: (chunk: { name?: string; facadeModuleId?: string | null }) => {
        const isDts = chunk.name?.endsWith(".d");
        const id = chunk.facadeModuleId?.split("?")[0];
        if (!id) {
          return isDts ? "[name].mts" : "[name].qwik.mjs";
        }
        const rel = relative(srcDir, id);
        if (rel.startsWith("..")) {
          return isDts ? "[name].mts" : "[name].qwik.mjs";
        }
        const base = rel.replace(/\.(tsx|ts|jsx|js|mjs)$/, "");
        // dts chunks keep .d.mts naming for node16 module resolution.
        return isDts ? `${base.replace(/\.d$/, "")}.d.mts` : `${base}.qwik.mjs`;
      },
      chunkFileNames: "[name]-[hash].qwik.mjs",
      preserveModules: true,
      preserveModulesRoot: "src",
    });
  },
});

export function qwikLibPack(packageDir: string): PackUserConfig {
  const cwd = resolve(import.meta.dirname, "..", packageDir);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const manifest = JSON.parse(
    readFileSync(resolve(cwd, "package.json"), "utf-8"),
  ) as PackageManifest;

  const external = [
    /^node:/,
    ...Object.keys(manifest.dependencies ?? {}).map(dependencyPattern),
    ...Object.keys(manifest.peerDependencies ?? {}).map(dependencyPattern),
  ];

  return {
    name: manifest.name,
    cwd,
    root: ".",
    entry: { index: "./src/index.ts" },
    format: "esm",
    platform: "neutral",
    unbundle: true,
    outDir: "./lib",
    clean: ["lib/**/*"],
    dts: true,
    deps: {
      neverBundle: external,
      onlyBundle: false,
    },
    plugins: [
      qwikRollup({
        target: "lib",
        lint: false,
        buildMode: "production",
      }),
      qwikOutputPlugin(resolve(cwd, "src"), "./lib"),
      inlineCss(),
    ],
  };
}
