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

	// Build header
	const header = `${theme.yellow}⚡${hookLabel} ${summary.total}${theme.reset}`;

	// Build event type items for wrapping — cap names per group when many hooks
	const MAX_NAMES_PER_GROUP = 3;
	const compact = summary.total > 6;

	const items: string[] = [];
	for (const [event, detail] of Object.entries(summary.events)) {
		const label = EVENT_LABELS[event] ?? event;
		const countStr = showCount ? `${theme.peach}${detail.count}${theme.reset}` : "";
		const eventTag = `${theme.lavender}${label}:${theme.reset}${countStr}`;

		if (showNames && detail.names.length > 0) {
			const cap = compact ? MAX_NAMES_PER_GROUP : detail.names.length;
			const displayed = detail.names.slice(0, cap);
			const overflow = detail.names.length - cap;
			const nameStr = `${theme.flamingo}${displayed.join(",")}${theme.reset}`;
			const overflowStr = overflow > 0 ? ` ${theme.overlay0}+${overflow}${theme.reset}` : "";
			items.push(`${eventTag} ${nameStr}${overflowStr}`);
		} else {
			items.push(eventTag);
		}

		if (detail.broken.length > 0) {
			items.push(`${theme.red}${detail.broken.join(",")} ▲${theme.reset}`);
		}
	}

	const text = items.length > 0 ? `${header} ${items.join(" ")}` : header;
	return { text, header, items };
}

function getHooksSummary(): HooksSummary {
	const events: Record<string, HookDetail> = {};
	let total = 0;

	const globalPath = join(homedir(), ".claude", "settings.json");
	mergeHooksFromFile(globalPath, events);

	const projectPath = join(process.cwd(), ".claude", "settings.json");
	mergeHooksFromFile(projectPath, events);

	// Remove events with zero hooks (e.g. empty arrays in config)
	for (const [key, detail] of Object.entries(events)) {
		if (detail.count === 0) delete events[key];
	}

	let totalBroken = 0;
	for (const detail of Object.values(events)) {
		total += detail.count;
		totalBroken += detail.broken.length;
	}

	return { events, total, totalBroken };
}

export function extractHookInfo(command: string): { name: string; broken: boolean } {
	// Extract meaningful name from command like "bun run /path/to/lint-check.ts"
	const parts = command.split(/\s+/);

	// Find the first token that looks like a file path
	for (const part of parts) {
		if (part.includes("/")) {
			// Strip surrounding quotes and expand $ENV_VAR references
			const cleaned = part.replace(/["']/g, "");
			let expanded = cleaned.replace(/\$(\w+)/g, (_, v) => {
				if (v === "CLAUDE_PROJECT_DIR") return process.env[v] ?? process.cwd();
				return process.env[v] ?? `$${v}`;
			});
			// Expand ~ to home directory (shell does this, but Node doesn't)
			if (expanded.startsWith("~/")) {
				expanded = join(homedir(), expanded.slice(2));
			}
			// Resolve relative paths against project dir
			if (!expanded.startsWith("/")) {
				const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
				expanded = join(projectDir, expanded);
			}
			const base = expanded.split("/").pop() ?? expanded;
			const name = base.replace(/\.[^.]+$/, "");
			// Validate the file path exists
			const broken = !existsSync(expanded);
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
