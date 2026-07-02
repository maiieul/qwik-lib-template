

<!-- Source: .ruler/AGENTS.md -->

# Qwik Library Template — agent instructions

> `.ruler/` is the canonical source for these rules. For template sync work, load
> `.ruler/skills/qwik-lib-template-sync/SKILL.md`.

## Source Of Truth

- Shared AI guidance lives in `.ruler/`. Generated outputs (root `AGENTS.md`, `CLAUDE.md`,
  `.claude/skills/`, `.codex/skills/`) are committed — never hand-edit them.
- After editing `.ruler/**`, regenerate and commit outputs together
  (`pnpm dlx @intellectronica/ruler apply --no-gitignore --no-mcp`). CI fails on drift.
- Other generated files: `packages/*/lib/`, `.vite-hooks/`, `pnpm-lock.yaml`, bumpy changelogs.
  Edit the owning source, regenerate with the owning tool.
- If guidance you used is stale, fix the `.ruler` source before finishing. Fixes generic to all
  Qwik libraries belong upstream in the template.

## Project Snapshot

The Qwik core team's starter template for Qwik v2 libraries — a living reference. Other repos
copy its patterns and agents sync them in both directions. Prefer boring, explicit,
well-commented-only-where-crucial config over cleverness.

## Monorepo Map

| Path           | Notes                                                        |
| -------------- | ------------------------------------------------------------ |
| `packages/lib` | The publishable library (rename per instance). ESM-only.     |
| `playground`   | Real Qwik app consuming the lib from source (private).       |
| `tools`        | `qwikLibPack()` — the vp pack preset for Qwik libraries.     |
| `.ruler`       | This guidance. Generated agent files are committed.          |
| `.bumpy`       | Release intents (bump files) + bumpy config.                 |

## Commands

```bash
pnpm i                                  # install (also sets up git hooks)
pnpm check                              # fmt + lint + typecheck; run before finishing any task
pnpm fix                                # autofix the above
pnpm test.unit                          # node project (*.unit.ts)
pnpm test.browser                       # dom project (*.browser.tsx); needs one-time:
pnpm exec playwright install chromium
pnpm build                              # vp pack → packages/lib/lib/
pnpm exec publint packages/lib          # validate built package
pnpm exec attw --pack packages/lib --profile esm-only
pnpm dev                                # playground against lib source
```

## Qwik Library Rules (load-bearing)

- Every published JS file keeps the `.qwik.mjs` suffix (entries AND chunks) — the consumer's
  optimizer only re-processes files matching `/\.qwik\.[mc]?js$/`.
- `package.json` keeps the `"qwik"` field, `"sideEffects": false`, ESM-only exports, and a floor
  peerDependency on `@qwik.dev/core`.
- Component CSS: `import styles from './x.css?inline'` + `useStyles$(styles)`. Never plain CSS
  imports in library source.
- `preserveModules` stays on — it preserves per-component lazy loading and tree-shaking.
- The `vite-plus` devDependency and the two pnpm-workspace overrides move together, same exact
  version, bumped deliberately.
- Shared dependency versions live in the pnpm catalog, defined once.

## Template Sync

- Downstream repos record `Based on QwikDev/qwik-lib-template @ <ref>` in their README; agents
  diff from that baseline to apply updates.
- Stale or improvable generic patterns → PR the template, never push directly.
- Load the `qwik-lib-template-sync` skill before sync work in either direction.
- Keep the `qwik-` prefix on skill names — they land in shared agent skill directories.

## Tests

- TDD for behavior changes: write the closest focused test first, see it fail, make it pass.
- `node` project (`*.unit.ts`): pure logic only — `component$` cannot execute there.
- `dom` project (`*.browser.tsx`): anything that renders — `render`, `renderSSR`, axe-core.
- Docs/config-only changes skip the failing-test step but still get the narrowest verification.

## Releases

Release-worthy package change → `pnpm exec bumpy add`. One bump file per change; summary is one
short lowercase sentence (~10 words), no implementation details.

## Code Quality

- Keep code DRY; no debug logging or temporary names in the final diff.
- Comments only for crucial non-obvious information — one sentence, ~10 words, explain the why.
- Names state the domain idea; booleans as questions (`isReady`); functions as actions.
- Early returns over nesting; small focused helpers; keep the success path at the outer level.

## Code Style

oxfmt and oxlint define style (root `vite.config.ts`); do not fight them. Known gap:
`valid-lexical-scope` has no oxlint port — review `$` boundary captures for serializability
manually.

| Pattern         | Usage                                   |
| --------------- | --------------------------------------- |
| `use*`          | Hooks called in component/task scope    |
| `*$`            | QRL boundary extracted by the optimizer |
| `*.unit.ts`     | Vitest node-project tests               |
| `*.browser.tsx` | Vitest Browser Mode tests (dom project) |

## Security

- Dependency, CI, or publish changes get a focused security pass: least-privilege `permissions:`,
  no secrets to forked PRs, SHA-pin third-party actions, check new install scripts and lockfile
  drift.
- `pull_request_target` jobs must never check out or execute PR code.

## Boundaries

- Preserve user work and unrelated changes; do not reset or revert unrelated files.
- Do not commit `.only` tests or build artifacts.
- Do not skip tests for behavior changes.



<!-- Source: .ruler/README.md -->

# AI Tools Setup

This project uses [Ruler](https://github.com/intellectronica/ruler) to manage AI assistant
configuration from a single source of truth:

```
.ruler/
├── AGENTS.md       # Repo-wide instructions for all AI tools
├── ruler.toml      # Which agents to generate config for
└── skills/         # Task workflows (template sync, ...)
```

Everything Ruler generates (root `AGENTS.md`, `CLAUDE.md`, `.claude/skills/`, `.codex/skills/`)
is **committed**, so fresh clones and git worktrees have agent guidance immediately — no setup
step. `.ruler/` is still the only editable source. `AGENTS.md` is read natively by Cursor,
Copilot, Gemini and most other tools, so only the Claude and Codex outputs are generated.

## After editing `.ruler/`

Regenerate the committed outputs and commit them together with your source change:

```bash
pnpm dlx @intellectronica/ruler apply --no-gitignore --no-mcp
```

CI (`ruler-check.yml`) fails when the committed outputs drift from `.ruler/`.

## Project vs personal config

- **`.ruler/` (committed)**: team conventions, project rules, shared skills. Changes affect
  everyone — treat edits like code review material.
- **`~/.config/ruler/` (personal)**: your own preferences, API keys, personal MCP servers.
  Never commit personal config.

Never hand-edit generated files — they get overwritten on the next `apply`.
