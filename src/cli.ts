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
	renderTime,
} from "./components";
import { getLines, loadConfig } from "./config";
import { type ClaudeStatusInput, type ComponentOutput, parseClaudeInput } from "./schema";
import { catppuccin } from "./themes/catppuccin";
import { getTerminalWidth, wrapParts } from "./truncate";

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
	const termWidth = getTerminalWidth();

	// Compact mode: counts only, no names/details
	if (config.compact) {
		if (config.components.skills) {
			config.components.skills.showNames = false;
		}
		if (config.components.hooks) {
			config.components.hooks.showNames = false;
			config.components.hooks.showCount = false;
		}
		if (config.components.mcp) {
			config.components.mcp.showNames = false;
		}
		if (config.components.context) {
			config.components.context.showTokens = false;
			config.components.context.showRate = false;
		}
		if (config.components.cost) {
			config.components.cost.showBurnRate = false;
			config.components.cost.showProjection = false;
		}
		if (config.components.cwd) {
			config.components.cwd.maxLength = 15;
		}
	}
	const outputLines: string[] = [];

	for (const line of lines) {
		if (!line.enabled) continue;

		const separator = ` ${theme.overlay2}│${theme.reset} `;
		const sep = line.separator ?? separator;

		// Collect component outputs
		const outputs: ComponentOutput[] = [];
		for (const componentName of line.components) {
			const output = renderComponent(componentName, input, config, theme);
			if (output.text) {
				outputs.push(output);
			}
		}

		if (outputs.length === 0) continue;

		// For lines with a single component that has header+items, wrap items
		if (outputs.length === 1 && outputs[0].header && outputs[0].items?.length) {
			const { header, items } = outputs[0];
			const rendered = wrapParts([header, ...items], " ", termWidth);
			outputLines.push(rendered);
		} else {
			// Standard: wrap at component boundaries
			const parts = outputs.map((o) => o.text);
			outputLines.push(wrapParts(parts, sep, termWidth));
		}
	}

	if (config.dividers) {
		const divider = `${theme.overlay0}${"─".repeat(termWidth)}${theme.reset}`;
		console.log(outputLines.join(`\n${divider}\n`) + `\n${divider}`);
	} else {
		console.log(outputLines.join("\n"));
	}
}

function renderComponent(
	name: string,
	input: ClaudeStatusInput,
	config: ReturnType<typeof loadConfig>,
	theme: typeof catppuccin,
): ComponentOutput {
	switch (name) {
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
