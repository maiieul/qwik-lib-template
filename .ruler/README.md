# AI Tools Setup

This project uses [Ruler](https://github.com/intellectronica/ruler) to manage AI assistant
configuration from a single source of truth:

```
.ruler/
├── AGENTS.md       # Repo-wide instructions for all AI tools
├── ruler.toml      # Which agents to generate config for
├── rules/          # Always-on source rules (quality, TDD, security, ...)
└── skills/         # Task workflows (template sync, ...)
```

Everything Ruler generates (root `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.codex/`, `.cursor/`,
`.github/copilot-instructions.md`) is **gitignored** — `.ruler/` is the only editable source.

## Generate configs for your agent

No global install needed:

```bash
pnpm dlx @intellectronica/ruler apply              # all default agents
pnpm dlx @intellectronica/ruler apply --agents claude
pnpm dlx @intellectronica/ruler apply --agents cursor,copilot
```

Re-run after pulling changes that touch `.ruler/`.

## Project vs personal config

- **`.ruler/` (committed)**: team conventions, project rules, shared skills. Changes affect
  everyone — treat edits like code review material.
- **`~/.config/ruler/` (personal)**: your own preferences, API keys, personal MCP servers.
  Never commit personal config.

## Changing agent behavior

Edit the `.ruler/` sources (see the `guidance-source-of-truth` rule for the layout), then
regenerate. Do not hand-edit generated files — they get overwritten.
