import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ComponentOutput, TierConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

interface ClaudeJson {
	oauthAccount?: {
		hasExtraUsageEnabled?: boolean;
	};
}

let cachedTier: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export function renderTier(config: TierConfig, theme: Theme): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const labels = config.labels ?? { pro: "PRO", max: "MAX", api: "API" };
	// Use override if set, otherwise auto-detect
	const tier = config.override ?? detectTier();

	let color = theme.blue;
	let label = labels.pro;

	if (tier === "max") {
		color = theme.mauve;
		label = labels.max;
	} else if (tier === "api") {
		color = theme.green;
		label = labels.api;
	}

	const text = `${color}${theme.bold}${label}${theme.reset}`;

	return { text, action: "/usage" };
}

function detectTier(): "pro" | "max" | "api" {
	const now = Date.now();
	if (cachedTier && now - cacheTime < CACHE_TTL) {
		return cachedTier as "pro" | "max" | "api";
	}

	const claudeJsonPath = join(homedir(), ".claude.json");

	try {
		if (existsSync(claudeJsonPath)) {
			const content = readFileSync(claudeJsonPath, "utf-8");
			const data = JSON.parse(content) as ClaudeJson;

			if (data.oauthAccount?.hasExtraUsageEnabled) {
				cachedTier = "max";
			} else if (data.oauthAccount) {
				cachedTier = "pro";
			} else {
				cachedTier = "api";
			}
		} else {
			cachedTier = "api";
		}
	} catch {
		cachedTier = "pro";
	}

	cacheTime = now;
	return cachedTier as "pro" | "max" | "api";
}
