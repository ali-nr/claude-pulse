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
	const usedPercent = ctx?.used_percentage ?? 0;
	const remainingPercent = 100 - usedPercent; // Distance to compaction

	// Determine color based on how close to compaction (inverted logic)
	// Low remaining = danger, high remaining = safe
	let color = theme.green;
	let indicator = "";
	if (remainingPercent <= 100 - thresholds.danger) {
		// Less than 5% remaining = danger
		color = theme.red;
		indicator = " 🔴";
	} else if (remainingPercent <= 100 - thresholds.critical) {
		// Less than 15% remaining = critical
		color = theme.peach;
		indicator = " ⚠️";
	} else if (remainingPercent <= 100 - thresholds.warn) {
		// Less than 30% remaining = warn
		color = theme.yellow;
	}

	const label = config.label ?? "→Compact";
	const style = config.style ?? "bar";

	let display: string;
	if (style === "compact") {
		display = `${Math.round(remainingPercent)}%`;
	} else if (style === "detailed" && ctx) {
		// Detailed: show free tokens and remaining percentage
		const totalUsed = ctx.total_input_tokens + ctx.total_output_tokens;
		const windowSize = ctx.context_window_size;
		const freeTokens = Math.max(0, windowSize - totalUsed);
		display = `${formatTokens(freeTokens)}/${formatTokens(windowSize)} (${Math.round(remainingPercent)}%)`;
	} else if (style === "bar" || style === "both") {
		const windowSize = ctx?.context_window_size || 200000;
		const totalUsed = (ctx?.total_input_tokens || 0) + (ctx?.total_output_tokens || 0);
		const freeTokens = Math.max(0, windowSize - totalUsed);

		// Build bar (10 segments) - shows remaining space, not used
		const remaining = Math.round(remainingPercent / 10);
		const depleted = 10 - remaining;
		const bar = `${color}${"●".repeat(remaining)}${theme.reset}${"○".repeat(depleted)}`;

		// Build labels: free:Xk used:Yk (Z% to compact)
		const freeLabel = `${color}free:${formatTokens(freeTokens)}${theme.reset}`;
		const usedLabel = `${theme.overlay0}used:${formatTokens(totalUsed)}${theme.reset}`;

		display =
			style === "both"
				? `${bar} ${freeLabel} ${usedLabel}`
				: `${bar} ${Math.round(remainingPercent)}%`;
	} else {
		display = `${Math.round(remainingPercent)}%`;
	}

	// Show token breakdown if enabled
	let tokenInfo = "";
	if (config.showTokens && ctx) {
		const inTok = formatTokens(ctx.total_input_tokens);
		const outTok = formatTokens(ctx.total_output_tokens);
		const cacheRead = ctx.current_usage?.cache_read_input_tokens ?? 0;
		const cacheStr = cacheRead > 0 ? ` ⟳${formatTokens(cacheRead)}` : "";
		tokenInfo = ` ${theme.sky}↓${inTok}${theme.reset} ${theme.peach}↑${outTok}${theme.reset}${cacheStr ? `${theme.teal}${cacheStr}${theme.reset}` : ""}`;
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

	// Compact hint - show when remaining is low (20% or less)
	let hint = "";
	if (config.showCompactHint && remainingPercent <= 20) {
		hint = " 💡/compact";
	}

	const labelStr = label ? `${label} ` : "";
	const text = `${color}${labelStr}${display}${tokenInfo}${rateStr}${indicator}${hint}${theme.reset}`;

	return { text, action: "/context" };
}
