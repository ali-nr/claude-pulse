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
