/**
 * Unit tests for renderSkills component
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import { catppuccin as theme } from "../themes/catppuccin";
import { parseFrontmatter, renderSkills } from "./skills";

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

		test("should include emoji icon", () => {
			const result = renderSkills({}, theme);
			expect(result.text).toContain("🎯");
		});
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
