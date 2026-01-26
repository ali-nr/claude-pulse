import type { ClaudeStatusInput, ComponentOutput } from "../schema";
import type { Theme } from "../themes/catppuccin";

export interface SessionConfig {
	enabled?: boolean;
	showDuration?: boolean;
	showId?: boolean;
	label?: string;
}

function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		const remainingMins = minutes % 60;
		return `${hours}h${remainingMins > 0 ? ` ${remainingMins}m` : ""}`;
	}
	if (minutes > 0) {
		const remainingSecs = seconds % 60;
		return `${minutes}m${remainingSecs > 0 ? ` ${remainingSecs}s` : ""}`;
	}
	return `${seconds}s`;
}

export function renderSession(
	input: ClaudeStatusInput,
	config: SessionConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const parts: string[] = [];
	const label = config.label ?? "session";

	// Session duration from total_duration_ms
	if (config.showDuration !== false && input.cost?.total_duration_ms) {
		const duration = formatDuration(input.cost.total_duration_ms);
		parts.push(`${theme.blue}${duration}${theme.reset}`);
	}

	// Session ID (truncated)
	if (config.showId && input.session_id) {
		const shortId = input.session_id.slice(0, 8);
		parts.push(`${theme.overlay0}#${shortId}${theme.reset}`);
	}

	if (parts.length === 0) {
		return { text: "" };
	}

	const labelPart = label ? `${theme.subtext0}${label}:${theme.reset} ` : "";
	const text = `${labelPart}${parts.join(" ")}`;
	return { text };
}
