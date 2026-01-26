import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ComponentOutput, ThinkingConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

let cachedThinking: boolean | null = null;
let cacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds

export function renderThinking(config: ThinkingConfig, theme: Theme): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const thinkingEnabled = getThinkingEnabled();
	if (!thinkingEnabled) {
		return { text: "" };
	}

	const label = config.label ?? "THINK";

	const text = `${theme.mauve}${label}${theme.reset}`;

	return { text };
}

function getThinkingEnabled(): boolean {
	const now = Date.now();
	if (cachedThinking !== null && now - cacheTime < CACHE_TTL) {
		return cachedThinking;
	}

	try {
		const settingsPath = join(homedir(), ".claude", "settings.json");
		const content = readFileSync(settingsPath, "utf-8");
		const settings = JSON.parse(content);
		cachedThinking = settings.alwaysThinkingEnabled === true;
	} catch {
		cachedThinking = false;
	}

	cacheTime = now;
	return cachedThinking;
}
