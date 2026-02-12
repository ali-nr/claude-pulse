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
| **Context usage** | Shows % used with color-coded bar — green to red as you approach limits |
| **Token breakdown** | Input ↓, output ↑, and cache ⟳ tokens at a glance |
| **Model info** | Shows model with version (e.g., "Opus 4.5", "Sonnet 3.5") |
| **Cost tracking** | Session cost with color coding ($1 yellow, $2 orange, $5+ red) |
| **MCP health** | Live connection status for all MCP servers |
| **Hook monitoring** | Active hooks by event type, with broken path detection |
| **Skills display** | Shows your custom slash commands/skills |
| **Git status** | Branch name + new/modified/deleted file counts |

## 📊 What You Get

Six lines of information, updated on every message:

![cc-pulse statusline](assets/demo.png)

| Line | Content |
|------|---------|
| **Identity** | Project name + working directory |
| **Git** | Branch + file changes (new, modified, deleted) |
| **Engine** | Tier, model, context used, tokens, cost, duration |
| **MCP** | Server count + individual status (✓ connected, ✗ disconnected, ○ disabled) |
| **Hooks** | Hook count by event type, with broken path warnings |
| **Skills** | Custom slash commands count + names |

## ⚙️ Configuration

Create `~/.config/claude-pulse/config.json` to customize. Only include what you want to change.

<details>
<summary><strong>Context Window</strong></summary>

Shows how much of the context window is used. Colors shift as usage increases.

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
| `bar` (default) | `Used ●●●●●●○○○○ 58%` |
| `percent` | `Used 58%` |
| `detailed` | `Used 116.0k/200.0k (58%)` |
| `both` | `●●●●●●○○○○ 116.0k / 200.0k` |

**Color thresholds** — as used % increases:
- **Green**: < 70% used (safe)
- **Yellow**: 70% used (warn)
- **Orange**: 85% used (critical)
- **Red + 🔴**: 95% used (danger)

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
<summary><strong>Skills</strong></summary>

Shows your custom slash commands from `~/.claude/skills/` and `.claude/skills/`.

```json
{
  "components": {
    "skills": {
      "showNames": true,
      "showCount": true,
      "maxDisplay": 5
    }
  }
}
```

| Setting | Result |
|---------|--------|
| Both `true` | `✦ Skills 5 commit,pr,branch` |
| `showNames: false` | `✦ Skills 5` |
| `maxDisplay: 3` | Shows first 3 names + overflow count |

Broken skills (missing SKILL.md or invalid frontmatter) show in red with ▲.

</details>

<details>
<summary><strong>Layout</strong></summary>

The 6-line structure is fixed. You can toggle lines and change separators:

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
| Skills | `skills` | Yes |

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
