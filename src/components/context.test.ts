/**
 * Unit tests for renderContext component
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import type { ClaudeStatusInput } from "../schema";
import { catppuccin as theme } from "../themes/catppuccin";
import { renderContext } from "./context";

const mockInput = (
	overrides: Partial<ClaudeStatusInput["context_window"]> = {},
	costOverrides: Partial<ClaudeStatusInput["cost"]> = {},
): ClaudeStatusInput =>
	({
		context_window: {
			total_input_tokens: 50000,
			total_output_tokens: 10000,
			context_window_size: 200000,
			used_percentage: 30,
			remaining_percentage: 70,
			current_usage: {
				input_tokens: 50000,
				output_tokens: 10000,
				cache_creation_input_tokens: 5000,
				cache_read_input_tokens: 30000,
			},
			...overrides,
		},
		cost: {
			total_cost_usd: 0.5,
			total_duration_ms: 120000,
			total_api_duration_ms: 5000,
			total_lines_added: 0,
			total_lines_removed: 0,
			...costOverrides,
		},
	}) as ClaudeStatusInput;

describe("renderContext", () => {
	describe("initialization", () => {
		test("should return empty text when disabled", () => {
			const result = renderContext(mockInput(), { enabled: false }, theme);
			expect(result.text).toBe("");
		});

		test("should render with default config", () => {
			const result = renderContext(mockInput(), {}, theme);
			expect(result.text).toContain("30%");
		});
	});

	describe("display styles", () => {
		test("should render compact style as percentage only", () => {
			const result = renderContext(mockInput(), { style: "compact" }, theme);
			expect(result.text).toContain("30%");
			expect(result.text).not.toContain("●");
		});

		test("should render bar style with filled and empty circles", () => {
			const result = renderContext(mockInput(), { style: "bar" }, theme);
			expect(result.text).toContain("●");
			expect(result.text).toContain("○");
			expect(result.text).toContain("30%");
		});

		test("should render detailed style with token counts", () => {
			const result = renderContext(mockInput(), { style: "detailed" }, theme);
			expect(result.text).toContain("60.0k");
			expect(result.text).toContain("200.0k");
			expect(result.text).toContain("30%");
		});

		test("should render both style with bar and free/used labels", () => {
			const result = renderContext(mockInput(), { style: "both" }, theme);
			expect(result.text).toContain("●");
			expect(result.text).toContain("used:");
			expect(result.text).toContain("free:");
		});
	});

	describe("color thresholds", () => {
		test("should use green when under warn threshold", () => {
			const result = renderContext(mockInput({ used_percentage: 50 }), { style: "compact" }, theme);
			expect(result.text).toContain(theme.green);
		});

		test("should use yellow when at warn threshold", () => {
			const result = renderContext(mockInput({ used_percentage: 70 }), { style: "compact" }, theme);
			expect(result.text).toContain(theme.yellow);
		});

		test("should use peach when at critical threshold", () => {
			const result = renderContext(mockInput({ used_percentage: 85 }), { style: "compact" }, theme);
			expect(result.text).toContain(theme.peach);
		});

		test("should use red when at danger threshold", () => {
			const result = renderContext(mockInput({ used_percentage: 95 }), { style: "compact" }, theme);
			expect(result.text).toContain(theme.red);
		});

		test("should respect custom thresholds", () => {
			const result = renderContext(
				mockInput({ used_percentage: 50 }),
				{ style: "compact", thresholds: { warn: 40, critical: 60, danger: 80 } },
				theme,
			);
			expect(result.text).toContain(theme.yellow);
		});
	});

	describe("token display", () => {
		test("should show token breakdown when showTokens is enabled", () => {
			const result = renderContext(mockInput(), { style: "compact", showTokens: true }, theme);
			expect(result.text).toContain("↓");
			expect(result.text).toContain("↑");
		});

		test("should show cache reads when cache tokens exist", () => {
			const result = renderContext(mockInput(), { style: "compact", showTokens: true }, theme);
			expect(result.text).toContain("⟳");
		});

		test("should not show tokens when showTokens is disabled", () => {
			const result = renderContext(mockInput(), { style: "compact", showTokens: false }, theme);
			expect(result.text).not.toContain("↓");
			expect(result.text).not.toContain("↑");
		});
	});

	describe("rate display", () => {
		test("should show rate when enabled and duration is sufficient", () => {
			const result = renderContext(
				mockInput({}, { total_duration_ms: 60000 }),
				{ style: "compact", showRate: true },
				theme,
			);
			expect(result.text).toContain("/min");
		});

		test("should not show rate when disabled", () => {
			const result = renderContext(mockInput(), { style: "compact", showRate: false }, theme);
			expect(result.text).not.toContain("/min");
		});
	});

	describe("compact hint", () => {
		test("should show compact hint when enabled and usage is high", () => {
			const result = renderContext(
				mockInput({ used_percentage: 85 }),
				{ style: "compact", showCompactHint: true },
				theme,
			);
			expect(result.text).toContain("/compact");
		});

		test("should not show compact hint when usage is low", () => {
			const result = renderContext(
				mockInput({ used_percentage: 50 }),
				{ style: "compact", showCompactHint: true },
				theme,
			);
			expect(result.text).not.toContain("/compact");
		});
	});

	describe("edge cases", () => {
		test("should handle zero percentage", () => {
			const result = renderContext(mockInput({ used_percentage: 0 }), { style: "compact" }, theme);
			expect(result.text).toContain("0%");
		});

		test("should handle 100 percentage", () => {
			const result = renderContext(
				mockInput({ used_percentage: 100 }),
				{ style: "compact" },
				theme,
			);
			expect(result.text).toContain("100%");
		});

		test("should use custom label", () => {
			const result = renderContext(mockInput(), { style: "compact", label: "Context" }, theme);
			expect(result.text).toContain("Context");
		});
	});
});
