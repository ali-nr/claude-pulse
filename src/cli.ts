#!/usr/bin/env node

import packageJson from "../package.json";
import {
	renderBranch,
	renderCache,
	renderContext,
	renderCost,
	renderCwd,
	renderHooks,
	renderLinesChanged,
	renderMcp,
	renderModel,
	renderName,
	renderOutputStyle,
	renderSession,
	renderSkills,
	renderStatus,
	renderSystem,
	renderTier,
	renderTime,
} from "./components";
import { getLines, loadConfig } from "./config";
import { type ClaudeStatusInput, type ComponentOutput, parseClaudeInput } from "./schema";
import { catppuccin } from "./themes/catppuccin";

const VERSION = packageJson.version ?? "1.0.0";

async function main() {
	// Check for CLI commands
	const args = process.argv.slice(2);
	if (args.includes("--version") || args.includes("-v")) {
		console.log(`cc-pulse v${VERSION}`);
		process.exit(0);
	}
	if (args.includes("--help") || args.includes("-h")) {
		console.log(`cc-pulse - A customizable, real-time statusline for Claude Code

Usage:
  cc-pulse              Read JSON from stdin and output statusline
  cc-pulse --version    Show version
  cc-pulse --help       Show this help

Configuration:
  ~/.config/claude-pulse/config.json
  ~/.claude-pulse.json
`);
		process.exit(0);
	}

	// Read JSON from stdin and validate with Zod
	let input: ClaudeStatusInput;
	try {
		const stdin = await readStdin();
		const parsed = parseClaudeInput(stdin);
		if (!parsed) {
			console.log("");
			process.exit(0);
		}
		input = parsed;
	} catch {
		// If no input or invalid JSON, output empty line
		console.log("");
		process.exit(0);
	}

	const config = loadConfig();
	const theme = catppuccin;

	// Render fixed line layout with user overrides
	const lines = getLines(config);
	const outputLines: string[] = [];

	for (const line of lines) {
		if (!line.enabled) continue;

		const parts: string[] = [];
		const separator = ` ${theme.overlay2}│${theme.reset} `;
		const sep = line.separator ?? separator;

		for (const componentName of line.components) {
			const output = renderComponent(componentName, input, config, theme);
			if (output.text) {
				parts.push(output.text);
			}
		}

		if (parts.length > 0) {
			outputLines.push(parts.join(sep));
		}
	}

	// Output all lines (Claude Code only uses first line, but we support multi-line)
	console.log(outputLines.join("\n"));
}

function renderComponent(
	name: string,
	input: ClaudeStatusInput,
	config: ReturnType<typeof loadConfig>,
	theme: typeof catppuccin,
): ComponentOutput {
	switch (name) {
		case "tier":
			return renderTier(config.components.tier ?? {}, theme);
		case "model":
			return renderModel(input, config.components.model ?? {}, theme);
		case "context":
			return renderContext(input, config.components.context ?? {}, theme);
		case "cost":
			return renderCost(input, config.components.cost ?? {}, theme);
		case "mcp":
			return renderMcp(config.components.mcp ?? {}, theme);
		case "cwd":
			return renderCwd(input, config.components.cwd ?? {}, theme);
		case "name":
			return renderName(input, { custom: "pulse" }, theme);
		case "time":
			return renderTime(config.components.time ?? {}, theme);
		case "system":
			return renderSystem(input, config.components.system ?? {}, theme);
		case "session":
			return renderSession(input, config.components.session ?? {}, theme);
		case "outputStyle":
			return renderOutputStyle(input, config.components.outputStyle ?? {}, theme);
		case "branch":
			return renderBranch(config.components.branch ?? {}, theme);
		case "status":
			return renderStatus(config.components.status ?? {}, theme);
		case "linesChanged":
			return renderLinesChanged(input, config.components.linesChanged ?? {}, theme);
		case "hooks":
			return renderHooks(config.components.hooks ?? {}, theme);
		case "cache":
			return renderCache(input, config.components.cache ?? {}, theme);
		case "skills":
			return renderSkills(config.components.skills ?? {}, theme);
		default:
			return { text: "" };
	}
}

async function readStdin(): Promise<string> {
	const chunks: Buffer[] = [];

	return new Promise((resolve, reject) => {
		process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
		process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
		process.stdin.on("error", reject);

		// Timeout after 100ms if no input
		setTimeout(() => {
			if (chunks.length === 0) {
				reject(new Error("No input"));
			}
		}, 100);
	});
}

main().catch(() => {
	console.log("");
	process.exit(0);
});
