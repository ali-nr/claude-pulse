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
}

interface HooksSummary {
	events: Record<string, HookDetail>;
	total: number;
}

let cachedSummary: HooksSummary | null = null;
let cacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds — responsive to config changes

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

	// Build event type breakdown with hook names: "Post:2 lint-check,agent-comm"
	const eventParts = Object.entries(summary.events).map(([event, detail]) => {
		const label = EVENT_LABELS[event] ?? event;
		const names =
			detail.names.length > 0 ? ` ${theme.flamingo}${detail.names.join(",")}${theme.reset}` : "";
		return `${theme.lavender}${label}:${theme.reset}${theme.peach}${detail.count}${theme.reset}${names}`;
	});

	const hookLabel = config.label ?? "Hooks";
	const text = `${theme.yellow}⚡${hookLabel} ${summary.total}${theme.reset} ${eventParts.join(" ")}`;
	return { text };
}

function getHooksSummary(): HooksSummary {
	const now = Date.now();
	if (cachedSummary !== null && now - cacheTime < CACHE_TTL) {
		return cachedSummary;
	}

	const events: Record<string, HookDetail> = {};
	let total = 0;

	const globalPath = join(homedir(), ".claude", "settings.json");
	mergeHooksFromFile(globalPath, events);

	const projectPath = join(process.cwd(), ".claude", "settings.json");
	mergeHooksFromFile(projectPath, events);

	for (const detail of Object.values(events)) {
		total += detail.count;
	}

	cachedSummary = { events, total };
	cacheTime = now;
	return cachedSummary;
}

function extractHookName(command: string): string {
	// Extract meaningful name from command like "bun run /path/to/lint-check.ts"
	const parts = command.split(/\s+/);

	// Find the first token that looks like a file path
	for (const part of parts) {
		if (part.includes("/")) {
			const base = part.split("/").pop() ?? part;
			return base.replace(/\.[^.]+$/, "");
		}
	}

	// No file path found — use the command name (e.g. "cm" from "cm reflect --days 1")
	const cmd = parts[0];
	if (parts.length > 1) {
		return `${cmd}-${parts[1]}`;
	}
	return cmd;
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
				events[eventName] = { count: 0, names: [] };
			}
			for (const group of groups) {
				if (Array.isArray(group.hooks)) {
					for (const hook of group.hooks) {
						events[eventName].count++;
						const name = extractHookName(hook.command);
						if (name && !events[eventName].names.includes(name)) {
							events[eventName].names.push(name);
						}
					}
				}
			}
		}
	} catch {
		// Silently ignore parse errors
	}
}
