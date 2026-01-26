#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const CLAUDE_SETTINGS_PATH = join(homedir(), ".claude", "settings.json");
const CONFIG_DIR = join(homedir(), ".config", "claude-pulse");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG = {
	theme: "catppuccin",
	lines: [
		{
			enabled: true,
			components: ["tier", "model", "context", "cost"],
			separator: " │ ",
		},
		{
			enabled: true,
			components: ["mcp"],
			separator: " ",
		},
		{
			enabled: true,
			components: ["outputStyle", "branch", "status"],
			separator: " │ ",
		},
	],
	components: {
		context: {
			style: "bar",
			showRate: true,
			showCompactHint: true,
		},
		cost: {
			showBurnRate: true,
		},
		mcp: {
			showNames: true,
			maxDisplay: 4,
		},
	},
};

async function main() {
	console.log("🚀 Setting up claude-pulse...\n");

	// Create config directory if it doesn't exist
	if (!existsSync(CONFIG_DIR)) {
		mkdirSync(CONFIG_DIR, { recursive: true });
		console.log(`✓ Created config directory: ${CONFIG_DIR}`);
	}

	// Create default config if it doesn't exist
	if (!existsSync(CONFIG_PATH)) {
		writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
		console.log(`✓ Created default config: ${CONFIG_PATH}`);
	} else {
		console.log(`  Config already exists: ${CONFIG_PATH}`);
	}

	// Update Claude Code settings
	try {
		const settingsDir = dirname(CLAUDE_SETTINGS_PATH);
		if (!existsSync(settingsDir)) {
			mkdirSync(settingsDir, { recursive: true });
		}

		let settings: Record<string, unknown> = {};
		if (existsSync(CLAUDE_SETTINGS_PATH)) {
			const content = readFileSync(CLAUDE_SETTINGS_PATH, "utf-8");
			settings = JSON.parse(content) as Record<string, unknown>;
		}

		// Find the path to the current CLI
		const cliPath = process.argv[1];
		const bunPath = process.argv[0];

		// Use bun to run the CLI for development
		const command = cliPath.endsWith(".ts")
			? `${bunPath} ${cliPath.replace("/setup.ts", "/cli.ts")}`
			: "claude-pulse";

		settings.statusLine = {
			type: "command",
			command,
		};

		writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));
		console.log(`✓ Updated Claude Code settings: ${CLAUDE_SETTINGS_PATH}`);
		console.log(`  statusLine.command = "${command}"`);
	} catch (error) {
		console.error(`✗ Failed to update Claude Code settings: ${error}`);
	}

	console.log("\n✅ Setup complete! Restart Claude Code to see your new statusline.");
}

main().catch(console.error);
