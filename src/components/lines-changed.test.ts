/**
 * Unit tests for renderLinesChanged component
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import type { ClaudeStatusInput } from "../schema";
import { catppuccin as theme } from "../themes/catppuccin";
import { renderLinesChanged } from "./lines-changed";

const mockInput = (added = 10, removed = 3): ClaudeStatusInput =>
	({
		cost: {
			total_lines_added: added,
			total_lines_removed: removed,
		},
	}) as ClaudeStatusInput;

describe("renderLinesChanged", () => {
	describe("initialization", () => {
		test("should return empty text when disabled", () => {
			const result = renderLinesChanged(mockInput(), { enabled: false }, theme);
			expect(result.text).toBe("");
		});

		test("should return empty when no lines changed", () => {
			const result = renderLinesChanged(mockInput(0, 0), {}, theme);
			expect(result.text).toBe("");
		});
	});

	describe("success cases", () => {
		test("should show added lines in green", () => {
			const result = renderLinesChanged(mockInput(10, 0), {}, theme);
			expect(result.text).toContain(theme.green);
			expect(result.text).toContain("+10");
		});

		test("should show removed lines in red", () => {
			const result = renderLinesChanged(mockInput(0, 5), {}, theme);
			expect(result.text).toContain(theme.red);
			expect(result.text).toContain("-5");
		});

		test("should show both added and removed", () => {
			const result = renderLinesChanged(mockInput(10, 3), {}, theme);
			expect(result.text).toContain("+10");
			expect(result.text).toContain("-3");
		});
	});
});
