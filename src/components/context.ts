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
	if (style === "compact") {
		display = `${Math.round(usedPercent)}%`;
	} else if (style === "detailed" && ctx) {
		// Detailed: show tokens and percentage
		const totalUsed = ctx.total_input_tokens + ctx.total_output_tokens;
		const windowSize = ctx.context_window_size;
		display = `${formatTokens(totalUsed)}/${formatTokens(windowSize)} (${Math.round(usedPercent)}%)`;
	} else if (style === "bar" || style === "both") {
		const windowSize = ctx?.context_window_size || 200000;
		const totalUsed = (ctx?.total_input_tokens || 0) + (ctx?.total_output_tokens || 0);
		const freeTokens = Math.max(0, windowSize - totalUsed);
		const freePercent = ctx?.remaining_percentage ?? Math.round((freeTokens / windowSize) * 100);

		// Build bar (10 segments)
		const filled = Math.round(usedPercent / 10);
		const empty = 10 - filled;
		const bar = `${color}${"●".repeat(filled)}${theme.reset}${"○".repeat(empty)}`;

		// Build labels: used:Xk free:Yk (Z%)
		const usedLabel = `${color}used:${formatTokens(totalUsed)}${theme.reset}`;
		const freeLabel = `${theme.green}free:${formatTokens(freeTokens)} (${Math.round(freePercent)}%)${theme.reset}`;

		display =
			style === "both" ? `${bar} ${usedLabel} ${freeLabel}` : `${bar} ${Math.round(usedPercent)}%`;
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

	// Compact hint
	let hint = "";
	if (config.showCompactHint && usedPercent >= 80) {
		hint = " 💡/compact";
	}

	const labelStr = label ? `${label} ` : "";
	const text = `${color}${labelStr}${display}${tokenInfo}${rateStr}${indicator}${hint}${theme.reset}`;

	return { text, action: "/context" };
}
