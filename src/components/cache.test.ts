/**
 * Unit tests for renderCache component
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import type { ClaudeStatusInput } from "../schema";
import { catppuccin as theme } from "../themes/catppuccin";
import { renderCache } from "./cache";

const mockInput = (
	overrides: Partial<ClaudeStatusInput["context_window"]["current_usage"]> = {},
): ClaudeStatusInput =>
	({
		context_window: {
			current_usage: {
				input_tokens: 10000,
				output_tokens: 5000,
				cache_creation_input_tokens: 2000,
				cache_read_input_tokens: 30000,
				...overrides,
			},
		},
	}) as ClaudeStatusInput;

describe("renderCache", () => {
	describe("initialization", () => {
		test("should return empty text when disabled", () => {
			const result = renderCache(mockInput(), { enabled: false }, theme);
			expect(result.text).toBe("");
		});

		test("should return empty when no usage data", () => {
			const result = renderCache({} as ClaudeStatusInput, {}, theme);
			expect(result.text).toBe("");
		});

		test("should return empty when all tokens are zero", () => {
			const result = renderCache(
				mockInput({
					input_tokens: 0,
					cache_creation_input_tokens: 0,
					cache_read_input_tokens: 0,
				}),
				{},
				theme,
			);
			expect(result.text).toBe("");
		});
	});

	describe("hit rate calculation", () => {
		test("should show high hit rate in green", () => {
			// 30000 / (10000 + 2000 + 30000) = 71%
			const result = renderCache(mockInput(), {}, theme);
			expect(result.text).toContain(theme.green);
			expect(result.text).toContain("71%");
		});

		test("should show medium hit rate in yellow", () => {
			// 20000 / (20000 + 5000 + 20000) = 44%
			const result = renderCache(
				mockInput({
					input_tokens: 20000,
					cache_creation_input_tokens: 5000,
					cache_read_input_tokens: 20000,
				}),
				{},
				theme,
			);
			expect(result.text).toContain(theme.yellow);
		});

		test("should show low hit rate in red", () => {
			// 5000 / (30000 + 5000 + 5000) = 12%
			const result = renderCache(
				mockInput({
					input_tokens: 30000,
					cache_creation_input_tokens: 5000,
					cache_read_input_tokens: 5000,
				}),
				{},
				theme,
			);
			expect(result.text).toContain(theme.red);
		});
	});

	describe("label", () => {
		test("should use default Cache label", () => {
			const result = renderCache(mockInput(), {}, theme);
			expect(result.text).toContain("Cache:");
		});

		test("should use custom label", () => {
			const result = renderCache(mockInput(), { label: "HitRate" }, theme);
			expect(result.text).toContain("HitRate:");
		});
	});
});
