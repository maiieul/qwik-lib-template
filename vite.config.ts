import { qwikVite } from "@qwik.dev/core/optimizer";
import { defineConfig, type PluginOption, type TestProjectConfiguration } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";
import { testSSR } from "vitest-browser-qwik/ssr-plugin";
import { qwikLibPack } from "./tools/qwik-pack.ts";

const SHARED_IGNORES = [
  ".git",
  "node_modules",
  "packages/*/lib",
  "dist",
  ".vite-hooks",
  ".planning",
  // Ruler-generated outputs; fmt must not fight the generator.
  "AGENTS.md",
  "CLAUDE.md",
  ".claude",
  ".codex",
];

const nodeConfig: TestProjectConfiguration = {
  // Stub __EXPERIMENTAL__ so core's non-component exports import without the optimizer; components still need the dom project.
  define: {
    __EXPERIMENTAL__: "{}",
  },
  test: {
    name: "node",
    environment: "node",
    include: ["**/*.unit.ts"],
    exclude: ["**/node_modules/**"],
    // Vitest stubs CSS imports by default; ?inline imports are real code (useStyles$), so process for real.
    css: true,
  },
};

const domConfig: TestProjectConfiguration = {
  // testSSR must run before qwikVite: it rewrites renderSSR() calls, which the optimizer then transforms.
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
    // Rules must be enabled explicitly; loading the plugin alone activates nothing.
    // valid-lexical-scope has no oxlint port yet (qwiksilverlabs/oxlint-plugin-qwik#2).
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
