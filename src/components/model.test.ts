/**
 * Unit tests for renderModel component
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import type { ClaudeStatusInput } from "../schema";
import { catppuccin as theme } from "../themes/catppuccin";
import { parseModelId, renderModel } from "./model";

const mockInput = (
	modelId = "claude-opus-4-5-20251101",
	displayName = "Claude 4 Opus",
): ClaudeStatusInput =>
	({
		model: { id: modelId, display_name: displayName },
	}) as ClaudeStatusInput;

describe("parseModelId", () => {
	test("should parse new format with minor version", () => {
		const result = parseModelId("claude-opus-4-5-20251101");
		expect(result).toEqual({ family: "opus", version: "4.5" });
	});

	test("should parse new format without minor version", () => {
		const result = parseModelId("claude-sonnet-4-20250514");
		expect(result).toEqual({ family: "sonnet", version: "4" });
	});

	test("should parse old format with minor version", () => {
		const result = parseModelId("claude-3-5-sonnet-20241022");
		expect(result).toEqual({ family: "sonnet", version: "3.5" });
	});

	test("should parse old format without minor version", () => {
		const result = parseModelId("claude-3-haiku-20240307");
		expect(result).toEqual({ family: "haiku", version: "3" });
	});

	test("should return null for unknown format", () => {
		const result = parseModelId("some-unknown-model");
		expect(result).toBeNull();
	});
});

describe("renderModel", () => {
	describe("initialization", () => {
		test("should return empty text when disabled", () => {
			const result = renderModel(mockInput(), { enabled: false }, theme);
			expect(result.text).toBe("");
		});
	});

	describe("model detection", () => {
		test("should detect Opus model with version", () => {
			const result = renderModel(mockInput("claude-opus-4-5-20251101", "Claude 4 Opus"), {}, theme);
			expect(result.text).toContain("Opus 4.5");
			expect(result.text).toContain(theme.mauve);
		});

		test("should detect Sonnet model with version", () => {
			const result = renderModel(
				mockInput("claude-3-5-sonnet-20241022", "Claude 3.5 Sonnet"),
				{},
				theme,
			);
			expect(result.text).toContain("Sonnet 3.5");
			expect(result.text).toContain(theme.blue);
		});

		test("should detect Haiku model with version", () => {
			const result = renderModel(mockInput("claude-3-haiku-20240307", "Claude 3 Haiku"), {}, theme);
			expect(result.text).toContain("Haiku 3");
			expect(result.text).toContain(theme.green);
		});

		test("should fallback to display name for unknown model", () => {
			const result = renderModel(mockInput("some-unknown-model", "Some New Model"), {}, theme);
			expect(result.text).toContain("Some New Model");
		});
	});

	describe("icon display", () => {
		test("should show icon by default", () => {
			const result = renderModel(mockInput("claude-opus-4-5-20251101", "Claude 4 Opus"), {}, theme);
			expect(result.text).toContain("🧠");
		});

		test("should show sonnet icon", () => {
			const result = renderModel(
				mockInput("claude-3-5-sonnet-20241022", "Claude 3.5 Sonnet"),
				{},
				theme,
			);
			expect(result.text).toContain("🎵");
		});

		test("should show haiku icon", () => {
			const result = renderModel(mockInput("claude-3-haiku-20240307", "Claude 3 Haiku"), {}, theme);
			expect(result.text).toContain("⚡");
		});

		test("should use custom icons", () => {
			const result = renderModel(
				mockInput("claude-opus-4-5-20251101", "Claude 4 Opus"),
				{ icons: { opus: "💎", sonnet: "🎶", haiku: "🌸" } },
				theme,
			);
			expect(result.text).toContain("💎");
		});
	});

	describe("label", () => {
		test("should use custom label", () => {
			const result = renderModel(
				mockInput("claude-opus-4-5-20251101", "Claude 4 Opus"),
				{ label: "MyModel" },
				theme,
			);
			expect(result.text).toContain("MyModel");
			expect(result.text).not.toContain("Opus");
		});
	});
});
