# Test Driven Development Rule

Use test-driven development for behavior changes and bug fixes.

## Required Workflow

1. Identify the observable behavior or invariant before editing implementation code.
2. Add or update the closest focused test that proves the behavior.
3. Run that test before the implementation change when feasible and confirm it fails for the
   expected reason.
4. Make the smallest implementation change that satisfies the test.
5. Rerun the focused test and keep iterating until it passes.
6. Run any broader verification required by the touched surface, such as build output validation
   (`pnpm build` + publint/attw) or the full check.

## Test Selection

This repo has two vitest projects, both colocated with source:

- `node` (`*.unit.ts`, run with `pnpm test.unit`): pure logic only. Component modules cannot
  execute here — `component$`/`$` require the Qwik optimizer.
- `dom` (`*.browser.tsx`, run with `pnpm test.browser`): real-browser component tests via
  Vitest Browser Mode and `vitest-browser-qwik`. Use `render` for client-side behavior and
  interactions, `renderSSR` to verify server-rendered output, and axe-core for accessibility
  assertions.

Anything that renders, handles events, or touches the DOM belongs in the `dom` project. Build
tooling logic (e.g. `tools/qwik-pack.ts`) gets `node` tests beside it.

## Exceptions

Docs-only, rules-only, formatting-only, dependency metadata, and generated-output maintenance
changes do not need a failing product test first. They still need the narrowest relevant
verification, such as formatting, a Ruler dry-run, or a build.

If dependencies or local environment constraints prevent a pre-fix test run, write the focused
test first, record the blocker, and run the test as soon as the blocker is resolved.
