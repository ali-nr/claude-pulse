import type { ClaudeStatusInput, ComponentOutput, ContextConfig } from "../schema";
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

export function renderContext(
	input: ClaudeStatusInput,
	config: ContextConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const ctx = input.context_window;
	const thresholds = config.thresholds ?? { warn: 70, critical: 85, danger: 95 };

	// Calculate used percentage from actual token data if available
	// This fixes the 0% issue at session start when system tokens are loaded
	let usedPercent = ctx?.used_percentage ?? 0;
	if (usedPercent === 0 && ctx?.current_usage && ctx?.context_window_size) {
		const totalTokens =
			(ctx.current_usage.cache_creation_input_tokens || 0) +
			(ctx.current_usage.cache_read_input_tokens || 0) +
			(ctx.current_usage.input_tokens || 0) +
			(ctx.current_usage.output_tokens || 0);
		if (totalTokens > 0) {
			usedPercent = (totalTokens / ctx.context_window_size) * 100;
		}
	}

	// Determine color based on usage
	let color = theme.green;
	let indicator = "";
	if (usedPercent >= thresholds.danger) {
		color = theme.red;
		indicator = " 🔴";
	} else if (usedPercent >= thresholds.critical) {
		color = theme.peach;
		indicator = " ⚠️";
	} else if (usedPercent >= thresholds.warn) {
		color = theme.yellow;
	}

	const label = config.label ?? "CTX";
	const style = config.style ?? "bar";

	let display: string;
	if (style === "detailed" && ctx) {
		// Detailed: show tokens and percentage
		const totalUsed = ctx.total_input_tokens + ctx.total_output_tokens;
		const windowSize = ctx.context_window_size;
		display = `${formatTokens(totalUsed)}/${formatTokens(windowSize)} (${Math.round(usedPercent)}%)`;
	} else if (style === "bar" || style === "both") {
		// Check if we should show two-tone bar with system usage
		if (config.showSystemUsage && ctx?.current_usage) {
			const windowSize = ctx.context_window_size || 1;

			// System/cache tokens = cache_read (system prompt, tools, MCP, memory, skills)
			// These get cached and reused across requests
			const systemTokens =
				(ctx.current_usage.cache_creation_input_tokens || 0) +
				(ctx.current_usage.cache_read_input_tokens || 0);

			// Conversation tokens (non-cached input + output)
			const conversationTokens =
				(ctx.current_usage.input_tokens || 0) + (ctx.current_usage.output_tokens || 0);

			// Total used = system + conversation
			const actualUsed = systemTokens + conversationTokens;

			// Free space
			const freeTokens = Math.max(0, windowSize - actualUsed);

			// Calculate percentages of the context window
			const systemPercent = (systemTokens / windowSize) * 100;
			const convPercent = (conversationTokens / windowSize) * 100;

			// Build two-tone bar (10 segments)
			const systemBlocks = Math.round(systemPercent / 10);
			const convBlocks = Math.round(convPercent / 10);
			const emptyBlocks = Math.max(0, 10 - systemBlocks - convBlocks);

			// System in yellow (◉), conversation in bright (●), empty (○)
			const systemBar =
				systemBlocks > 0 ? `${theme.yellow}${"◉".repeat(systemBlocks)}${theme.reset}` : "";
			const convBar = convBlocks > 0 ? `${color}${"●".repeat(convBlocks)}${theme.reset}` : "";
			const emptyBar = "○".repeat(emptyBlocks);

			const bar = `${systemBar}${convBar}${emptyBar}`;

			// Build labels: sys:Xk msg:Yk free:Zk (percentage)
			const freePercent = Math.round((freeTokens / windowSize) * 100);
			const sysLabel = `${theme.yellow}sys:${formatTokens(systemTokens)}${theme.reset}`;
			const msgLabel = `${color}msg:${formatTokens(conversationTokens)}${theme.reset}`;
			const freeLabel = `${theme.green}free:${formatTokens(freeTokens)} (${freePercent}%)${theme.reset}`;

			display = `${bar} ${sysLabel} ${msgLabel} ${freeLabel}`;
		} else {
			const filled = Math.round(usedPercent / 10);
			const empty = 10 - filled;
			const bar = "●".repeat(filled) + "○".repeat(empty);
			display = style === "both" ? `${bar} ${Math.round(usedPercent)}%` : bar;
		}
	} else {
		display = `${Math.round(usedPercent)}%`;
	}

	// Show token breakdown if enabled
	let tokenInfo = "";
	if (config.showTokens && ctx) {
		const inTok = formatTokens(ctx.total_input_tokens);
		const outTok = formatTokens(ctx.total_output_tokens);
		tokenInfo = ` [in:${inTok} out:${outTok}]`;
	}

	// Calculate rate if enabled
	let rateStr = "";
	if (config.showRate && ctx && input.cost?.total_duration_ms) {
		const totalTokens = ctx.total_input_tokens + ctx.total_output_tokens;
		const durationMin = input.cost.total_duration_ms / 60000;
		if (durationMin > 0.1) {
			const rate = totalTokens / durationMin;
			if (rate >= 1000) {
				rateStr = ` +${(rate / 1000).toFixed(1)}k/min`;
			} else {
				rateStr = ` +${Math.round(rate)}/min`;
			}
		}
	}

	// Compact hint
	let hint = "";
	if (config.showCompactHint && usedPercent >= 80) {
		hint = " 💡/compact";
	}

	const text = `${color}${label} ${display}${tokenInfo}${rateStr}${indicator}${hint}${theme.reset}`;

	return { text, action: "/context" };
}
