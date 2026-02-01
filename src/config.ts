import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { PulseConfig } from "./schema";

const CONFIG_PATHS = [
	join(homedir(), ".config", "claude-pulse", "config.json"),
	join(homedir(), ".claude-pulse.json"),
];

export const DEFAULT_CONFIG: PulseConfig = {
	theme: "catppuccin",
	lines: [
		{
			enabled: true,
			components: ["model", "context", "cost", "branch", "session"],
			separator: " ",
		},
		{
			enabled: true,
			components: ["mcp", "linesChanged", "hooks"],
			separator: " │ ",
		},
		{
			enabled: false,
			components: ["cache", "cwd"],
			separator: " │ ",
		},
	],
	components: {
		tier: {
			enabled: false,
			labels: { pro: "PRO", max: "MAX", api: "API" },
		},
		model: {
			enabled: true,
			showIcon: false,
		},
		context: {
			enabled: true,
			label: "",
			style: "compact",
			showRate: false,
			showTokens: false,
			showCompactHint: false,
			thresholds: { warn: 70, critical: 85, danger: 95 },
		},
		cost: {
			enabled: true,
			label: "$",
			showBurnRate: false,
			showProjection: false,
		},
		session: {
			enabled: true,
			showDuration: true,
			label: "",
		},
		mcp: {
			enabled: true,
			label: "MCP",
			showNames: true,
			showOnlyProblems: true,
			style: "auto",
			icons: { connected: "✓", disconnected: "✗", disabled: "○", error: "!" },
			maxDisplay: 4,
		},
		branch: {
			enabled: true,
		},
		status: {
			enabled: true,
		},
		cwd: {
			enabled: true,
			style: "short",
			maxLength: 30,
			showIcon: true,
		},
		linesChanged: {
			enabled: true,
		},
		hooks: {
			enabled: true,
		},
		cache: {
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
