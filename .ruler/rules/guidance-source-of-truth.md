# Guidance Source Of Truth Rule

Keep shared AI guidance in the committed `.ruler` source tree. Generated assistant files are local
outputs, not source.

## Source Layout

- Put short repo-wide context in `.ruler/AGENTS.md`.
- Put dedicated always-on rules in `.ruler/rules/<rule-name>.md`.
- Put task-specific workflows in `.ruler/skills/<skill-name>/SKILL.md`.
- Put long, conditional notes in a skill `references/` file only when progressive disclosure helps.
- Keep the `qwik-` prefix on committed skill names: Ruler copies skills into agent-native skill
  directories where they coexist with user and plugin skills, so the prefix keeps them
  unambiguous outside this repo.

## Generated Assistant Outputs

- Do not hand-edit or commit generated assistant outputs such as root `AGENTS.md`, root
  `CLAUDE.md`, `.codex/`, `.claude/`, `.cursor/`, or generated skill directories.
- To change assistant behavior, edit `.ruler/AGENTS.md`, `.ruler/README.md`, `.ruler/rules/**`,
  or `.ruler/skills/**`.
- Regenerate local assistant outputs with Ruler only when needed for verification or local use.

## Rule Versus Skill

Use `.ruler/rules/*.md` for durable policy that should be available without loading a task skill:

- source-of-truth and generated-output boundaries
- engineering quality standards
- test and verification policy
- security and supply-chain expectations

Use skills for workflow details that only matter for specific tasks:

- the template-sync workflow (both directions)
- focused commands and examples
- stop conditions and references that should load only for relevant tasks

## Guidance Freshness

When current source contradicts loaded guidance, update the narrowest `.ruler` source that was
wrong. Prefer replacing stale text over appending another long note. Do not encode one-off branch
facts, temporary debugging notes, or speculative design as durable guidance.

This repo is a template other repos sync from: if the stale guidance you fixed is generic to all
Qwik library repos (not specific to this checkout), it belongs in the template — see the
`qwik-lib-template-sync` skill for the upstream flow.
