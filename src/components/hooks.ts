import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ComponentOutput, HooksConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

interface HookEntry {
	type: string;
	command: string;
}

interface HookGroup {
	matcher?: string;
	hooks: HookEntry[];
}

interface ClaudeSettings {
	hooks?: Record<string, HookGroup[]>;
}

interface HookDetail {
	count: number;
	names: string[];
	broken: string[];
}

interface HooksSummary {
	events: Record<string, HookDetail>;
	total: number;
	totalBroken: number;
}

// Short labels for hook event types
const EVENT_LABELS: Record<string, string> = {
	PreToolUse: "Pre",
	PostToolUse: "Post",
	SessionStart: "Start",
	SessionEnd: "End",
	UserPromptSubmit: "Submit",
	Stop: "Stop",
	Notification: "Notify",
	SubagentStop: "SubStop",
};

export function renderHooks(config: HooksConfig, theme: Theme): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const summary = getHooksSummary();
	if (summary.total === 0) {
		const hookLabel = config.label ?? "Hooks";
		const text = `${theme.yellow}⚡${hookLabel} ${theme.overlay0}0${theme.reset}`;
		return { text };
	}

	const hookLabel = config.label ?? "Hooks";
	const showNames = config.showNames !== false;
	const showCount = config.showCount !== false;

	// Minimal mode: just total count
	if (!showCount && !showNames) {
		const text = `${theme.yellow}⚡${hookLabel} ${summary.total}${theme.reset}`;
		return { text };
	}

	// Build event type breakdown
	const eventParts = Object.entries(summary.events).map(([event, detail]) => {
		const label = EVENT_LABELS[event] ?? event;
		const goodNames =
			showNames && detail.names.length > 0
				? ` ${theme.flamingo}${detail.names.join(",")}${theme.reset}`
				: "";
		const brokenNames =
			detail.broken.length > 0 ? ` ${theme.red}${detail.broken.join(",")} ▲${theme.reset}` : "";
		const countStr = showCount ? `${theme.peach}${detail.count}${theme.reset}` : "";
		return `${theme.lavender}${label}:${theme.reset}${countStr}${goodNames}${brokenNames}`;
	});

	const text = `${theme.yellow}⚡${hookLabel} ${summary.total}${theme.reset} ${eventParts.join(" ")}`;
	return { text };
}

function getHooksSummary(): HooksSummary {
	const events: Record<string, HookDetail> = {};
	let total = 0;

	const globalPath = join(homedir(), ".claude", "settings.json");
	mergeHooksFromFile(globalPath, events);

	const projectPath = join(process.cwd(), ".claude", "settings.json");
	mergeHooksFromFile(projectPath, events);

	let totalBroken = 0;
	for (const detail of Object.values(events)) {
		total += detail.count;
		totalBroken += detail.broken.length;
	}

	return { events, total, totalBroken };
}

function extractHookInfo(command: string): { name: string; broken: boolean } {
	// Extract meaningful name from command like "bun run /path/to/lint-check.ts"
	const parts = command.split(/\s+/);

	// Find the first token that looks like a file path
	for (const part of parts) {
		if (part.includes("/")) {
			const base = part.split("/").pop() ?? part;
			const name = base.replace(/\.[^.]+$/, "");
			// Validate the file path exists
			const broken = !existsSync(part);
			return { name, broken };
		}
	}

	// No file path found — use the command name (e.g. "cm" from "cm reflect --days 1")
	const cmd = parts[0];
	const name = parts.length > 1 ? `${cmd}-${parts[1]}` : cmd;
	return { name, broken: false };
}

function mergeHooksFromFile(filePath: string, events: Record<string, HookDetail>): void {
	try {
		if (!existsSync(filePath)) return;
		const content = readFileSync(filePath, "utf-8");
		const settings = JSON.parse(content) as ClaudeSettings;
		if (!settings.hooks || typeof settings.hooks !== "object") return;

		for (const [eventName, groups] of Object.entries(settings.hooks)) {
			if (!Array.isArray(groups)) continue;
			if (!events[eventName]) {
				events[eventName] = { count: 0, names: [], broken: [] };
			}
			for (const group of groups) {
				if (Array.isArray(group.hooks)) {
					for (const hook of group.hooks) {
						events[eventName].count++;
						const info = extractHookInfo(hook.command);
						if (info.name) {
							if (info.broken) {
								if (!events[eventName].broken.includes(info.name)) {
									events[eventName].broken.push(info.name);
								}
							} else if (!events[eventName].names.includes(info.name)) {
								events[eventName].names.push(info.name);
							}
						}
					}
				}
			}
		}
	} catch {
		// Silently ignore parse errors
	}
}
