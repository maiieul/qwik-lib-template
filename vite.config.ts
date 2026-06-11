import { qwikVite } from "@qwik.dev/core/optimizer";
import { defineConfig, type PluginOption, type TestProjectConfiguration } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";
import { testSSR } from "vitest-browser-qwik/ssr-plugin";
import { qwikLibPack } from "./tools/qwik-pack.ts";

// Everything the toolchain does is configured here: library builds (pack),
// linting, formatting, tests (vitest projects) and pre-commit staged
// checks — one config, one tool.
const SHARED_IGNORES = [
  ".git",
  "node_modules",
  "packages/*/lib",
  "dist",
  ".vite-hooks",
  ".planning",
  ".claude",
];

// Pure-logic tests, plain Node — *.unit.ts colocated with source.
const nodeConfig: TestProjectConfiguration = {
  // The Qwik optimizer normally substitutes __EXPERIMENTAL__.<flag> feature
  // checks inside @qwik.dev/core; stub them off so core's non-component
  // exports stay importable here. Component modules still cannot run in
  // this project — component$()/$ require the optimizer, so anything that
  // renders belongs in the dom project below.
  define: {
    __EXPERIMENTAL__: "{}",
  },
  test: {
    name: "node",
    environment: "node",
    include: ["**/*.unit.ts"],
    exclude: ["**/node_modules/**"],
    // Vitest stubs out CSS imports by default; the library's ?inline
    // imports are real code (useStyles$), so process them for real.
    css: true,
  },
};

// Component tests in a real browser (Vitest Browser Mode, chromium) —
// *.browser.tsx colocated with source. vitest-browser-qwik renders both
// client-side (render) and server-side (renderSSR, resumability tests).
const domConfig: TestProjectConfiguration = {
  // Order matters: testSSR rewrites renderSSR() calls into a server-side
  // browser command and must run before the Qwik optimizer transforms.
  // Both factories ship loose plugin types (typed against plain vite, not
  // the vite-plus alias) — safe in practice, exercised by the test suite.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  plugins: [testSSR() as PluginOption, qwikVite({ srcDir: "/" }) as PluginOption],
  test: {
    name: "dom",
    include: ["**/*.browser.ts", "**/*.browser.tsx"],
    exclude: ["**/node_modules/**"],
    fileParallelism: false,
    testTimeout: 5000,
    browser: {
      provider: playwright(),
      enabled: true,
      fileParallelism: false,
      instances: [{ browser: "chromium" }],
    },
  },
};

export default defineConfig({
  pack: [qwikLibPack("packages/lib")],
  lint: {
    ignorePatterns: SHARED_IGNORES,
    // Qwik-specific rules (port of eslint-plugin-qwik). Rules must be enabled
    // explicitly — loading the plugin alone activates nothing.
    // Known gap: valid-lexical-scope is type-aware and has no oxlint port yet
    // (qwiksilverlabs/oxlint-plugin-qwik#2).
    jsPlugins: ["oxlint-plugin-qwik"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    plugins: ["typescript", "jsx-a11y", "react"],
    categories: {
      correctness: "error",
      suspicious: "error",
    },
    rules: {
      "qwik/use-method-usage": "error",
      "qwik/no-react-props": "error",
      "qwik/loader-location": "warn",
      "qwik/no-use-visible-task": "warn",
      "qwik/prefer-classlist": "warn",
      "qwik/jsx-no-script-url": "warn",
      "qwik/jsx-img": "warn",
      "qwik/jsx-a-tag": "warn",
      "react/jsx-key": "error",
      // Qwik uses the automatic JSX runtime — React is never in scope.
      "react/react-in-jsx-scope": "off",
    },
  },
  fmt: {
    ignorePatterns: SHARED_IGNORES,
    endOfLine: "lf",
  },
  test: {
    projects: [nodeConfig, domConfig],
  },
  staged: {
    "*": "vp check --fix",
  },
});
