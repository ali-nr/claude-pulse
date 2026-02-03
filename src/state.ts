import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const STATE_PATH = join(homedir(), ".config", "claude-pulse", "state.json");

export interface McpServerState {
	name: string;
	status: string;
}

export interface PulseState {
	mcp?: {
		servers: McpServerState[];
		lastUpdated?: number;
	};
	firstRenderAt?: number;
}

let stateCache: PulseState | null = null;

export function loadState(): PulseState {
	if (stateCache) return stateCache;

	try {
		if (existsSync(STATE_PATH)) {
			const content = readFileSync(STATE_PATH, "utf-8");
			stateCache = JSON.parse(content) as PulseState;
			return stateCache;
		}
	} catch {
		// Corrupt state file — start fresh
	}

	stateCache = {};
	return stateCache;
}

export function saveState(state: PulseState): void {
	try {
		const dir = dirname(STATE_PATH);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(STATE_PATH, JSON.stringify(state));
		stateCache = state;
	} catch {
		// Silently fail — state is nice-to-have, not critical
	}
}
