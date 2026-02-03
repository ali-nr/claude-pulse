/**
 * Unit tests for renderSession component
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import type { ClaudeStatusInput } from "../schema";
import { catppuccin as theme } from "../themes/catppuccin";
import { renderSession } from "./session";

const mockInput = (
	overrides: Partial<ClaudeStatusInput["cost"]> = {},
	sessionId = "abc12345-def6-7890",
): ClaudeStatusInput =>
	({
		session_id: sessionId,
		cost: {
			total_cost_usd: 0.5,
			total_duration_ms: 300000,
			total_api_duration_ms: 5000,
			total_lines_added: 0,
			total_lines_removed: 0,
			...overrides,
		},
	}) as ClaudeStatusInput;

describe("renderSession", () => {
	describe("initialization", () => {
		test("should return empty text when disabled", () => {
			const result = renderSession(mockInput(), { enabled: false }, theme);
			expect(result.text).toBe("");
		});
	});

	describe("duration formatting", () => {
		test("should show seconds for short sessions", () => {
			const result = renderSession(mockInput({ total_duration_ms: 45000 }), {}, theme);
			expect(result.text).toContain("45s");
		});

		test("should show minutes and seconds", () => {
			const result = renderSession(mockInput({ total_duration_ms: 125000 }), {}, theme);
			expect(result.text).toContain("2m");
			expect(result.text).toContain("5s");
		});

		test("should show hours and minutes for long sessions", () => {
			const result = renderSession(mockInput({ total_duration_ms: 3720000 }), {}, theme);
			expect(result.text).toContain("1h");
			expect(result.text).toContain("2m");
		});

		test("should show hours without minutes when exact", () => {
			const result = renderSession(mockInput({ total_duration_ms: 3600000 }), {}, theme);
			expect(result.text).toContain("1h");
			// Should not contain " 0m" (space + 0m), not just "0m" which matches ANSI reset \x1b[0m
			expect(result.text).not.toContain(" 0m");
		});

		test("should not show duration when showDuration is false", () => {
			const result = renderSession(
				mockInput({ total_duration_ms: 300000 }),
				{ showDuration: false },
				theme,
			);
			expect(result.text).toBe("");
		});
	});

	describe("session ID", () => {
		test("should show truncated session ID when enabled", () => {
			const result = renderSession(mockInput(), { showId: true }, theme);
			expect(result.text).toContain("#abc12345");
		});

		test("should not show session ID by default", () => {
			const result = renderSession(mockInput(), {}, theme);
			expect(result.text).not.toContain("#abc12345");
		});
	});

	describe("edge cases", () => {
		test("should return empty when no duration data", () => {
			const result = renderSession(
				{ cost: {} } as ClaudeStatusInput,
				{ showDuration: true },
				theme,
			);
			expect(result.text).toBe("");
		});
	});
});
