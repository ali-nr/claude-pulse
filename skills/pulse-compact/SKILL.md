---
name: pulse-compact
description: Toggle Claude Pulse compact mode (minimal status line with counts only)
---

# Pulse Compact Toggle

Toggle compact mode for the Claude Pulse status line. Compact mode shows only counts and essential info — no server names, skill names, hook names, or token details.

## Instructions

1. Read the Claude Pulse config file. Check these paths in order:
   - `~/.config/claude-pulse/config.json`
   - `~/.claude-pulse.json`

   If neither exists, create `~/.config/claude-pulse/config.json` with `{}`.

2. Toggle the `"compact"` field:
   - If `compact` is `true`, set it to `false` (or remove it)
   - If `compact` is `false` or missing, set it to `true`

3. Write the updated JSON back to the config file.

4. Report the new state to the user:
   - If now compact: "Pulse compact mode **on** — status line will show counts only"
   - If now full: "Pulse compact mode **off** — status line will show full details"
