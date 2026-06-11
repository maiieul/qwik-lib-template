import { expect, test } from "vite-plus/test";
import styles from "./counter.css?inline";

// Component behavior is tested in counter.browser.tsx (the dom project) —
// component$ modules cannot execute without the Qwik optimizer, so unit
// tests stay pure logic.
test("?inline css resolves to a plain string", () => {
  // The string import is what keeps `sideEffects: false` truthful — CSS
  // ships inside the JS module and Qwik lazy-loads/dedupes it.
  expect(styles).toContain(".counter");
});
