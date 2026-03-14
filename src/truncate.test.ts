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
});
