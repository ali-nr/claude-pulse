/**
 * Unit tests for MCP output parsing
 * Following conventions from .claude/conventions/unit-test-rules.md
 */

import { describe, expect, test } from "bun:test";
import { parseMcpOutput } from "./mcp";

describe("parseMcpOutput", () => {
	describe("current format", () => {
		test("should parse connected server", () => {
			const output = "context7: npx -y @upstash/context7-mcp - ✓ Connected";
			const servers = parseMcpOutput(output);
			expect(servers).toHaveLength(1);
			expect(servers[0].name).toBe("context7");
			expect(servers[0].status).toBe("connected");
		});

		test("should parse disconnected server", () => {
			const output = "myserver: node server.js - ✗ Disconnected";
			const servers = parseMcpOutput(output);
			expect(servers).toHaveLength(1);
			expect(servers[0].name).toBe("myserver");
			expect(servers[0].status).toBe("disconnected");
		});

		test("should parse disabled server", () => {
			const output = "chrome: npx chrome-mcp - ○ Disabled";
			const servers = parseMcpOutput(output);
			expect(servers).toHaveLength(1);
			expect(servers[0].name).toBe("chrome");
			expect(servers[0].status).toBe("disabled");
		});

		test("should parse failed to connect as error", () => {
			const output = "broken: node bad.js - ✗ Failed to connect";
			const servers = parseMcpOutput(output);
			expect(servers).toHaveLength(1);
			expect(servers[0].name).toBe("broken");
			expect(servers[0].status).toBe("error");
		});

		test("should parse multiple servers", () => {
			const output = [
				"context7: npx -y @upstash/context7-mcp - ✓ Connected",
				"deepwiki: npx deepwiki - ✓ Connected",
				"broken: node bad.js - ✗ Failed to connect",
			].join("\n");
			const servers = parseMcpOutput(output);
			expect(servers).toHaveLength(3);
			expect(servers[0].status).toBe("connected");
			expect(servers[1].status).toBe("connected");
			expect(servers[2].status).toBe("error");
		});
	});

	describe("legacy format", () => {
		test("should parse legacy connected format", () => {
			const output = "✓ Connected: context7 (stdio)";
			const servers = parseMcpOutput(output);
			expect(servers).toHaveLength(1);
			expect(servers[0].name).toBe("context7");
			expect(servers[0].status).toBe("connected");
		});

		test("should parse legacy disconnected format", () => {
			const output = "✗ Disconnected: myserver (stdio)";
			const servers = parseMcpOutput(output);
			expect(servers).toHaveLength(1);
			expect(servers[0].name).toBe("myserver");
			expect(servers[0].status).toBe("disconnected");
		});
	});

	describe("edge cases", () => {
		test("should return empty array for empty output", () => {
			const servers = parseMcpOutput("");
			expect(servers).toHaveLength(0);
		});

		test("should return empty array for unrecognized output", () => {
			const servers = parseMcpOutput("some random text\nthat is not mcp output");
			expect(servers).toHaveLength(0);
		});

		test("should handle alternate check mark character", () => {
			const output = "context7: npx mcp - ✔ Connected";
			const servers = parseMcpOutput(output);
			expect(servers).toHaveLength(1);
			expect(servers[0].status).toBe("connected");
		});
	});
});
