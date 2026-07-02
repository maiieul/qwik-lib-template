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
