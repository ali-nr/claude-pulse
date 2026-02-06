# cc-pulse

[![npm version](https://img.shields.io/npm/v/cc-pulse)](https://www.npmjs.com/package/cc-pulse)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A real-time statusline for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

![cc-pulse statusline](assets/demo.png)

## 🚀 Quick Start

```bash
npm install -g cc-pulse
```

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "cc-pulse"
  }
}
```

Restart Claude Code — the statusline appears above the input area.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **→Compact indicator** | Shows remaining % until auto-compaction — colors shift from green to red as you approach the limit |
| **Token breakdown** | Input ↓, output ↑, and cache ⟳ tokens at a glance |
| **Cost tracking** | Session cost with color coding ($1 yellow, $2 orange, $5+ red) |
| **MCP health** | Live connection status for all MCP servers |
| **Hook monitoring** | Active hooks by event type, with broken path detection |
| **Git status** | Branch name + new/modified/deleted file counts |

## 📊 What You Get

Five lines of information, updated on every message:

```
♥ pulse ▶ ~/dev/my-project
⎇ main │ +2 new ~3 mod
◆ MAX │ Opus │ →Compact ●●●●●○○○○○ 50% ↓84k ↑16k ⟳5k │ $0.50 │ 3m
⬢ MCP 3/3: context7 ✓  deepwiki ✓  chrome-devtools ✓
⚡Hooks 8 Submit:3 timezone-context,best-practices Post:2 lint-check
```

| Line | Content |
|------|---------|
| **Identity** | Project name + working directory |
| **Git** | Branch + file changes (new, modified, deleted) |
| **Engine** | Tier, model, context remaining, tokens, cost, duration |
| **MCP** | Server count + individual status (✓ connected, ✗ disconnected, ○ disabled) |
| **Hooks** | Hook count by event type, with broken path warnings |

## ⚙️ Configuration

Create `~/.config/claude-pulse/config.json` to customize. Only include what you want to change.

<details>
<summary><strong>Context Window</strong></summary>

The `→Compact` indicator shows remaining space until auto-compaction. When it reaches 0%, Claude compacts the conversation.

```json
{
  "components": {
    "context": {
      "style": "bar",
      "showTokens": true,
      "thresholds": { "warn": 70, "critical": 85, "danger": 95 }
    }
  }
}
```

| Style | Example |
|-------|---------|
| `bar` (default) | `→Compact ●●●●●●○○○○ 58%` |
| `compact` | `→Compact 58%` |
| `detailed` | `→Compact 116.0k/200.0k (58%)` |
| `both` | `●●●●●●○○○○ free:116.0k used:84.0k` |

**Color thresholds** — as remaining % drops:
- **Green**: > 30% remaining (safe)
- **Yellow**: 30% remaining (warn)
- **Orange**: 15% remaining (critical)
- **Red + 🔴**: 5% remaining (danger)

</details>

<details>
<summary><strong>Subscription Tier</strong></summary>

Set your plan manually (auto-detection isn't reliable):

```json
{
  "components": {
    "tier": {
      "override": "max"
    }
  }
}
```

Options: `"pro"`, `"max"`, `"api"`

</details>

<details>
<summary><strong>MCP Servers</strong></summary>

```json
{
  "components": {
    "mcp": {
      "showNames": true,
      "showOnlyProblems": false,
      "maxDisplay": 4
    }
  }
}
```

| Option | Effect |
|--------|--------|
| `showNames: true` | List each server with status |
| `showOnlyProblems: true` | Hide line when all servers healthy |
| `maxDisplay: 4` | Limit servers shown ("+N more" for rest) |

| Icon | Status |
|------|--------|
| ✓ | Connected |
| ✗ | Disconnected (red) |
| ○ | Disabled |
| ▲ | Error |

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
| Both `true` | `⚡Hooks 8 Submit:3 timezone-context,best-practices` |
| `showNames: false` | `⚡Hooks 8 Submit:3 Post:2 End:1` |
| Both `false` | `⚡Hooks 8` |

Broken hooks (invalid paths) show in red with ▲.

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

Color thresholds: green < $1, yellow $1-$2, orange $2-$5, red > $5

</details>

<details>
<summary><strong>Layout</strong></summary>

The 5-line structure is fixed. You can toggle lines and change separators:

```json
{
  "lines": {
    "hooks": { "enabled": false },
    "engine": { "separator": " | " }
  }
}
```

| Line | Key | Toggleable |
|------|-----|------------|
| Identity | — | No (branding) |
| Git | `git` | Yes |
| Engine | `engine` | Yes |
| MCP | `mcp` | Yes |
| Hooks | `hooks` | Yes |

</details>

<details>
<summary><strong>All Components</strong></summary>

| Component | Key Options |
|-----------|-------------|
| `model` | `showIcon: true` adds emoji per model |
| `session` | `showDuration: true`, `showId: false` |
| `cache` | Shows cache hit rate |
| `linesChanged` | Shows `+added -removed` |
| `time` | `format: "12h"/"24h"`, `showTimezone: true` |

All components accept `"enabled": false` to hide them.

</details>

## 🛠️ Development

```bash
git clone https://github.com/ali-nr/claude-pulse.git
cd claude-pulse
bun install
bun run build
bun test
```

Use full path in settings: `"command": "node /path/to/claude-pulse/dist/cli.js"`

## License

MIT
