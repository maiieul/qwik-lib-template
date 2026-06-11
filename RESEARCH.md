# Qwik Library Template — Research Report

_June 11, 2026. Compiled from a multi-agent research pass (8 topics + 4 gap topics, ~70 load-bearing claims independently fact-checked against primary sources). Full per-topic notes in `.planning/research/`._

## TL;DR

The pillars (Vite Plus, pnpm monorepo, pkg.pr.new/vitest CI, shared `.ruler` base) are all validated — meridian proves the whole stack works in production. But **the genuinely novel part — bidirectional, agent-driven template↔repo sync — exists nowhere**, including in meridian. No ecosystem (shadcn, copier, nx, projen, create-typescript-app) has repo→template upstreaming, repo-level drift tracking, or an install lockfile for copied files. That layer is the product; the rest is assembling proven pieces. Prior art gives us excellent mechanics to steal: copier's 3-way replay + answers manifest, nx's per-version migrations + `sync:check`, projen's anti-tamper, shadcn's `--diff` + agent-merge, copybara's commit trailers.

---

## 1. What meridian gives us (and what it doesn't)

Meridian (qds.dev) is the best reference _instance_ of the target structure:

**Generalize into the template:**

- **One root `vite.config.ts`** driving everything via Vite Plus: `pack` (library builds), `lint` (oxlint, type-aware), `fmt` (oxfmt), `test` (vitest projects), `staged` (pre-commit via `vp config --hooks-only`). No eslint/prettier/husky/lint-staged/tsup/turbo as separate deps.
- **The Qwik lib build recipe**: `qwikRollup({target:'lib'})` + `preserveModules` + `lib/[name].qwik.mjs` + `"qwik"` package.json field + `sideEffects:false` + exports map + `files:["lib"]`, with auto-externalization derived from each package's deps/peerDeps.
- **Types decoupled from bundling**: `dts:false`, declaration emit via `tsgo --build` over composite project references (tsc fallback documented).
- **Two-project vitest layout**: `node` (`*.unit.ts`) + `dom` (`*.browser.tsx`, Browser Mode, chromium, `vitest-browser-qwik`, axe-core a11y), colocated with source. 4-way CI sharding + Playwright browser caching.
- **CI patterns**: pnpm store cache, build-output cache, "regenerate generated files and fail if dirty" sync-check, pkg.pr.new publishing all libs per PR.
- **`.ruler/`** as agent-config source of truth + 11 skills (several portable: qwik-patterns, testing, headless-api-design, skill-creator).
- Docs-dev **src aliasing** (`resolve.alias` published-name → `libs/*/src`) so docs HMR never needs a lib rebuild; per-package `README.md` + `ARCHITECTURE.md`.

**Don't copy:**

- qds-specific subsystems: in-browser REPL (`libs/code`, COOP/COEP), playground metadata pipeline, iconify virtual modules, as-child transform, Linear glue, `create-qds`.
- Alpha-everything version posture (vite-plus 0.1.16 — npm is at 0.1.24, rolldown RC, tsgo nightly, Qwik core via pkg.pr.new URL duplicated in 5 package.jsons, Node ≥24.9 floor). A flagship repo absorbs weekly breakage; downstream copies can't.
- Hygiene debt (placeholder descriptions, dead `repository` URLs — which **break npm provenance and pkg.pr.new compact URLs** —, missing licenses, stray nested lockfile, duplicated CI triggers `on: [push, pull_request]`).
- Gitignoring ALL generated agent files (cloud agents and fresh clones see zero instructions — see §7).
- Its two scheduled llms.txt workflows are silently broken (stale paths from a previous layout) — a warning that **copied automation rots silently**; our sync layer needs loud CI checks, not crons.

**Missing entirely:** any template↔repo sync tooling. Must be designed from scratch (§8).

## 2. Toolchain: Vite Plus — adopt, pin exactly, keep an exit

Verified status (June 11, 2026):

