/**
 * Unit tests for renderCost component
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import type { ClaudeStatusInput } from "../schema";
import { catppuccin as theme } from "../themes/catppuccin";
import { renderCost } from "./cost";

const mockInput = (overrides: Partial<ClaudeStatusInput["cost"]> = {}): ClaudeStatusInput =>
	({
		cost: {
			total_cost_usd: 0.5,
			total_duration_ms: 120000,
			total_api_duration_ms: 5000,
			total_lines_added: 0,
			total_lines_removed: 0,
			...overrides,
		},
	}) as ClaudeStatusInput;

describe("renderCost", () => {
	describe("initialization", () => {
		test("should return empty text when disabled", () => {
			const result = renderCost(mockInput(), { enabled: false }, theme);
			expect(result.text).toBe("");
		});

		test("should render with default config", () => {
			const result = renderCost(mockInput(), {}, theme);
			expect(result.text).toContain("0.50");
		});
	});

	describe("cost formatting", () => {
		test("should show 3 decimal places when cost is under $0.01", () => {
			const result = renderCost(mockInput({ total_cost_usd: 0.005 }), {}, theme);
			expect(result.text).toContain("0.005");
		});

		test("should show 2 decimal places when cost is $0.01 or above", () => {
			const result = renderCost(mockInput({ total_cost_usd: 1.234 }), {}, theme);
			expect(result.text).toContain("1.23");
		});

		test("should use custom label", () => {
			const result = renderCost(mockInput(), { label: "Cost:" }, theme);
			expect(result.text).toContain("Cost:");
		});

		test("should use default $ label", () => {
			const result = renderCost(mockInput(), {}, theme);
			expect(result.text).toContain("$");
		});
	});

	describe("color thresholds", () => {
		test("should use green for cost under $1", () => {
			const result = renderCost(mockInput({ total_cost_usd: 0.5 }), {}, theme);
			expect(result.text).toContain(theme.green);
		});

		test("should use yellow for cost between $1 and $2", () => {
			const result = renderCost(mockInput({ total_cost_usd: 1.5 }), {}, theme);
			expect(result.text).toContain(theme.yellow);
		});

		test("should use peach for cost between $2 and $5", () => {
			const result = renderCost(mockInput({ total_cost_usd: 3.0 }), {}, theme);
			expect(result.text).toContain(theme.peach);
		});

		test("should use red for cost over $5", () => {
			const result = renderCost(mockInput({ total_cost_usd: 7.5 }), {}, theme);
			expect(result.text).toContain(theme.red);
		});
	});

	describe("burn rate", () => {
		test("should show burn rate when enabled and session is over 1 minute", () => {
			const result = renderCost(
				mockInput({ total_cost_usd: 2.0, total_duration_ms: 3600000 }),
				{ showBurnRate: true },
				theme,
			);
			expect(result.text).toContain("/hr");
			expect(result.text).toContain("$2.00/hr");
		});

		test("should not show burn rate when session is under 1 minute", () => {
			const result = renderCost(
				mockInput({ total_cost_usd: 2.0, total_duration_ms: 30000 }),
				{ showBurnRate: true },
				theme,
			);
			expect(result.text).not.toContain("/hr");
		});

		test("should not show burn rate when disabled", () => {
			const result = renderCost(
				mockInput({ total_cost_usd: 2.0, total_duration_ms: 3600000 }),
				{ showBurnRate: false },
				theme,
			);
			expect(result.text).not.toContain("/hr");
		});
	});

	describe("projection", () => {
		test("should show projection when enabled and session is over 1 minute", () => {
			const result = renderCost(
				mockInput({ total_cost_usd: 1.0, total_duration_ms: 3600000 }),
				{ showProjection: true },
				theme,
			);
			expect(result.text).toContain("→");
			expect(result.text).toContain("$2.00");
		});

		test("should not show projection when session is under 1 minute", () => {
			const result = renderCost(
				mockInput({ total_cost_usd: 1.0, total_duration_ms: 30000 }),
				{ showProjection: true },
				theme,
			);
			expect(result.text).not.toContain("→");
		});
	});
});
