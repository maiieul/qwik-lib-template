import axe from "axe-core";
import { expect, test } from "vite-plus/test";
import { render, renderSSR } from "vitest-browser-qwik";
import { Counter } from "./counter";

test("renders and increments (CSR)", async () => {
  const screen = await render(<Counter />);

  await expect.element(screen.getByText("Count: 0")).toBeVisible();
  await screen.getByRole("button", { name: "Increment" }).click();
  await expect.element(screen.getByText("Count: 1")).toBeVisible();
});

test("server-side renders real HTML", async () => {
  // renderSSR executes the component in a Node.js context (true SSR) and
  // hands the resulting HTML to the browser — it verifies server output
  // (catches SSR-only breakage). Interactivity is covered by the CSR test.
  const screen = await renderSSR(<Counter />);

  await expect.element(screen.getByText("Count: 0")).toBeVisible();
  await expect.element(screen.getByRole("button", { name: "Increment" })).toBeVisible();
});

test("meets axe accessibility requirements", async () => {
  const screen = await render(<Counter />);

  const results = await axe.run(screen.container);

  expect(results.violations).toHaveLength(0);
});
