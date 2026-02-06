import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { LineDefinition, PulseConfig } from "./schema";

const CONFIG_PATHS = [
	join(homedir(), ".config", "claude-pulse", "config.json"),
	join(homedir(), ".claude-pulse.json"),
];

// Fixed 5-line layout — components and order are not user-configurable
// Line 1 (identity) is hardcoded branding — not in user-configurable lines
const FIXED_LINES: LineDefinition[] = [
	{ name: "identity", enabled: true, components: ["name", "cwd"], separator: " " },
	{ name: "git", enabled: true, components: ["branch", "status"], separator: " │ " },
	{
		name: "engine",
		enabled: true,
		components: ["tier", "model", "context", "cost", "session"],
		separator: " │ ",
	},
	{ name: "mcp", enabled: true, components: ["mcp"], separator: " │ " },
	{ name: "hooks", enabled: true, components: ["hooks"], separator: " │ " },
];

export const DEFAULT_CONFIG: PulseConfig = {
	theme: "catppuccin",
	components: {
		tier: {
			enabled: true,
			labels: { pro: "PRO", max: "MAX", api: "API" },
		},
		model: {
			enabled: true,
			showIcon: false,
		},
		context: {
			enabled: true,
			label: "→Compact",
			style: "bar",
			showRate: false,
			showTokens: true,
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
			showOnlyProblems: false,
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
				return mergeConfig(DEFAULT_CONFIG, userConfig);
			} catch {
				// Fall back to default if config is invalid
			}
		}
	}
	return DEFAULT_CONFIG;
}

/**
 * Resolve the fixed line layout with user overrides for enabled/separator.
 * Identity line is not user-configurable — always renders pulse logo + cwd.
 */
export function getLines(config: PulseConfig): LineDefinition[] {
	const overrides = config.lines ?? {};
	return FIXED_LINES.map((line) => {
		if (line.name === "identity") return line;
		const userOverride = overrides[line.name as keyof typeof overrides];
		if (!userOverride) return line;
		return {
			...line,
			enabled: userOverride.enabled ?? line.enabled,
			separator: userOverride.separator ?? line.separator,
		};
	});
}

function mergeConfig(target: PulseConfig, source: Partial<PulseConfig>): PulseConfig {
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
