import { defineConfig } from "vite-plus";
import { qwikLibPack } from "./tools/qwik-pack.ts";

// Everything the toolchain does is configured here: library builds (pack),
// linting, formatting and pre-commit staged checks — one config, one tool.
// Tests (vitest projects) are added to this same file as `test`.
const SHARED_IGNORES = [
  ".git",
  "node_modules",
  "packages/*/lib",
  "dist",
  ".vite-hooks",
  ".planning",
  ".claude",
];

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
  staged: {
    "*": "vp check --fix",
  },
});
