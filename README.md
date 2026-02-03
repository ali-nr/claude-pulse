# claude-pulse

A real-time statusline for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

![claude-pulse statusline](assets/demo.png)

## Why

Claude Code doesn't show you how much context you've used, what the session is costing, or whether your MCP servers are healthy. You find out when it's too late — a compaction you didn't expect, a cost you didn't track, a broken MCP you didn't notice.

claude-pulse puts all of that in front of you, live, as you work.

## What You Get

Five lines of information, updated on every message:

| Line | What it shows |
|------|---------------|
| **Identity** | Project name + working directory |
| **Git** | Current branch + file changes (new, modified, deleted) |
| **Engine** | Model, context window %, token cost, session duration |
| **MCP** | Server connections with health status (connected, disconnected, disabled, error) |
| **Hooks** | Active hooks by event type, with broken path detection |

Context usage changes color as it fills up. Cost goes from green to red. Failed MCP servers and broken hooks are highlighted immediately.

## Install

```bash
npm install -g claude-pulse
```

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "claude-pulse"
  }
}
```

Restart Claude Code. The statusline appears above the input area.

<details>
<summary><strong>Install from source</strong></summary>

```bash
git clone https://github.com/ali-nr/claude-pulse.git
cd claude-pulse
bun install
bun run build
```

Use the full path in settings: `"command": "node /path/to/claude-pulse/dist/cli.js"`

</details>

## Customize

Create `~/.config/claude-pulse/config.json` to override defaults. You only need to include what you want to change.

<details>
<summary><strong>Layout</strong></summary>

The 5-line structure is fixed. You can enable/disable lines and change separators:

```json
{
  "lines": {
    "hooks": { "enabled": false },
    "engine": { "separator": " | " }
  }
}
```

| Line | Key | Can toggle |
|------|-----|------------|
| Identity | — | No (fixed branding) |
| Git | `git` | Yes |
| Engine | `engine` | Yes |
| MCP | `mcp` | Yes |
| Hooks | `hooks` | Yes |

</details>

<details>
<summary><strong>Context window</strong></summary>

```json
{
  "components": {
    "context": {
      "style": "compact",
      "showTokens": true,
      "showRate": false,
      "thresholds": { "warn": 70, "critical": 85, "danger": 95 }
    }
  }
}
```

| Style | Example |
|-------|---------|
| `compact` | `42%` |
| `bar` | `●●●●○○○○○○ 42%` |
| `detailed` | `84.0k/200.0k (42%)` |
| `both` | `●●●●○○○○○○ used:84.0k free:116.0k` |

Enable `showTokens` to see `↓input ↑output ⟳cache` breakdown.

</details>

<details>
<summary><strong>MCP servers</strong></summary>

```json
{
  "components": {
    "mcp": {
      "showNames": true,
      "showOnlyProblems": true,
      "maxDisplay": 4
    }
  }
}
```

- `showNames: true` — list each server with status icon
- `showOnlyProblems: true` — hide MCP line when everything is healthy
- Failed/disconnected servers always show in red

| Icon | Status |
|------|--------|
| `✓` | Connected |
| `✗` | Disconnected |
| `○` | Disabled |
| `▲` | Error |

</details>

<details>
<summary><strong>Hooks</strong></summary>

```json
{
  "components": {
    "hooks": {
      "showNames": true,
      "showCount": true
    }
  }
}
```

| Setting | Result |
|---------|--------|
| Both `true` (default) | `⚡Hooks 8 Submit:3 timezone-context,best-practices Post:2 lint-check` |
| `showNames: false` | `⚡Hooks 8 Submit:3 Post:2 Start:2 End:1` |
| Both `false` | `⚡Hooks 8` |

Broken hooks (invalid file paths) always show in red with `▲`.

</details>

<details>
<summary><strong>Cost</strong></summary>

```json
{
  "components": {
    "cost": {
      "showBurnRate": true,
      "label": "$"
    }
  }
}
```

Colors change automatically: green < $1, yellow $1-$2, peach $2-$5, red > $5. Burn rate appears after the session is longer than 1 minute.

</details>

<details>
<summary><strong>Subscription tier</strong></summary>

Auto-detects from `~/.claude.json`. Override if detection doesn't work:

```json
{
  "components": {
    "tier": {
      "enabled": true,
      "override": "max"
    }
  }
}
```

Options: `"pro"`, `"max"`, `"api"`.

</details>

<details>
<summary><strong>Other components</strong></summary>

| Component | Key Options |
|-----------|-------------|
| `model` | `showIcon: true` adds emoji per model |
| `session` | `showDuration: true`, `showId: false` |
| `cache` | Shows cache hit rate percentage |
| `linesChanged` | Shows `+added -removed` lines changed |
| `time` | `format: "12h"` or `"24h"`, `showTimezone: true` |

All components accept `"enabled": false` to hide them.

</details>

## Development

```bash
bun install          # Install dependencies
bun run build        # Build to dist/
bun run lint         # Run Biome linter
bun run dev          # Watch mode
```

## License

MIT