- **Vite+ is MIT and fully open source** (alpha announcement Mar 13, 2026 explicitly reversed the Oct 2025 paid-tier plan). The pricing concern is moot.
- Vite 8 GA Mar 12, 2026: Rolldown is the single bundler. Current: vite 8.0.16, vitest 4.1.8, oxlint 1.69.0 (stable; type-aware via tsgolint covers 59/61 typescript-eslint type-aware rules), oxfmt 0.54.0 (pre-1.0), tsdown 0.22.2 (pre-1.0; tsup is officially unmaintained), rolldown 1.1.0.
- **Cloudflare acquired VoidZero June 3–4, 2026**, with public commitments (Vite/Vitest/Rolldown/Oxc/Vite+ stay OSS, vendor-agnostic, community-led; $1M ecosystem fund). One week old — re-evaluate governance in ~6 months.
- vite-plus is 0.1.x alpha with weekly releases; integration = pnpm overrides (`vite`→`@voidzero-dev/vite-plus-core`, `vitest`→`…-test`) + one root config. `vp ui` devtools: announced, never shipped — don't plan around it.
- Windows is fine: win32-x64/arm64 binaries ship for vp/tsgo/oxlint/oxfmt, vite-plus runs windows-latest in its own CI, official `voidzero-dev/setup-vp` action. (Caveats in §10.)

**Recommendation:** vp as the default toolchain, exact-pinned (devDep + override defined once, via catalog), version bumps treated as deliberate template releases propagated by the sync layer. Keep every touchpoint confined to package.json scripts + the one root config, and document the eject path (plain vite 8 + vitest 4 + oxlint + tsdown) as a small diff. The copy-based template is itself the version-coordination point — pinning hard is what makes alpha adoption tolerable downstream.

**The template's biggest technical value-add:** a reusable `qwikLibPack()` helper (qwikRollup target lib + `.qwik.mjs`/preserveModules output plugin + package.json-derived externalization + `?inline` CSS handling). **No official Qwik preset for tsdown/vp pack exists anywhere** — meridian's ~150 lines are bespoke. Generalizing this (and eventually upstreaming it to QwikDev) is the centerpiece.

## 3. The Qwik build/packaging recipe (verified against build/v2 source)

