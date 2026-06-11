import { expect, test } from "vite-plus/test";
import { qwikLibPack } from "./qwik-pack.ts";

const config = qwikLibPack("packages/lib");

const isExternal = (id: string) => {
  const patterns = config.deps?.neverBundle ?? [];
  const list = Array.isArray(patterns) ? patterns : [patterns];
  return list.some((pattern) => (pattern instanceof RegExp ? pattern.test(id) : pattern === id));
};

// The externalization contract: everything the consumer installs themselves
// (dependencies, peerDependencies, node builtins) must never be bundled —
// bundling a duplicate @qwik.dev/core is the classic broken-Qwik-lib bug.
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
