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

/** Matches a package name and any of its subpath imports. */
const dependencyPattern = (name: string) => new RegExp(`^${escapeForRegex(name)}(/.*)?$`);

/**
 * Forces the output layout the Qwik optimizer expects from a library:
 *
 * - every emitted file keeps the `.qwik.mjs` suffix — the consuming app's
 *   qwikVite plugin only re-runs the optimizer over imported files matching
 *   /\.qwik\.[mc]?js$/ (TRANSFORM_REGEX), so a file without the suffix is
 *   invisible to it and its QRLs never get extracted;
 * - `preserveModules` keeps one output module per source module, preserving
 *   per-component lazy-loading granularity and tree-shaking for consumers.
 */
const qwikOutputPlugin = (srcDir: string, outDir: string): Plugin => ({
  name: "qwik-lib-output-options",
  outputOptions(outputOptions) {
    return Object.assign(outputOptions, {
      dir: outDir,
      // Filenames are derived from the source path instead of the default
      // [name] placeholder: rolldown strips ALL extensions when naming
      // preserved modules, so `counter.css?inline` and `counter.tsx` would
      // collide and get nondeterministic `counter`/`counter2` names.
      // Keeping the `.css` in the name matches Vite lib-mode output.
      // Declaration chunks (name ends in ".d") keep standard .d.mts naming
      // so `types` conditions resolve under node16 module resolution.
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
        // dts chunks resolve from a synthetic "<file>.d.ts" facade id.
        return isDts ? `${base.replace(/\.d$/, "")}.d.mts` : `${base}.qwik.mjs`;
      },
      chunkFileNames: "[name]-[hash].qwik.mjs",
      preserveModules: true,
      preserveModulesRoot: "src",
    });
  },
});

/**
 * `vp pack` build config for one Qwik library package.
 *
 * Usage in the root vite.config.ts: `pack: [qwikLibPack("packages/lib")]`.
 *
 * The package's `dependencies` and `peerDependencies` are externalized
 * (never bundled); anything else imported from src is bundled in.
 * Declarations are emitted by tsdown's dts support as per-module .d.mts
 * (resolvable under node16 module resolution — verified with attw).
 * The `qwik` field + `.qwik.mjs` naming contract is what makes the
 * published output optimizable in consuming apps.
 */
export function qwikLibPack(packageDir: string): PackUserConfig {
  const cwd = resolve(import.meta.dirname, "..", packageDir);
  // Reading our own workspace package.json — shape is under our control.
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
    // qwikRollup is untyped (returns `any`) but runs fine as a Rolldown
    // plugin — proven by qds.dev in production.
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
