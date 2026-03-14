/**
 * Unit tests for renderSkills component
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import { catppuccin as theme } from "../themes/catppuccin";
import { groupByPrefix, parseFrontmatter, renderSkills } from "./skills";

describe("renderSkills", () => {
	describe("initialization", () => {
		test("should return empty text when disabled", () => {
			const result = renderSkills({ enabled: false }, theme);
			expect(result.text).toBe("");
		});

		test("should render with default config", () => {
			// This will scan actual filesystem, but should not fail
			const result = renderSkills({}, theme);
			expect(result.text).toContain("Skills");
		});
	});

	describe("display options", () => {
		test("should use custom label", () => {
			const result = renderSkills({ label: "Commands" }, theme);
			expect(result.text).toContain("Commands");
		});

		test("should include star icon", () => {
			const result = renderSkills({}, theme);
			expect(result.text).toContain("✦");
		});
	});
});

describe("groupByPrefix", () => {
	test("should group names sharing a prefix when count >= minCount", () => {
		const names = ["bmad-dev", "bmad-pm", "bmad-qa", "beads", "tmux"];
		const result = groupByPrefix(names, 3);
		expect(result.groups).toEqual({ bmad: ["bmad-dev", "bmad-pm", "bmad-qa"] });
		expect(result.ungrouped).toEqual(["beads", "tmux"]);
	});

	test("should not group when below minCount", () => {
		const names = ["bmad-dev", "bmad-pm", "beads", "tmux"];
		const result = groupByPrefix(names, 3);
		expect(result.groups).toEqual({});
		expect(result.ungrouped.sort()).toEqual(["beads", "bmad-dev", "bmad-pm", "tmux"]);
	});

	test("should handle colon-separated prefixes", () => {
		const names = ["agent-vibes:mute", "agent-vibes:unmute", "agent-vibes:set", "beads"];
		const result = groupByPrefix(names, 3);
		expect(result.groups["agent-vibes"]).toHaveLength(3);
		expect(result.ungrouped).toEqual(["beads"]);
	});

	test("should return all ungrouped for unique names", () => {
		const names = ["beads", "tmux", "mermaid"];
		const result = groupByPrefix(names, 2);
		expect(result.groups).toEqual({});
		expect(result.ungrouped).toEqual(["beads", "tmux", "mermaid"]);
	});

	test("should handle empty input", () => {
		const result = groupByPrefix([], 3);
		expect(result.groups).toEqual({});
		expect(result.ungrouped).toEqual([]);
	});
});

describe("parseFrontmatter", () => {
	describe("valid frontmatter", () => {
		test("should parse simple frontmatter", () => {
			const content = `---
name: test-skill
description: A test skill
---

# Content here`;

			const result = parseFrontmatter(content);
			expect(result).not.toBeNull();
			expect(result?.name).toBe("test-skill");
			expect(result?.description).toBe("A test skill");
		});

		test("should parse frontmatter with quoted values", () => {
			const content = `---
name: "quoted-skill"
description: 'Single quoted'
version: "1.0"
---`;

			const result = parseFrontmatter(content);
			expect(result).not.toBeNull();
			expect(result?.name).toBe("quoted-skill");
			expect(result?.version).toBe("1.0");
		});
	});

	describe("invalid frontmatter", () => {
		test("should return null when no opening delimiter", () => {
			const content = `name: test
description: no delimiters`;

			const result = parseFrontmatter(content);
			expect(result).toBeNull();
		});

		test("should return null when no closing delimiter", () => {
			const content = `---
name: test
description: no closing`;

			const result = parseFrontmatter(content);
			expect(result).toBeNull();
		});

		test("should return empty object for empty frontmatter", () => {
			const content = `---
---
# Just content`;

			const result = parseFrontmatter(content);
			expect(result).not.toBeNull();
			expect(Object.keys(result ?? {}).length).toBe(0);
		});
	});
});
