import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PulseConfig } from "./schema";

const CONFIG_PATHS = [
	join(homedir(), ".config", "claude-pulse", "config.json"),
	join(homedir(), ".claude-pulse.json"),
];

const DEFAULT_CONFIG: PulseConfig = {
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
			components: ["cwd", "branch", "status"],
			separator: " │ ",
		},
	],
	components: {
		tier: {
			enabled: true,
			labels: { pro: "PRO", max: "MAX", api: "API" },
		},
		model: {
			enabled: true,
			icons: { opus: "🧠", sonnet: "🎵", haiku: "⚡" },
		},
		context: {
			enabled: true,
			label: "CTX",
			style: "detailed",
			showRate: true,
			showTokens: false,
			showCompactHint: true,
			thresholds: { warn: 70, critical: 85, danger: 95 },
		},
		cost: {
			enabled: true,
			label: "$",
			showBurnRate: true,
			showProjection: false,
			showBudgetRemaining: true,
		},
		mcp: {
			enabled: true,
			label: "MCP",
			showNames: true,
			style: "auto",
			icons: { connected: "✓", disconnected: "✗", disabled: "○", error: "!" },
			maxDisplay: 4,
		},
		cwd: {
			enabled: true,
			style: "short",
			maxLength: 30,
			showIcon: true,
		},
		outputStyle: {
			enabled: true,
			label: "style",
		},
		branch: {
			enabled: true,
		},
		status: {
			enabled: true,
		},
	},
	interactive: {
		enabled: false,
	},
	reactive: {
		enabled: true,
		pollInterval: 2000,
	},
};

export function loadConfig(): PulseConfig {
	for (const configPath of CONFIG_PATHS) {
		if (existsSync(configPath)) {
			try {
				const content = readFileSync(configPath, "utf-8");
				const userConfig = JSON.parse(content) as Partial<PulseConfig>;
				return deepMerge(DEFAULT_CONFIG, userConfig);
			} catch {
				// Fall back to default if config is invalid
			}
		}
	}
	return DEFAULT_CONFIG;
}

function deepMerge(target: PulseConfig, source: Partial<PulseConfig>): PulseConfig {
	const result = { ...target };

	if (source.theme !== undefined) result.theme = source.theme;
	if (source.lines !== undefined) result.lines = source.lines;
	if (source.interactive !== undefined) result.interactive = source.interactive;
	if (source.reactive !== undefined) result.reactive = source.reactive;

	if (source.components) {
		result.components = {
			...target.components,
			...source.components,
		};
	}

	return result;
}
