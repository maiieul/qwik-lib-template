---
name: qwik-lib-template-sync
description: Sync a Qwik library repo with QwikDev/qwik-lib-template in either direction — apply template updates downstream, or upstream a generalized improvement to the template. Use when asked to "sync with the template", "update from the template", "apply template patterns", or "upstream this to the template".
---

# Qwik Library Template Sync

The template (https://github.com/QwikDev/qwik-lib-template) is a living reference repo. There is
no sync tooling on purpose: YOU are the sync mechanism. Work file-by-file with judgment, deliver
everything as a reviewable PR, and verify with the repo's own checks.

## Ownership Map

**Pattern carriers** (template decides; sync these):

- `vite.config.ts` (root) and `tools/**` — the toolchain + Qwik pack recipe
- `pnpm-workspace.yaml` — overrides, catalog, supply-chain hardening
- root `package.json` — scripts and devDependencies (NOT name/description)
- `.github/**` — workflows and the composite setup action
- `.ruler/rules/**`, `.ruler/ruler.toml`, and this skill
- `.gitignore`, `renovate.json`, `.bumpy/_config.json`, root `tsconfig.json`
- per-package `package.json` SHAPE: exports map, `qwik` field, `sideEffects`,
  `files`, peerDependencies pattern, engines

**Project-specific** (the repo decides; never overwrite):

- `packages/*/src/**` (the actual library code and its tests)
- package names, descriptions, repository URLs, versions
- `playground/` content, README prose, CHANGELOGs, `.bumpy/*.md` bump files
- repo-specific `.ruler/AGENTS.md` sections and extra rules/skills

When a pattern-carrier file legitimately diverges (the repo has a documented reason), record the
divergence in the repo's `.ruler/AGENTS.md` under a "Template divergences" heading so future
syncs respect it instead of fighting it.

## Downstream: apply template updates to this repo

1. Find the baseline: the README line `Based on QwikDev/qwik-lib-template @ <ref>`. If missing,
   treat the whole template as new input and add the line in your PR.
2. Get the template: `git clone --depth 50 https://github.com/QwikDev/qwik-lib-template` (or
   `gh repo clone`). Read its CHANGELOG/release notes between the baseline ref and HEAD — they
   flag breaking pattern changes and required manual steps.
3. Diff pattern carriers between baseline ref and template HEAD
   (`git diff <baseline> HEAD -- <pattern-carrier paths>`), then apply each hunk to this repo:
   - unchanged-since-baseline files: take the template version wholesale;
   - locally-modified files: merge with judgment — template structure, local specifics;
   - respect documented divergences (see Ownership Map).
4. Version-sensitive trio: if `vite-plus` moved, update the devDependency AND both
   pnpm-workspace overrides to the same version, then `pnpm install && pnpm dedupe`.
5. Verify everything: `pnpm install`, `pnpm check`, `pnpm test`, `pnpm build`, publint + attw.
   Formatter version bumps may reformat the whole repo — keep that in its own commit.
6. Update the README baseline line to the new template ref. Open a PR titled
   `chore: sync with qwik-lib-template @ <ref>` listing what was applied and what was skipped
   (and why). Never push to the default branch.

## Upstream: propose an improvement to the template

1. Qualify it: the change must be generic to every Qwik library repo (toolchain, CI, build
   recipe, agent rules) — not this repo's domain code. When unsure, ask the maintainer.
2. Generalize it: replace repo-specific names with the template's canonical placeholders
   (package `my-qwik-library-name`, org/team/project values in `auto-assign.yml`, etc.). Strip
   anything tied to this repo's components.
3. Prove it: clone the template, apply the generalized change, run ITS verification
   (`pnpm install && pnpm check && pnpm test && pnpm build`).
4. Open a PR on QwikDev/qwik-lib-template explaining what problem it solves and which downstream
   repo it came from. Never push directly.
5. If the change cannot be generalized, record it as a documented divergence instead (see
   Ownership Map).

## Stop Conditions

- A pattern-carrier merge conflicts with a documented divergence → keep the divergence, note it
  in the PR description.
- Template verification fails after your generalized change → fix or shrink the proposal; do not
  open a failing PR.
- A sync would touch `packages/*/src/**` or other project-specific surfaces → stop and report;
  that is not a sync, that is a rewrite.
