/**
 * Unit tests for renderCwd component
 */

import { describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import type { ClaudeStatusInput } from "../schema";
import { catppuccin as theme } from "../themes/catppuccin";
import { renderCwd } from "./cwd";

const home = homedir();

const mockInput = (cwd: string): ClaudeStatusInput =>
	({
		workspace: { current_dir: cwd, project_dir: cwd },
		cwd,
	}) as ClaudeStatusInput;

describe("renderCwd", () => {
	test("should return empty text when disabled", () => {
		const result = renderCwd(mockInput("/some/path"), { enabled: false }, theme);
		expect(result.text).toBe("");
	});

	test("should return empty text when no cwd", () => {
		const result = renderCwd({ workspace: {} } as ClaudeStatusInput, {}, theme);
		expect(result.text).toBe("");
	});

	describe("style: short (default)", () => {
		test("should replace home with tilde", () => {
			const result = renderCwd(mockInput(`${home}/dev/project`), {}, theme);
			expect(result.text).toContain("~/dev/project");
		});

		test("should truncate long paths with ellipsis", () => {
			const result = renderCwd(
				mockInput(`${home}/.worktree/my-mind-is-racing/2026-02-13/fix-1612`),
				{ maxLength: 30 },
				theme,
			);
			expect(result.text).toContain("…");
			expect(result.text).toContain("fix-1612");
		});

		test("should not truncate short paths", () => {
			const result = renderCwd(mockInput(`${home}/dev/pulse`), { maxLength: 30 }, theme);
			expect(result.text).toContain("~/dev/pulse");
			expect(result.text).not.toContain("…");
		});

		test("should respect custom maxLength", () => {
			const result = renderCwd(
				mockInput(`${home}/dev/some/deeply/nested/project`),
				{ maxLength: 60 },
				theme,
			);
			expect(result.text).not.toContain("…");
		});
	});

	describe("style: full", () => {
		test("should show full path without truncation", () => {
			const fullPath = `${home}/.worktree/my-mind-is-racing/2026-02-13/fix-1612`;
			const result = renderCwd(mockInput(fullPath), { style: "full" }, theme);
			expect(result.text).toContain(fullPath);
		});
	});

	describe("style: basename", () => {
		test("should show only directory name", () => {
			const result = renderCwd(
				mockInput(`${home}/.worktree/my-mind-is-racing/2026-02-13/fix-1612`),
				{ style: "basename" },
				theme,
			);
			expect(result.text).toContain("fix-1612");
			expect(result.text).not.toContain("worktree");
		});
	});

	describe("style: project", () => {
		test("should show project folder name", () => {
			const result = renderCwd(mockInput("/home/user/dev/my-project"), { style: "project" }, theme);
			expect(result.text).toContain("my-project");
		});
	});

	describe("icon", () => {
		test("should show icon by default", () => {
			const result = renderCwd(mockInput(`${home}/dev`), {}, theme);
			expect(result.text).toContain("▶");
		});

		test("should hide icon when showIcon is false", () => {
			const result = renderCwd(mockInput(`${home}/dev`), { showIcon: false }, theme);
			expect(result.text).not.toContain("▶");
		});
	});
});
