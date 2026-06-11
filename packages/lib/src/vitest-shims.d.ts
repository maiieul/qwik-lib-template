/// <reference types="vite-plus/test/browser" />

// vite-plus replaces vitest via the pnpm override, but third-party test
// libraries (vitest-browser-qwik) still reference the "vitest" module name
// in their types. Map that name onto vite-plus's test types.
declare module "vitest" {
  export * from "vite-plus/test";
}
