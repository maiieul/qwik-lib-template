# Qwik Library Template — AI Agent Rules

> Canonical source for repo-wide AI coding agent rules. For contributor setup, see
> `.ruler/README.md`. For the template-sync workflow, load
> `.ruler/skills/qwik-lib-template-sync/SKILL.md`.

## Project Snapshot

This repo is the Qwik core team's **library starter template** — a living reference, not a
framework. Other Qwik library repos copy its patterns; agents keep them aligned in both
directions (see Template Sync below). Everything here is meant to be read and reapplied by
agents, so prefer boring, explicit, well-commented configuration over cleverness.

The stack: pnpm workspaces, Vite Plus (`vp`) as the single toolchain (build/lint/format/test/
hooks via one root `vite.config.ts`), Qwik v2 (`@qwik.dev/*`), Vitest Browser Mode for component
tests, bumpy for releases, pkg.pr.new for PR previews.

## Monorepo Map

| Path           | Notes                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| `packages/lib` | The publishable library (rename per instance). ESM-only, `.qwik.mjs`.  |
| `playground`   | Real Qwik app consuming the lib from source (dev harness, private).    |
| `tools`        | Build helpers: `qwikLibPack()` (vp pack preset for Qwik libs).         |
| `.ruler`       | This guidance (source of truth; generated agent files are gitignored). |
| `.bumpy`       | Release intents (bump files) + bumpy config.                           |

## Environment

- Node `>=22.12`, pnpm only (version pinned via `packageManager`).
- Install with `pnpm install`. Never use npm/yarn commands in this repo.

## Command Rules

- `pnpm check` — format + lint (type-aware, includes full TS typecheck) for the whole repo.
  Run before finishing any task. `pnpm fix` applies autofixes.
- `pnpm test.unit` / `pnpm test.browser` — the two vitest projects (node logic / real-browser
  component tests). `pnpm test` runs both. Browser tests need
  `pnpm exec playwright install chromium` once.
- `pnpm build` — builds the publishable packages (vp pack). Validate output with
  `pnpm exec publint packages/lib` and `pnpm exec attw --pack packages/lib --profile esm-only`.
- `pnpm dev` — playground against lib source (no rebuild loop).
- If a release-worthy package change ships, create a bump file with `pnpm exec bumpy add`
  unless the user says it is non-release-affecting.

## Qwik Library Rules (load-bearing, do not "simplify" away)

- Every published JS file keeps the `.qwik.mjs` suffix (entries AND chunks) — the consumer's
  optimizer only re-processes files matching `/\.qwik\.[mc]?js$/`.
- `package.json` keeps the `"qwik"` field, `"sideEffects": false`, ESM-only exports, and a
  floor peerDependency on `@qwik.dev/core`.
- Component CSS is `import styles from './x.css?inline'` + `useStyles$(styles)` — never plain
  CSS imports in library source (would make `sideEffects: false` a lie).
- `preserveModules` stays on: one output module per source module is what keeps per-component
  lazy loading and tree-shaking for consumers.
- The `vite-plus` devDependency and the two pnpm-workspace overrides (`vite`, `vitest`) are the
  SAME exact version and move together, deliberately — never via routine dependency bumps.
- Shared dependency versions live in the pnpm catalog (`pnpm-workspace.yaml`), defined once.

## Template Sync

This repo's patterns flow to and from other Qwik library repos:

- Downstream repos record their baseline as `Based on QwikDev/qwik-lib-template @ <ref>` in
  their README. Agents use it to diff and apply template updates.
- If you fix or improve something here that is generic to all Qwik library repos, it ships with
  the next template tag. If you find a stale pattern here while working downstream, propose a PR
  to the template (never push directly).
- Load the `qwik-lib-template-sync` skill before any sync work in either direction.

## Source Rules

Dedicated source rules live under `.ruler/rules/` and are part of the always-on guidance:

- `test-driven-development`: focused test first; node project for logic, dom project for
  anything that renders.
- `code-quality`: understandable names, early returns, focused helpers.
- `guidance-source-of-truth`: `.ruler` is canonical; rule-vs-skill taxonomy.
- `generated-output-boundaries`: edit owning sources, regenerate intentionally.
- `security-and-supply-chain`: focused security pass for dependency/CI/publish changes.

## Code Style

oxfmt and oxlint define style (configured in the root `vite.config.ts`); do not fight them.
Known linting gap: `valid-lexical-scope` has no oxlint port yet — be careful about capturing
non-serializable values across `$` boundaries; nothing machine-checks it.

Naming conventions:

| Pattern         | Usage                                   |
| --------------- | --------------------------------------- |
| `use*`          | Hooks called in component/task scope    |
| `*$`            | QRL boundary extracted by the optimizer |
| `*.unit.ts`     | Vitest node-project tests               |
| `*.browser.tsx` | Vitest Browser Mode tests (dom project) |

## Boundaries

- Preserve user work and unrelated changes. Do not reset or revert unrelated files.
- Do not commit `.only` tests, generated agent outputs, or build artifacts.
- Do not skip tests for behavior changes; use the closest focused test first.
