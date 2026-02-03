/**
 * Unit tests for schema parsing
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import { parseClaudeInput } from "./schema";

const validInput = JSON.stringify({
	hook_event_name: "Status",
	session_id: "abc-123",
	transcript_path: "/tmp/transcript",
	cwd: "/Users/test/project",
	model: { id: "claude-opus-4-5-20251101", display_name: "Claude 4 Opus" },
	workspace: { current_dir: "/Users/test/project", project_dir: "/Users/test/project" },
	version: "2.1.29",
	output_style: { name: "default" },
	cost: {
		total_cost_usd: 0.5,
		total_duration_ms: 60000,
		total_api_duration_ms: 5000,
		total_lines_added: 10,
		total_lines_removed: 3,
	},
	context_window: {
		total_input_tokens: 5000,
		total_output_tokens: 2000,
		context_window_size: 200000,
		used_percentage: 3.5,
		remaining_percentage: 96.5,
		current_usage: {
			input_tokens: 5000,
			output_tokens: 2000,
			cache_creation_input_tokens: 1000,
			cache_read_input_tokens: 3000,
		},
	},
});

describe("parseClaudeInput", () => {
	describe("success cases", () => {
		test("should parse valid JSON input", () => {
			const result = parseClaudeInput(validInput);
			expect(result).not.toBeNull();
			expect(result?.model.display_name).toBe("Claude 4 Opus");
		});

		test("should preserve all fields from valid input", () => {
			const result = parseClaudeInput(validInput);
			expect(result?.cost.total_cost_usd).toBe(0.5);
			expect(result?.context_window.used_percentage).toBe(3.5);
			expect(result?.session_id).toBe("abc-123");
		});

		test("should handle extra unknown fields", () => {
			const inputWithExtras = JSON.stringify({
				...JSON.parse(validInput),
				some_future_field: "value",
			});
			const result = parseClaudeInput(inputWithExtras);
			expect(result).not.toBeNull();
		});
	});

	describe("error handling", () => {
		test("should return null for invalid JSON", () => {
			const result = parseClaudeInput("not json");
			expect(result).toBeNull();
		});

		test("should return null for empty string", () => {
			const result = parseClaudeInput("");
			expect(result).toBeNull();
		});
	});
});
