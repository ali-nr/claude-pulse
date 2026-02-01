import type { CacheConfig, ClaudeStatusInput, ComponentOutput } from "../schema";
import type { Theme } from "../themes/catppuccin";

export function renderCache(
	input: ClaudeStatusInput,
	config: CacheConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const usage = input.context_window?.current_usage;
	if (!usage) {
		return { text: "" };
	}

	const { cache_read_input_tokens, cache_creation_input_tokens, input_tokens } = usage;
	const total = cache_read_input_tokens + cache_creation_input_tokens + input_tokens;

	if (total === 0) {
		return { text: "" };
	}

	const hitRate = Math.round((cache_read_input_tokens / total) * 100);

	// Color by efficiency: green >70%, yellow 40-70%, red <40%
	let color = theme.green;
	if (hitRate < 40) {
		color = theme.red;
	} else if (hitRate < 70) {
		color = theme.yellow;
	}

	const label = config.label ?? "Cache";
	const text = `${color}${label}: ${hitRate}%${theme.reset}`;

	return { text };
}
