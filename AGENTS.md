# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

## Testing

Run tests with `bun test`. Test files live next to their source as `*.test.ts`.

### AAA Pattern (Arrange-Act-Assert)

Every test follows three distinct phases:

```typescript
test("should return red cost when over $5", () => {
  // Arrange — set up inputs and expected state
  const input = { cost: { total_cost_usd: 7.50 } };
  const config = { enabled: true };

  // Act — call the function under test
  const result = renderCost(input, config, theme);

  // Assert — verify the output
  expect(result.text).toContain("7.50");
});
```

### Rules

- **One behavior per test** — if you need "and" in the test name, split it into two tests
- **No test interdependence** — tests must pass in any order, never rely on shared mutable state
- **Test the interface, not the implementation** — call the public function, assert the output. Don't test private helpers directly
- **Descriptive names** — use `"should [action] when [condition]"` format
- **Realistic inputs** — use data that resembles actual Claude Code JSON, not placeholder values
- **No network calls in tests** — mock `execSync` for anything that shells out (e.g., `claude mcp list`, `git`)

### What to Test

| Priority | What | Why |
|----------|------|-----|
| High | Component renderers (`renderContext`, `renderCost`, `renderMcp`, etc.) | Pure functions, easy to test, core output |
| High | Config merging (`mergeConfig`, `getLines`) | Wrong defaults break everything |
| High | MCP output parsing (`parseMcpOutput`) | Fragile regex against external CLI output |
| High | Hook path extraction (`extractHookInfo`) | File path validation logic |
| Medium | Schema parsing (`parseClaudeInput`) | Input boundary |
| Low | Theme constants | Static values, unlikely to break |

### Running

```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test src/components/cost.test.ts  # Single file
```
