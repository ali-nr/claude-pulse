import type { ClaudeStatusInput, ComponentOutput, SystemConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

function formatTokens(tokens: number): string {
	if (tokens >= 1000000) {
		return `${(tokens / 1000000).toFixed(1)}M`;
	}
	if (tokens >= 1000) {
		return `${(tokens / 1000).toFixed(1)}k`;
	}
	return `${tokens}`;
}

export function renderSystem(
	input: ClaudeStatusInput,
	config: SystemConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const ctx = input.context_window;
	if (!ctx) {
		return { text: "" };
	}

	const parts: string[] = [];

	// Cache usage - this represents system prompt, MCP context, etc.
	if (config.showCacheUsage !== false) {
		const cacheCreation = ctx.current_usage?.cache_creation_input_tokens ?? 0;
		const cacheRead = ctx.current_usage?.cache_read_input_tokens ?? 0;
		const totalCache = cacheCreation + cacheRead;

		if (totalCache > 0) {
			parts.push(`${theme.yellow}sys:${formatTokens(totalCache)}${theme.reset}`);
		}
	}

	// Free space remaining
	if (config.showFreeSpace !== false) {
		const remaining = ctx.remaining_percentage ?? 0;
		const windowSize = ctx.context_window_size ?? 200000;
		const freeTokens = Math.round((remaining / 100) * windowSize);

		let color = theme.green;
		if (remaining < 20) {
			color = theme.red;
		} else if (remaining < 40) {
			color = theme.yellow;
		}

		parts.push(
			`${color}free:${formatTokens(freeTokens)} (${Math.round(remaining)}%)${theme.reset}`,
		);
	}

	if (parts.length === 0) {
		return { text: "" };
	}

	const text = parts.join(" │ ");
	return { text };
}
