# Template changelog

Sync notes for agents applying template updates downstream. Package versions/changelogs are
managed by bumpy; this file tracks the _template patterns_.

## Unreleased

Initial template: pnpm monorepo, Vite Plus toolchain (single root `vite.config.ts` for
pack/lint/fmt/test/hooks), `qwikLibPack()` build recipe (ESM-only, `.qwik.mjs`,
preserveModules, externalization from package.json), vitest node+browser projects with
colocated example tests (CSR/SSR/axe), CI (check/unit/browser/build+publint+attw), pkg.pr.new
previews, bumpy releases with npm OIDC trusted publishing, auto-assign PR workflow, renovate,
committed ruler outputs (fresh clones/worktrees need no setup; `ruler-check.yml` guards drift),
`.ruler` agent base with the `qwik-lib-template-sync` skill.

Sync notes: not applicable — first release is the baseline.
