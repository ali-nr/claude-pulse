import { describe, expect, test } from "bun:test";
import { visibleLength, wrapParts } from "./truncate";

describe("visibleLength", () => {
	test("should return length of plain string", () => {
		expect(visibleLength("hello")).toBe(5);
	});

	test("should ignore ANSI color codes", () => {
		// \x1b[31m = red, \x1b[0m = reset
		expect(visibleLength("\x1b[31mhello\x1b[0m")).toBe(5);
	});

	test("should handle multiple ANSI sequences", () => {
		expect(visibleLength("\x1b[1m\x1b[31mBOLD RED\x1b[0m")).toBe(8);
	});

	test("should return 0 for empty string", () => {
		expect(visibleLength("")).toBe(0);
	});

	test("should return 0 for ANSI-only string", () => {
		expect(visibleLength("\x1b[31m\x1b[0m")).toBe(0);
	});
});

describe("wrapParts", () => {
	test("should join parts when they fit on one line", () => {
		const result = wrapParts(["aaa", "bbb", "ccc"], " | ", 80);
		expect(result).toBe("aaa | bbb | ccc");
	});

	test("should return empty string for no parts", () => {
		expect(wrapParts([], " | ", 80)).toBe("");
	});

	test("should return single part as-is", () => {
		expect(wrapParts(["hello"], " | ", 80)).toBe("hello");
	});

	test("should wrap to next line when parts exceed width", () => {
		// "aaaaaaa | bbbbbbb" = 17 chars, max is 15
		const result = wrapParts(["aaaaaaa", "bbbbbbb"], " | ", 15);
		expect(result).toBe("aaaaaaa\n  bbbbbbb");
	});

	test("should indent continuation lines", () => {
		const result = wrapParts(["aaa", "bbb", "ccc"], " | ", 12);
		// "aaa | bbb" = 9, fits
		// "aaa | bbb | ccc" = 19, doesn't fit at 12
		// So: "aaa | bbb" then "  ccc"
		expect(result).toBe("aaa | bbb\n  ccc");
	});

	test("should handle ANSI codes when measuring width", () => {
		const red = "\x1b[31m";
		const reset = "\x1b[0m";
		// Visible: "aaa | bbb" = 9 chars, but raw string is much longer
		const result = wrapParts([`${red}aaa${reset}`, `${red}bbb${reset}`], " | ", 80);
		expect(result).toContain("aaa");
		expect(result).toContain("bbb");
		expect(result).not.toContain("\n"); // Should fit on one line
	});

	test("should wrap ANSI-colored parts based on visible width", () => {
		const red = "\x1b[31m";
		const reset = "\x1b[0m";
		// Each part: visible 7 chars. Sep: 3 chars. Total: 17, max 15
		const result = wrapParts([`${red}aaaaaaa${reset}`, `${red}bbbbbbb${reset}`], " | ", 15);
		expect(result).toContain("\n");
	});

	test("should use custom indent", () => {
		const result = wrapParts(["aaaaaaa", "bbbbbbb"], " | ", 15, 4);
		expect(result).toBe("aaaaaaa\n    bbbbbbb");
	});

	test("should handle multiple wraps", () => {
		const result = wrapParts(["aaa", "bbb", "ccc", "ddd"], " | ", 12);
		const lines = result.split("\n");
		expect(lines.length).toBeGreaterThan(1);
		// Continuation lines should be indented
		for (let i = 1; i < lines.length; i++) {
			expect(lines[i].startsWith("  ")).toBe(true);
		}
	});

	test("should wrap after maxPerLine parts even if width allows more", () => {
		// All parts fit on one line at width 80, but maxPerLine=4 forces a wrap
		const result = wrapParts(["hdr", "a", "b", "c", "d", "e", "f"], " ", 80, 2, 4);
		const lines = result.split("\n");
		expect(lines).toEqual(["hdr a b c", "  d e f"]);
	});

	test("should not wrap when maxPerLine is 0 (disabled)", () => {
		const result = wrapParts(["hdr", "a", "b", "c", "d", "e"], " ", 80, 2, 0);
		expect(result).toBe("hdr a b c d e");
	});

	describe("hooks/skills wrapping (maxPerLine=4)", () => {
		// Simulates cli.ts: wrapParts([header, ...items], " ", termWidth, 2, 4)
		// header counts as part 1, so 3 items fit on the first line

		test("should show header + 3 items on first line", () => {
			const header = "⚡Hooks 8";
			const items = ["Pre:2", "Post:1", "Start:1", "Submit:2", "Stop:1", "End:1"];
			const result = wrapParts([header, ...items], " ", 200, 2, 4);
			const lines = result.split("\n");
			expect(lines[0]).toBe("⚡Hooks 8 Pre:2 Post:1 Start:1");
			expect(lines[1]).toBe("  Submit:2 Stop:1 End:1");
		});

		test("should not wrap when 3 or fewer items", () => {
			const header = "⚡Hooks 3";
			const items = ["Pre:1", "Post:1", "Start:1"];
			const result = wrapParts([header, ...items], " ", 200, 2, 4);
			expect(result).not.toContain("\n");
		});

		test("should wrap skills groups across lines", () => {
			const header = "✦ Skills 42";
			const items = ["bmad:30", "agent-vibes:8", "beads", "tmux", "mermaid", "commit", "pr"];
			const result = wrapParts([header, ...items], " ", 200, 2, 4);
			const lines = result.split("\n");
			expect(lines).toHaveLength(2);
			expect(lines[0]).toBe("✦ Skills 42 bmad:30 agent-vibes:8 beads");
			expect(lines[1]).toBe("  tmux mermaid commit pr");
		});
	});
});
