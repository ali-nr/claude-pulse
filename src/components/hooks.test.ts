/**
 * Unit tests for hooks component
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import { extractHookInfo } from "./hooks";

describe("extractHookInfo", () => {
	describe("file path extraction", () => {
		test("should extract name from file path command", () => {
			const result = extractHookInfo("bun run /Users/test/.claude/hooks/lint-check.ts");
			expect(result.name).toBe("lint-check");
		});

		test("should strip file extension from name", () => {
			const result = extractHookInfo("node /path/to/my-script.js");
			expect(result.name).toBe("my-script");
		});

		test("should detect broken path when file does not exist", () => {
			const result = extractHookInfo("bun run /nonexistent/path/to/missing-hook.ts");
			expect(result.broken).toBe(true);
		});
	});

	describe("environment variable expansion", () => {
		test("should expand $CLAUDE_PROJECT_DIR in path", () => {
			const origVal = process.env.CLAUDE_PROJECT_DIR;
			process.env.CLAUDE_PROJECT_DIR = "/tmp";
			try {
				const result = extractHookInfo(
					'bun run "$CLAUDE_PROJECT_DIR"/.claude/hooks/auto-context.ts',
				);
				expect(result.name).toBe("auto-context");
				// /tmp/.claude/hooks/auto-context.ts won't exist
				expect(result.broken).toBe(true);
			} finally {
				if (origVal === undefined) delete process.env.CLAUDE_PROJECT_DIR;
				else process.env.CLAUDE_PROJECT_DIR = origVal;
			}
		});

		test("should expand env var without quotes", () => {
			const origVal = process.env.MY_HOOK_DIR;
			process.env.MY_HOOK_DIR = "/some/path";
			try {
				const result = extractHookInfo("bun run $MY_HOOK_DIR/lint.ts");
				expect(result.name).toBe("lint");
			} finally {
				if (origVal === undefined) delete process.env.MY_HOOK_DIR;
				else process.env.MY_HOOK_DIR = origVal;
			}
		});

		test("should keep literal $VAR when env var is unset", () => {
			delete process.env.__NONEXISTENT_TEST_VAR__;
			const result = extractHookInfo("bun run $__NONEXISTENT_TEST_VAR__/.claude/hooks/test.ts");
			expect(result.name).toBe("test");
		});
	});

	describe("command-only extraction", () => {
		test("should use command name when no file path present", () => {
			const result = extractHookInfo("cm reflect --days 1");
			expect(result.name).toBe("cm-reflect");
			expect(result.broken).toBe(false);
		});

		test("should use single command name", () => {
			const result = extractHookInfo("eslint");
			expect(result.name).toBe("eslint");
			expect(result.broken).toBe(false);
		});
	});
});
