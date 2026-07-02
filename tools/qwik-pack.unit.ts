import { expect, test } from "vite-plus/test";
import { qwikLibPack } from "./qwik-pack.ts";

const config = qwikLibPack("packages/lib");

const isExternal = (id: string) => {
  const patterns = config.deps?.neverBundle ?? [];
  const list = Array.isArray(patterns) ? patterns : [patterns];
  return list.some((pattern) => (pattern instanceof RegExp ? pattern.test(id) : pattern === id));
};

// Externalization contract: consumer-installed deps/peerDeps/builtins must never be bundled.
test("externalizes peerDependencies including subpath imports", () => {
  expect(isExternal("@qwik.dev/core")).toBe(true);
  expect(isExternal("@qwik.dev/core/optimizer")).toBe(true);
});

test("externalizes node builtins", () => {
  expect(isExternal("node:fs")).toBe(true);
});

test("bundles everything else (devDependencies, relative imports)", () => {
  expect(isExternal("some-random-package")).toBe(false);
  expect(isExternal("@qwik.dev/core-other-package")).toBe(false);
});
