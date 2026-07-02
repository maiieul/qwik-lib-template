/// <reference types="vite-plus/test/browser" />

// Maps "vitest" onto vite-plus types because of the pnpm override.
declare module "vitest" {
  export * from "vite-plus/test";
}
