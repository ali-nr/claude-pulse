/**
 * Unit tests for renderModel component
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import type { ClaudeStatusInput } from "../schema";
import { catppuccin as theme } from "../themes/catppuccin";
import { renderModel } from "./model";

const mockInput = (displayName = "Claude 4 Opus"): ClaudeStatusInput =>
	({
		model: { id: "claude-opus-4-5-20251101", display_name: displayName },
	}) as ClaudeStatusInput;

describe("renderModel", () => {
	describe("initialization", () => {
		test("should return empty text when disabled", () => {
			const result = renderModel(mockInput(), { enabled: false }, theme);
			expect(result.text).toBe("");
		});
	});

	describe("model detection", () => {
		test("should detect Opus model", () => {
			const result = renderModel(mockInput("Claude 4 Opus"), {}, theme);
			expect(result.text).toContain("Opus");
			expect(result.text).toContain(theme.mauve);
		});

		test("should detect Sonnet model", () => {
			const result = renderModel(mockInput("Claude 3.5 Sonnet"), {}, theme);
			expect(result.text).toContain("Sonnet");
			expect(result.text).toContain(theme.blue);
		});

		test("should detect Haiku model", () => {
			const result = renderModel(mockInput("Claude 3.5 Haiku"), {}, theme);
			expect(result.text).toContain("Haiku");
			expect(result.text).toContain(theme.green);
		});

		test("should handle unknown model name", () => {
			const result = renderModel(mockInput("Some New Model"), {}, theme);
			expect(result.text).toContain("Some New Model");
		});
	});

	describe("icon display", () => {
		test("should show icon by default", () => {
			const result = renderModel(mockInput("Claude 4 Opus"), {}, theme);
			expect(result.text).toContain("🧠");
		});

		test("should show sonnet icon", () => {
			const result = renderModel(mockInput("Claude 3.5 Sonnet"), {}, theme);
			expect(result.text).toContain("🎵");
		});

		test("should show haiku icon", () => {
			const result = renderModel(mockInput("Claude 3.5 Haiku"), {}, theme);
			expect(result.text).toContain("⚡");
		});

		test("should use custom icons", () => {
			const result = renderModel(
				mockInput("Claude 4 Opus"),
				{ icons: { opus: "💎", sonnet: "🎶", haiku: "🌸" } },
				theme,
			);
			expect(result.text).toContain("💎");
		});
	});

	describe("label", () => {
		test("should use custom label", () => {
			const result = renderModel(mockInput("Claude 4 Opus"), { label: "MyModel" }, theme);
			expect(result.text).toContain("MyModel");
			expect(result.text).not.toContain("Opus");
		});
	});
});
