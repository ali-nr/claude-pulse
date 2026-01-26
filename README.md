# claude-pulse

A slick, reactive statusline for Claude Code.

![Demo](assets/demo.gif)

## Features

- **Tier detection** - Shows PRO/MAX based on your subscription
- **Smart context** - Visual bar with usage rate and compact hints
- **Cost tracking** - Session cost with burn rate ($/hr)
- **MCP status** - Individual server names with connection status
- **Git integration** - Branch and file status
- **Output style** - Current output mode indicator
- **Themeable** - Catppuccin theme built-in

## Installation

```bash
# npm
npm install -g claude-pulse

# bun
bun add -g claude-pulse

# From source
git clone https://github.com/alireza/claude-pulse
cd claude-pulse
bun install
bun run build:binary
```

## Setup

After installation, configure Claude Code to use claude-pulse:

```bash
claude-pulse setup
```

Or manually add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "claude-pulse"
  }
}
```

## Configuration

Create `~/.config/claude-pulse/config.json`:

```json
{
  "theme": "catppuccin",
  "lines": [
    {
      "enabled": true,
      "components": ["tier", "model", "context", "cost"],
      "separator": " │ "
    },
    {
      "enabled": true,
      "components": ["mcp"],
      "separator": " "
    },
    {
      "enabled": true,
      "components": ["outputStyle", "branch", "status"],
      "separator": " │ "
    }
  ],
  "components": {
    "context": {
      "style": "bar",
      "showRate": true,
      "showCompactHint": true,
      "thresholds": { "warn": 70, "critical": 85, "danger": 95 }
    },
    "cost": {
      "showBurnRate": true,
      "showProjection": false
    },
    "mcp": {
      "showNames": true,
      "maxDisplay": 4
    }
  }
}
```

## Components

| Component | Description |
|-----------|-------------|
| `tier` | PRO/MAX/API subscription indicator |
| `model` | Current model with icon (🧠 Opus, 🎵 Sonnet, ⚡ Haiku) |
| `context` | Context window usage with visual bar |
| `cost` | Session cost with optional burn rate |
| `mcp` | MCP servers with connection status |
| `outputStyle` | Current output style |
| `branch` | Git branch name |
| `status` | Git file changes (+added -deleted ~modified) |

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Build
bun run build

# Build standalone binary
bun run build:binary

# Lint
bun run lint
```

## License

MIT