- **Target Qwik v2**: `@qwik.dev/core` `latest` dist-tag is already 2.0.0-beta.36 (no stable 2.0 yet; beta.37 current). v1 (1.20.0) still maintained but new-lib templates should not ship a v1 variant.
- `.qwik.mjs` naming is **load-bearing**: consumer-side optimizer only re-processes imports matching `TRANSFORM_REGEX = /\.qwik\.[mc]?js$/`. Set `chunkFileNames: '[name]-[hash].qwik.mjs'` too, so shared chunks stay optimizable.
- The `"qwik"` package.json field still matters in v2: `checkQwikExternals` auto-handles `optimizeDeps.exclude`/`ssr.noExternal` for deps with a `qwik` field or a core dep/peerDep.
- **ESM-only** is the v2 norm (core/router/QDS all ESM-only). Drop the starter's `.qwik.cjs` output.
- **Fix the official starter's gap**: it has _no peerDependency on `@qwik.dev/core` at all_. Template: exact-pinned devDep + floor peerDep (`>=2.0.0-beta.36`), switch to `^2.0.0` at stable.
- CSS: `import styles from './x.css?inline'` + `useStyles$` (keeps `sideEffects:false` honest); dedicated exports subpath for consumer-importable theme CSS.
- Types: `tsc -p tsconfig.types.json --emitDeclarationOnly` as default; tsgo as documented fast path (it's a TS7 dev preview; declaration emit + build mode are done per microsoft/typescript-go). If vite-plugin-dts is ever used instead, replicate qwik-ui's TS2742 (non-portable types) fail-on-diagnostic guard — a known Qwik-lib dts gotcha.

## 4. Testing

- **Vitest 4 `test.projects`** in the root config: `unit` (node) + `browser` (Browser Mode stable since 4.0; provider is now a separate package, factory-style `playwright()`; `browser.headless` defaults to `process.env.CI`). `vitest-browser-qwik` 0.3.8 supports CSR **and** SSR rendering (`renderSSR`/`testSSR`) — test both.
- Keep `fileParallelism: false` on the browser project (sidesteps an open Windows-flavored Playwright console-log timeout, vitest#9941).
- Bake **axe-core a11y assertions** into browser tests (meridian does this; cheap and high-value for component libs).
- **Notable**: meridian deleted all Playwright e2e in favor of browser-mode component tests (and ships a `pw-to-vitest` conversion skill). Recommendation: browser mode is the primary component-testing layer; Playwright e2e is an _optional add-on scoped to the docs app_, shipped with the blob-report + `merge-reports` sharding pattern wired but commented out.

## 5. CI & release (June 2026 specifics that bite)

- **Never corepack** (removed from Node 25+ by TSC vote). Canonical setup: `actions/checkout@v6` → `pnpm/action-setup@v6` with **no version input** (reads `packageManager`) → `actions/setup-node@v6` with `cache: pnpm` → `pnpm install --frozen-lockfile`. Ship it as a composite `.github/actions/setup`.
- Triggers: `pull_request` + `push: branches: [main]` (meridian's bare `[push, pull_request]` double-runs everything), concurrency groups with cancel-in-progress.
- **Three workflows**: `ci.yml` (fmt/lint/sherif → typecheck → unit → browser → build + publint/attw → optional e2e → knip non-blocking), `preview.yml` (pkg.pr.new), `release.yml`.
- **pkg.pr.new**: install as devDependency (README forbids dlx), ONE invocation per run (`pnpm exec pkg-pr-new publish './packages/*' --template './playground'`), compact URLs require the package to already exist on npm with a correct `repository` field.
- **npm trusted publishing (OIDC)**: GA since Jul 2025; classic tokens revoked Dec 9, 2025 — OIDC is the only low-maintenance path. `id-token: write`, Node 24 runner (npm ≥11.5.1), provenance automatic. Gotchas to document: first publish of a new package can't use OIDC (bootstrap with a granular token, then `npm trust github`, npm ≥11.10.0); configs created after May 20, 2026 must explicitly select allowed actions.
- **Versioning**: changesets (stable 2.31.0 + `changesets/action@v1.9.0`) is the ecosystem default and fits multi-package monorepos; meridian instead uses bumpp + changelogen lockstep via `workflow_dispatch` (simpler, fine for tightly-coupled packages). Decision point — see §11.
- Package validation: **publint + `attw --pack`** per publishable package (tsdown/vp pack have optional built-in integration). Hygiene: **sherif** (blocking), **knip** (non-blocking at first), pnpm `catalog:` instead of syncpack.
- Supply chain: pnpm `onlyBuiltDependencies` allowlist, `minimumReleaseAge` cooldown, `trustPolicy: no-downgrade` (antfu's template ships all three); renovate (not dependabot) extending a shared org preset — itself a reference-not-copy distribution mechanism worth imitating.
- Consider **versioned reusable workflows** in the template repo (sxzz/workflows pattern): downstream keeps thin callers, CI logic updates by bumping one ref instead of file-syncing workflow bodies. This matters double because **`GITHUB_TOKEN` cannot push `.github/workflows/` changes** — the less workflow-body surface synced, the better.

## 6. Docs site: QwikCity, generalized from meridian

- **Ship a QwikCity (Qwik Router v2) docs app.** It's the only option with native live Qwik demos (real optimizer/SSG/resumability), the only single-Vite-consumer compatible with the repo-wide vite→vite-plus override (Astro 6 pins Vite 7 internally — conflict), and — decisively — the docs _engine_ becomes template-owned files the sync layer can update. VitePress is Vue-locked (disqualified); Starlight + `@qwik.dev/astro` (~69 downloads/week, bus factor ~1) documented only as escape hatch.
- VueUse-style **collocated docs** are feasible: qwik-router's MDX transform applies to `.mdx` anywhere, so packages can hold `src/<feature>/{index.ts,index.mdx,examples/,*.test.ts}` with a tiny codegen emitting thin route re-exports.
- Pagefind for search (post-build), Cloudflare Pages/Netlify default (GitHub Pages fallback documented — no COOP/COEP headers there), REPL/advanced playground **opt-in module**, not base.
- Ship a working **llms.txt generator** wired into the build (meridian's is broken — also a ready-made upstream contribution to demonstrate the repo→template direction).
- Keep route chrome as thin shells reading project-owned `site.config.ts`, so sync never clobbers branding.

## 7. AI agent config: standards-first, ruler as shim, marketplace as channel

Verified landscape: AGENTS.md is now a Linux Foundation (Agentic AI Foundation) standard used by 60k+ projects and read natively by Codex/Cursor/Copilot/Gemini/Zed/etc. **Claude Code still does not read AGENTS.md** (docs: "Claude Code reads CLAUDE.md, not AGENTS.md"); official bridge is a committed CLAUDE.md containing `@AGENTS.md`. The SKILL.md spec is an open standard (Dec 2025, ~40 adopters); `.agents/skills/` is the emerging cross-tool dir (Codex/Gemini/Cursor) but **Claude Code only reads `.claude/skills/`** (which Cursor also reads). Ruler is at 0.3.42, beta, 30+ agents; skills/nested modes experimental; no `check` command (CI pattern: `ruler apply --no-gitignore` + fail on dirty status).

**Recommendation — invert meridian's setup:**

- **Commit** a root `AGENTS.md` (canonical) + 2-line `CLAUDE.md` shim (`@AGENTS.md`). Meridian gitignores all generated agent files, so cloud agents (Copilot review, Codex web, Jules) and fresh clones see _nothing_ — wrong default for a template.
- Skills live once in `.claude/skills/` (covers Claude + Cursor), mirrored to `.agents/skills/` (Codex/Gemini) via ruler fan-out or symlinks. Written to the agentskills.io spec.
- Ruler stays as an **optional shim** for MCP/skills fan-out to long-tail agents (`pnpm dlx @intellectronica/ruler apply`, no global install), not the backbone.
- Template-owned vs repo-owned agent rules via ruler's multi-file concatenation: `.ruler/00-template.md` (template-owned) + separate project-owned files — ownership boundaries for free. Same idea with HTML-comment managed regions inside AGENTS.md.
- **Claude plugin marketplace as the auto-update channel**: a `QwikDev` marketplace repo + each lib's committed `.claude/settings.json` with `extraKnownMarketplaces`/`enabledPlugins` → contributors get a one-time trust prompt, then background auto-updates. This is the closest existing thing to "npm without node_modules" — but Claude-only, so cross-tool basics remain copied files.
- Keep meridian's duality: conventions as prose for agents **and** as custom oxlint rules for CI (machine-enforced, not suggested).

## 8. The novel part: bidirectional sync — design proposal

### Prior art (all verified)

| System                     | Steal this                                                                                                                                                                                                                    | Avoid this                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| copier (Python)            | `.copier-answers.yml` (template URL + pinned commit + answers); update = 3-way replay (regen old → diff vs project → replay onto new); inline conflict markers; `_migrations` between git-tag versions                        | —                                                                          |
| cruft                      | `cruft check` as CI drift gate                                                                                                                                                                                                | `.rej` conflict files (documented DX dead end)                             |
| nx migrate                 | migrations shipped _with_ each version; two-phase plan (`migrations.json`) / apply; one major at a time; `nx sync:check` fails CI on generated-file drift                                                                     | —                                                                          |
| projen                     | generated-file markers + **anti-tamper CI** + self-mutation pushes to PRs                                                                                                                                                     | total buy-in/lock-in                                                       |
| actions-template-sync      | scheduled sync-PR shape; idempotency via template-commit-in-history                                                                                                                                                           | `-X theirs` clobbers local edits                                           |
| create-typescript-app      | block decomposition (each feature owns its files/deps/scripts); transition recipe (uninstall conflicts → delete configs → rewrite → autofix)                                                                                  | no state file → no 3-way merge; customizations lost                        |
| Mattermost plugin template | declarative `plan.yml`: per-path actions + conditions (`exists`, **`file_unaltered`**) + fallback chains; now wrapped by a Claude skill                                                                                       | —                                                                          |
| copybara                   | stateless recovery via commit trailers; ONE authoritative side per fileset; reversibility as the basis of bidirectional flow                                                                                                  | —                                                                          |
| shadcn registry            | `--diff` + "ask your agent to merge" is the _official_ update story; GitHub Registries (Jun 2026): any public repo with `registry.json` is installable with `#tag`/`#sha` pinning; universal items distribute arbitrary files | no lockfile, no drift tracking, no upstream path — **our differentiation** |

Universal failure modes: mixed-ownership files, no recorded baseline, blunt overwrite merges, ignored update PRs compounding drift, multi-major jumps, workflow-file push permissions.

### Architecture

1. **Manifest** (`.template/manifest.json`, committed, **self-stamped by the template's own release workflow** so every transport — Use this template, giget, fork — carries provenance with zero CLI): template repo URL, synced tag + commit SHA, instance answers, chosen blocks, per-path ownership policy. Redundant `Template-Commit: <sha>` trailers on sync commits (stateless recovery).
2. **Three ownership tiers**, file-granular: template-owned (header marker: "Generated from qwik-lib-template@vX — propose changes upstream"), project-owned (ignore globs), shared (minimized; managed BEGIN/END regions only).
3. **Composition over merging** everywhere: tsconfig `extends`, configs importing template-owned `*.base.ts`, scripts delegating to template scripts, `.ruler/00-template.md`. Mixed-ownership files are the #1 conflict source in every surveyed system.
4. **Sync = skill + deterministic core**: scripts compute per-path 3-way diff (pinned tag vs latest), apply `file_unaltered → overwrite` mechanically, hand only real conflicts to agent judgment, open a PR, bump the manifest. Deterministic part testable without an agent; skill is the conversational wrapper. (2026 consensus: deterministic tools compute/apply mechanical transforms, agents handle judgment merges, delivery via human-reviewed PR.)
5. **Per-version migration playbooks** (`.template/migrations/<from>-<to>.md`): prose + scripts written _for agents_, with verify steps; applied one version at a time (nx model).
6. **CI drift gate** in downstream repos (cruft-check analog) + optional scheduled sync-PR workflow (claude-code-action; needs GitHub App, not GITHUB_TOKEN).
7. **Upstream flow as a second skill** (`propose-upstream`): diff deliberately-changed template-owned file vs pristine, generalize, PR the template; or record as intentional local override in the manifest so future syncs skip it (copybara rule: one authoritative side per fileset — never symmetric auto-merge).
8. **Template versioning**: semver git tags + agent-readable CHANGELOG with explicit per-release sync notes. Keep the template-owned surface as small and stable as possible.
9. Consider shadcn **registry.json compatibility** as a bonus distribution channel (GitHub Registries makes any public repo installable; universal items can carry agent/CI files) — but our manifest/lockfile/drift layer is what they don't have.

### Trust model (the channel is the attack surface)

A standing automated pipe from one repo into every downstream repo is the canonical supply-chain shape — and synced artifacts include _instructions agents obey_, so payloads can be prompt injection, not just code (Snyk found injection in 36% of audited skills; the `` !`cmd` `` dynamic-context primitive executes before the model reviews anything; tj-actions retag hit ~23k repos in 2025).

- Sync pins to **full SHA or signed/immutable tag** (immutable releases GA Oct 2025), never floating refs.
- Every sync lands as a **PR requiring ≥1 human approval**; never auto-merge; drift diff + markdown/skill scanner as required checks.
- **GitHub App over PAT** (short-lived, repo-scoped; contents/PRs/issues only). **Do not grant `workflows:write`** to the routine sync agent; treat `.github/workflows/**` as a higher-trust tier guarded by a push ruleset ("Restrict file paths").
- Forbid `` !`…` `` dynamic context, `allowed-tools: Bash(*)`, `permissionMode: bypassPermissions` in template-owned skills; CI lint rejects them. Recommend `disableSkillShellExecution: true` downstream.
- Apply the Agents Rule of Two: the sync job never combines untrusted input + write access + secrets/egress.
- Marketplace channel: SHA-pinned plugin entries, `defaultEnabled: false`, `strictKnownMarketplaces` documented.

## 9. Instantiation UX (day one)

- Template repo is a **valid-as-is, building, testing monorepo** under a canonical fake-but-real identity (reserved npm scope, real URLs). No mustache in executable files — GitHub "Use this template" still has zero variable support and dumb-copy transports can't render placeholders.
- Parametrized surface = a small closed set of **grep-unique tokens** declared in one config; deterministic `pnpm template:init` (clack prompts, git-inferred defaults, `--answers` for CI) renames everything and **hard-fails if any token survives**; instances keep that grep as a permanent CI check. (Meridian still ships the starter's literal `"Create a Qwik library"` description in 3 published packages and dead repository URLs — stale `repository` breaks provenance and pkg.pr.new compact URLs. Verification is the missing piece across the entire ecosystem.)
- `pnpm template:connect` (Phase B): `gh`-authenticated — apply committed ruleset JSON, `gh repo edit`, open an auto-tracked "Finish setup" issue for the unavoidable manual steps (pkg.pr.new GitHub App org-install once; first npm publish per package via token, then scripted `npm trust github`). Preview/release workflows must degrade gracefully until those are done.
- **The template's own CI tests the template**: PR-required `template-e2e` (archive HEAD → init with fixture answers → leftover-token grep → install/build/test/publint on the renamed instance) and `sync-e2e` (instantiate from last released tag → run sync engine to PR HEAD → assert clean apply + green build — proves "N-1→N sync" before N ships). No surveyed template does this; meridian's silently-broken crons are the failure mode it prevents.
- Primary flow: "Use this template"/`gh repo create --template`; tag-pinned giget as non-GitHub alt. **No fat `create-*` CLI** — at most a ~100-line wrapper that downloads and execs the repo's own init script, so logic lives in the synced template.

## 10. Cross-platform

- Windows does **not** break the vp toolchain (all binaries ship win32, upstream CIs run windows-latest). Three documentable caveats: tsgolint.exe is unsigned → Windows Security blocks on first run (open issue #876, affects `vp check` type-aware); custom oxlint **JS plugins can OOM on Windows** (no overcommit; fix milestone in progress — keep jsPlugins optional in the default lint config); Defender slows cold builds.
- **Sparse CI matrix** (the pattern vite/vitest/tsdown themselves use): ubuntu × Node 22/24/26 + `include:` windows@24 and macos@24, `fail-fast: false`; lint/typecheck/publish ubuntu-only. Meridian never tests Windows — the include is the cheap guarantee.
- Engines: **`node >=22.12`** for the libs (Node 20 is EOL; meridian's ≥24.9 floor comes from the docs site's sharp, not the libs). Docs app can carry its own stricter engines.
- Shell-agnostic scripts only (no inline env vars, no `rm -rf`; `node script.ts` via type-stripping; cpy-cli); pnpm `shellEmulator: true`; `.gitattributes` with `* text=auto eol=lf`. Skill helper scripts are `.ts` run via node, never `.sh` (meridian ships `.sh` skill templates — the anti-pattern).

## 11. Decision points

1. **Vite Plus default vs plain-Vite default.** Researchers split. Recommendation: **vp default** (meridian proves it; MIT; `vp run` kills turbo; the template is the version-coordination point), exact-pinned, with the plain vite+vitest eject path documented and kept small by construction. The conservative alternative — plain Vite lib mode default, vp as opt-in — costs the single-config story and re-adds eslint/prettier/husky/turbo.
2. **Release tooling: changesets vs bumpp+changelogen lockstep.** Changesets = ecosystem default, per-package versioning, Version-Packages PR flow. Bumpp lockstep = what meridian uses, far less ceremony, fits "small team, tightly-coupled packages". Recommendation: **changesets** for the template default (templates serve unknown package topologies); document lockstep as a variant.
3. **Linting Qwik specifics.** Qwik's flagship `valid-lexical-scope` rule is _type-aware_ — it cannot run under oxlint JS plugins (alpha explicitly excludes type-aware rules). Options: (a) keep a minimal ESLint sidecar just for eslint-plugin-qwik; (b) meridian's approach — skip eslint-plugin-qwik, write custom oxlint rules; (c) **as Qwik maintainers: port the qwik rules to tsgolint/oxlint natively** — upstream work that benefits the whole ecosystem and would make this template the first fully-oxlint Qwik setup. Recommendation: (a) short-term, (c) as a tracked goal.
4. **Qwik core pinning**: published beta (recommended for the template) vs pkg.pr.new snapshot URL (meridian; if ever needed, define it once in the catalog, not per-package). pkg.pr.new URLs have **no documented retention guarantee** — committed dependencies on them are a durability risk.
5. **CI distribution**: copied workflow files (synced, full control, but `GITHUB_TOKEN` can't update them downstream) vs versioned reusable workflows referenced from the template repo (reference-not-copy, one-ref updates). Recommendation: hybrid — thin callers downstream, logic in reusable workflows.
6. **E2E**: ship Playwright e2e at all? Meridian dropped it entirely. Recommendation: browser-mode component tests as the contract; Playwright e2e as an optional block scoped to the docs app.

## 12. Proposed layout

```
qwik-lib-template/
├── AGENTS.md                     # canonical agent instructions (committed)
├── CLAUDE.md                     # "@AGENTS.md" shim (committed)
├── README.md · LICENSE · CONTRIBUTING.md
├── package.json                  # private root; scripts delegate to vp
├── pnpm-workspace.yaml           # packages, catalog (all shared versions), vp overrides, supply-chain hardening
├── vite.config.ts                # vp: pack + lint + fmt + test + staged
├── tsconfig.json                 # composite refs
├── .gitattributes                # * text=auto eol=lf
├── .template/
│   ├── manifest.json             # self-stamped: repo, version, SHA, answers, ownership policy
│   ├── tokens.json               # the closed rename surface for template:init
│   └── migrations/               # per-version agent playbooks
├── .github/
│   ├── actions/setup/            # composite: checkout→pnpm→node→install
│   └── workflows/                # ci, preview, release, template-e2e, sync-e2e
├── .ruler/                       # 00-template.md (owned) + project rules + ruler.toml
├── .claude/skills/               # shared skills (mirrored to .agents/skills/)
│   ├── template-sync/ · propose-upstream/ · template-init/
│   └── qwik-patterns/ · testing/ · headless-api-design/
├── .mcp.json · renovate.json
├── tools/                        # qwikLibPack(), init/doctor/connect scripts, llms.txt gen (template-owned)
├── packages/
│   └── example-lib/              # src/<feature>/{index.ts, index.mdx, examples/, *.unit.ts, *.browser.tsx}
│                                 # README.md + ARCHITECTURE.md per package
├── docs/                         # QwikCity docs app (engine template-owned, content project-owned)
└── playground/                   # real Qwik app consuming workspace pkgs; doubles as pkg.pr.new --template
```

## 13. Suggested phases

1. **Core build**: monorepo skeleton, `qwikLibPack()`, vitest projects, single root config, working example lib. (The instance must be green before anything else.)
2. **CI/release**: composite setup, ci/preview/release workflows, publint/attw/sherif, renovate preset, trusted publishing docs.
3. **Docs + playground**: generalized QwikCity engine, collocated-docs codegen, pagefind, llms.txt.
4. **Agent layer**: AGENTS.md/CLAUDE.md, skills set, ruler fan-out, optional marketplace.
5. **Sync layer** (the product): manifest + tokens, `template:init`/`connect`/`doctor`, sync + propose-upstream skills, drift gate, `template-e2e`/`sync-e2e`, trust hardening.
6. **Dogfood**: migrate one real Qwik library onto the template and run the first real sync cycle both directions.

---

_Full per-topic notes (12 files, with sources): `.planning/research/`. Every key claim above was adversarially fact-checked against primary sources on 2026-06-11; corrections are already incorporated._
