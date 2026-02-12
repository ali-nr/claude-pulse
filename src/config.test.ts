/**
 * Unit tests for config loading and merging
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import { DEFAULT_CONFIG, getLines } from "./config";
import type { PulseConfig } from "./schema";

describe("DEFAULT_CONFIG", () => {
	test("should have all required component configs", () => {
		expect(DEFAULT_CONFIG.components.model).toBeDefined();
		expect(DEFAULT_CONFIG.components.context).toBeDefined();
		expect(DEFAULT_CONFIG.components.cost).toBeDefined();
		expect(DEFAULT_CONFIG.components.mcp).toBeDefined();
		expect(DEFAULT_CONFIG.components.branch).toBeDefined();
		expect(DEFAULT_CONFIG.components.status).toBeDefined();
		expect(DEFAULT_CONFIG.components.hooks).toBeDefined();
		expect(DEFAULT_CONFIG.components.cache).toBeDefined();
	});

	test("should have catppuccin as default theme", () => {
		expect(DEFAULT_CONFIG.theme).toBe("catppuccin");
	});

	test("should have tier enabled by default", () => {
		expect(DEFAULT_CONFIG.components.tier?.enabled).toBe(true);
	});

	test("should have model enabled by default", () => {
		expect(DEFAULT_CONFIG.components.model?.enabled).toBe(true);
	});
});

describe("getLines", () => {
	describe("default behavior", () => {
		test("should return 6 lines", () => {
			const lines = getLines(DEFAULT_CONFIG);
			expect(lines).toHaveLength(6);
		});

		test("should have identity as first line", () => {
			const lines = getLines(DEFAULT_CONFIG);
			expect(lines[0].name).toBe("identity");
			expect(lines[0].components).toContain("name");
			expect(lines[0].components).toContain("cwd");
		});

		test("should have git as second line", () => {
			const lines = getLines(DEFAULT_CONFIG);
			expect(lines[1].name).toBe("git");
			expect(lines[1].components).toContain("branch");
			expect(lines[1].components).toContain("status");
		});

		test("should have engine as third line", () => {
			const lines = getLines(DEFAULT_CONFIG);
			expect(lines[2].name).toBe("engine");
			expect(lines[2].components).toContain("model");
			expect(lines[2].components).toContain("context");
			expect(lines[2].components).toContain("cost");
		});

		test("should have all lines enabled by default", () => {
			const lines = getLines(DEFAULT_CONFIG);
			for (const line of lines) {
				expect(line.enabled).toBe(true);
			}
		});
	});

	describe("user overrides", () => {
		test("should disable a line when user sets enabled to false", () => {
			const config: PulseConfig = {
				...DEFAULT_CONFIG,
				lines: { hooks: { enabled: false } },
			};
			const lines = getLines(config);
			const hooksLine = lines.find((l) => l.name === "hooks");
			expect(hooksLine?.enabled).toBe(false);
		});

		test("should override separator", () => {
			const config: PulseConfig = {
				...DEFAULT_CONFIG,
				lines: { engine: { separator: " | " } },
			};
			const lines = getLines(config);
			const engineLine = lines.find((l) => l.name === "engine");
			expect(engineLine?.separator).toBe(" | ");
		});

		test("should never allow identity line to be overridden", () => {
			const config: PulseConfig = {
				...DEFAULT_CONFIG,
				lines: {},
			};
			const lines = getLines(config);
			const identityLine = lines.find((l) => l.name === "identity");
			expect(identityLine?.enabled).toBe(true);
			expect(identityLine?.components).toEqual(["name", "cwd"]);
		});

		test("should preserve line order regardless of overrides", () => {
			const config: PulseConfig = {
				...DEFAULT_CONFIG,
				lines: {
					hooks: { enabled: false },
					git: { separator: " - " },
				},
			};
			const lines = getLines(config);
			expect(lines[0].name).toBe("identity");
			expect(lines[1].name).toBe("git");
			expect(lines[2].name).toBe("engine");
			expect(lines[3].name).toBe("mcp");
			expect(lines[4].name).toBe("hooks");
		});
	});
});
