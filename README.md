# Qwik Library Template ⚡️

An opinionated starter for building **Qwik v2 libraries**, maintained by the Qwik core team as a
living reference. It is written to be read by humans _and_ AI agents: repos based on it stay
aligned with the template through agent-driven syncs (see [Template sync](#template-sync)), not
through an npm dependency.

## Stack

| Concern       | Choice                                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toolchain     | [Vite Plus](https://viteplus.dev) (`vp`): build, lint, format, test, hooks — one root `vite.config.ts`                                                                  |
| Monorepo      | pnpm workspaces + catalog (single source of dependency versions)                                                                                                        |
| Library build | `vp pack` + `qwikLibPack()` (`tools/qwik-pack.ts`) — ESM-only, `.qwik.mjs`, preserveModules                                                                             |
| Tests         | Vitest projects: `node` (`*.unit.ts`) + `dom` (`*.browser.tsx`, Browser Mode, [vitest-browser-qwik](https://github.com/kunai-consulting/vitest-browser-qwik), axe-core) |
| Releases      | [bumpy](https://github.com/dmno-dev/bumpy) bump files → Version PR → npm OIDC trusted publishing with provenance                                                        |
| Previews      | [pkg.pr.new](https://pkg.pr.new) on every PR                                                                                                                            |
| Agent config  | [.ruler/](.ruler/README.md) source of truth (rules + skills), generated per-agent files gitignored                                                                      |

## Repo tour

```
├── packages/lib       # the publishable library (rename it!)
│   └── src/counter/   # example component + colocated unit/browser tests
├── playground/        # real Qwik app consuming the lib from source
├── tools/             # qwikLibPack() — the vp pack preset for Qwik libraries
├── .ruler/            # AI agent rules + the template-sync skill
├── .bumpy/            # release intents (bump files)
└── .github/           # CI, previews, releases, PR automation
```

## Getting started

1. **Create your repo** from this template (GitHub "Use this template", or
   `gh repo create my-lib --template QwikDev/qwik-lib-template`).
2. **Rename the placeholders** (an agent prompted with "adopt this template for <name>" will do
   all of this for you):
   - `packages/lib/package.json`: `name`, `description`, `repository.url`
   - root `package.json`: `name`, `description`
   - `.github/workflows/auto-assign.yml`: the `ORG`/`TEAM_SLUG`/`PROJECT_URL` env values (or
     delete the workflow)
   - this README: rewrite it for your library, but **keep the baseline line below**
3. **Record your baseline** — keep this line (with the ref you started from) somewhere in your
   README so agents can sync you later:

   > Based on [QwikDev/qwik-lib-template](https://github.com/QwikDev/qwik-lib-template) @ `<ref>`

4. **Wire up the services** (each is optional, everything else works without them):
   - install the [pkg.pr.new GitHub App](https://github.com/apps/pkg-pr-new) → PR preview packages
   - add an `AUTO_ASSIGN_PAT` secret (`read:org` + `repo` + `project`) → PR auto-assignment
   - publish each package once manually (`pnpm build && pnpm --filter <pkg> publish --access public`),
     then configure the [npm trusted publisher](https://docs.npmjs.com/trusted-publishers) for the
     repo bound to the `publish` environment → tokenless OIDC releases with provenance
   - optionally add a `BUMPY_GH_TOKEN` secret (fine-grained PAT) so CI runs on Version PRs

## Commands

```bash
pnpm install                            # also installs git hooks (vp)
pnpm dev                                # playground against lib source (SSR dev server)
pnpm check                              # format + lint + typecheck, whole repo
pnpm fix                                # autofix the above
pnpm test                               # both vitest projects
pnpm test.unit                          # node project (*.unit.ts)
pnpm test.browser                       # browser project (*.browser.tsx) — needs:
pnpm exec playwright install chromium   #   one-time browser download
pnpm build                              # vp pack → packages/lib/lib/
pnpm exec bumpy add                     # declare a release intent (bump file)
```

## Template sync

There is deliberately **no sync tooling** — the agent is the sync mechanism, and
[`.ruler/skills/qwik-lib-template-sync`](.ruler/skills/qwik-lib-template-sync/SKILL.md) is its
playbook:

- **Template → your repo**: "sync this repo with qwik-lib-template" — the agent diffs the
  pattern-carrier files (toolchain config, CI, build recipe, agent rules) from your recorded
  baseline to the template's HEAD, merges them with judgment, verifies with the full check/test
  suite, and opens a PR.
- **Your repo → template**: improved a pattern that every Qwik library would want? Ask the agent
  to "upstream this to qwik-lib-template" — it generalizes the change, proves it against the
  template's own checks, and opens a PR here.

The [CHANGELOG](CHANGELOG.md) carries per-release sync notes written for agents.

## AI agents

Agent guidance lives in [`.ruler/`](.ruler/README.md) (the generated `CLAUDE.md`/`AGENTS.md`
files are gitignored). After cloning, generate the config for your tool:

```bash
pnpm dlx @intellectronica/ruler apply --agents claude   # or cursor, copilot, codex, ...
```

## Known caveats

- **Vite Plus is alpha (0.1.x)** — the `vite-plus` devDependency and the two pnpm-workspace
  overrides are exact-pinned and must move together. Renovate is configured to leave them alone;
  bump them deliberately. The escape hatch is plain vite + vitest + oxlint, and every touchpoint
  is confined to package.json scripts + the root `vite.config.ts`.
- **`valid-lexical-scope` has no oxlint port yet** ([discussion](https://github.com/qwiksilverlabs/oxlint-plugin-qwik/discussions/2)) —
  nothing machine-checks captures across `$` boundaries; review for serializability manually.
- **Windows**: works, with two notes — tsgolint's binary is unsigned (Windows Security may block
  the first `pnpm check`), and custom oxlint JS plugins can OOM on Windows until oxc's allocator
  work lands (use WSL if you hit it).
- **Duplicate Qwik instances**: if typechecking suddenly fails around `jsx-runtime` after
  dependency changes, run `pnpm dedupe` — peer-resolution can split `@qwik.dev/core` into
  multiple instances.
