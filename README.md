# claude-pulse

A customizable, real-time statusline for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

See your tokens, cost, context usage, MCP servers, git status, and hooks — all at a glance while you work.

![claude-pulse statusline](assets/demo.png)

## Quick Start

### 1. Install

```bash
# Clone and build
git clone https://github.com/ali-nr/claude-pulse.git
cd claude-pulse
bun install
bun run build
```

### 2. Configure Claude Code

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/claude-pulse/dist/cli.js"
  }
}
```

Replace `/path/to/claude-pulse` with the actual path where you cloned the repo.

### 3. Done

Restart Claude Code. You'll see the statusline appear above the input area.

## What Each Section Shows

```
♥ pulse ▶ ~/dev/my-project          ← Line 1: Project identity
⎇ main │ +3 new ~5 mod              ← Line 2: Git branch + file changes
◆ MAX │ Opus │ CTX 42% ... │ $2.37  ← Line 3: Subscription, model, tokens, cost, duration
⬢ MCP 3/3: context7 ✓ ...          ← Line 4: MCP server connections
⚡Hooks 4 Submit:2 ...              ← Line 5: Active hooks by event type
```

### Token Display

| Symbol | Meaning |
|--------|---------|
| `CTX 42%` | Context window usage (how full Claude's memory is) |
| `↓85.0k` | Input tokens — everything sent to Claude (your messages, files, tool results) |
| `↑15.0k` | Output tokens — everything Claude has written back |
| `⟳45.0k` | Cache reads — tokens served from cache (saves cost) |

### MCP Server Status

| Icon | Meaning |
|------|---------|
| `✓` | Connected and working |
| `✗` | Disconnected |
| `○` | Disabled (detected from `~/.claude.json`) |
| `▲` | Error |

### Cost Display

- Green: under $1
- Yellow: $1–$2
- Peach: $2–$5
- Red: over $5
- Burn rate `($X.XX/hr)` shown when session is longer than 1 minute

## Configuration

Create `~/.config/claude-pulse/config.json` to customize. Here's a full example:

```json
{
  "theme": "catppuccin",
  "lines": [
    {
      "enabled": true,
      "components": ["name", "cwd"],
      "separator": " "
    },
    {
      "enabled": true,
      "components": ["branch", "status"],
      "separator": " │ "
    },
    {
      "enabled": true,
      "components": ["tier", "model", "context", "cost", "session"],
      "separator": " │ "
    },
    {
      "enabled": true,
      "components": ["mcp"],
      "separator": " │ "
    },
    {
      "enabled": true,
      "components": ["hooks"],
      "separator": " │ "
    }
  ],
  "components": {
    "name": {
      "custom": "pulse"
    },
    "tier": {
      "enabled": true,
      "override": "max",
      "labels": { "pro": "◆ PRO", "max": "◆ MAX", "api": "◆ API" }
    },
    "model": {
      "showIcon": false
    },
    "context": {
      "style": "compact",
      "showRate": false,
      "showTokens": true,
      "showCompactHint": false
    },
    "cost": {
      "showBurnRate": true
    },
    "mcp": {
      "showNames": true,
      "showOnlyProblems": false,
      "label": "⬢ MCP"
    },
    "cwd": {
      "style": "short",
      "showIcon": true
    },
    "branch": {
      "label": "⎇"
    },
    "session": {
      "showDuration": true,
      "showId": false,
      "label": ""
    },
    "hooks": {
      "enabled": true,
      "label": "Hooks"
    }
  }
}
```

## Components Reference

| Component | Description | Key Options |
|-----------|-------------|-------------|
| `name` | Project name or pulse logo | `custom`: `"pulse"` (animated logo), `"logo"`, or any string |
| `cwd` | Current working directory | `style`: `"short"`, `"full"`, `"basename"` / `showIcon` |
| `branch` | Git branch name | `label`: prefix string (e.g. `"⎇"`) |
| `status` | Git file changes | Shows `+N new ~N mod -N del` with colors |
| `tier` | Subscription tier (PRO/MAX/API) | `override`: force a tier / `labels`: customize text |
| `model` | Current Claude model | `showIcon`: show emoji before model name |
| `context` | Context window usage | `style`: `"compact"`, `"bar"`, `"detailed"`, `"both"` / `showTokens` / `showRate` |
| `cost` | Session cost | `showBurnRate` / `showProjection` |
| `session` | Session duration and ID | `showDuration` / `showId` |
| `mcp` | MCP server status | `showNames` / `showOnlyProblems` / `maxDisplay` |
| `hooks` | Active hooks by event type | Shows hook names and counts per event |
| `cache` | Cache efficiency percentage | Color-coded hit rate |
| `linesChanged` | Code delta | Shows `+added -removed` lines |

## Context Styles

| Style | Example | Description |
|-------|---------|-------------|
| `compact` | `42%` | Just the percentage |
| `bar` | `●●●●○○○○○○ 42%` | Visual bar with percentage |
| `detailed` | `84.0k/200.0k (42%)` | Token counts and percentage |
| `both` | `●●●●○○○○○○ used:84.0k free:116.0k (58%)` | Bar with full breakdown |

## Minimal Config

Don't want 5 lines? Here's a compact single-line setup:

```json
{
  "lines": [
    {
      "components": ["model", "context", "cost", "branch", "session"],
      "separator": " │ "
    }
  ],
  "components": {
    "context": { "style": "compact" },
    "cost": { "showBurnRate": true }
  }
}
```

Result: `Opus │ CTX 42% │ $2.37 ($4.74/hr) │ main │ 30m`

## How It Works

Claude Code invokes the statusline script on every message update (throttled to ~300ms). The script receives session data as JSON on stdin, renders the configured components with ANSI colors, and outputs the result to stdout.

- Stateless — each invocation is independent
- Fast — renders in under 50ms
- No network calls — all data comes from stdin or local files
- Catppuccin Mocha theme with 24-bit color

## Development

```bash
bun install          # Install dependencies
bun run build        # Build to dist/
bun run lint         # Run Biome linter
bun run dev          # Watch mode

# Test with sample data
echo '{"hook_event_name":"Status",...}' | bun run src/cli.ts
```

## License

MIT
