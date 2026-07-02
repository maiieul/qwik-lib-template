import { expect, test } from "vite-plus/test";
import styles from "./counter.css?inline";

// component$ cannot run without optimizer — test in browser project
test("?inline css resolves to a plain string", () => {
  expect(styles).toContain(".counter");
});
