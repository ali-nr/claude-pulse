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

	// Determine color based on how much context is used
	// Higher usage = more urgent color
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

	const label = config.label ?? "Used";
	const style = config.style ?? "bar";

	let display: string;
	if (style === "percent") {
		display = `${Math.round(usedPercent)}%`;
	} else if (style === "detailed" && ctx) {
		// Detailed: show used tokens and used percentage
		const totalUsed = ctx.total_input_tokens + ctx.total_output_tokens;
		const windowSize = ctx.context_window_size;
		display = `${formatTokens(totalUsed)}/${formatTokens(windowSize)} (${Math.round(usedPercent)}%)`;
	} else if (style === "bar" || style === "both") {
		const windowSize = ctx?.context_window_size || 200000;
		const totalUsed = (ctx?.total_input_tokens || 0) + (ctx?.total_output_tokens || 0);

		// Build bar (10 segments) - shows how much is used
		const used = Math.round(usedPercent / 10);
		const free = 10 - used;
		const bar = `${color}${"●".repeat(used)}${theme.reset}${"○".repeat(free)}`;

		display =
			style === "both"
				? `${bar} ${color}${formatTokens(totalUsed)}${theme.reset} ${theme.overlay0}/ ${formatTokens(windowSize)}${theme.reset}`
				: `${bar} ${color}${Math.round(usedPercent)}%${theme.reset}`;
	} else {
		display = `${Math.round(usedPercent)}%`;
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

	// Compact hint - show when usage is high (80% or more)
	let hint = "";
	if (config.showCompactHint && usedPercent >= 80) {
		hint = " 💡/compact";
	}

	const labelStr = label ? `${label} ` : "";
	const text = `${color}${labelStr}${display}${tokenInfo}${rateStr}${indicator}${hint}${theme.reset}`;

	return { text, action: "/context" };
}
