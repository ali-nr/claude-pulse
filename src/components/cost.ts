import type { ClaudeStatusInput, ComponentOutput, CostConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

export function renderCost(
	input: ClaudeStatusInput,
	config: CostConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const cost = input.cost?.total_cost_usd ?? 0;
	const durationMs = input.cost?.total_duration_ms ?? 0;
	const label = config.label ?? "$";

	// Format cost
	const costStr = cost < 0.01 ? cost.toFixed(3) : cost.toFixed(2);

	// Calculate burn rate ($/hour)
	let burnRateStr = "";
	if (config.showBurnRate && durationMs > 60000) {
		const durationHours = durationMs / 3600000;
		const burnRate = cost / durationHours;
		burnRateStr = ` (${label}${burnRate.toFixed(2)}/hr)`;
	}

	// Projection (estimate based on typical 2hr session)
	let projectionStr = "";
	if (config.showProjection && durationMs > 60000) {
		const durationHours = durationMs / 3600000;
		const burnRate = cost / durationHours;
		const projected = burnRate * 2; // 2 hour session estimate
		projectionStr = ` → ${label}${projected.toFixed(2)}`;
	}

	// Color based on cost (simple threshold)
	let color = theme.green;
	if (cost >= 5) {
		color = theme.red;
	} else if (cost >= 2) {
		color = theme.peach;
	} else if (cost >= 1) {
		color = theme.yellow;
	}

	const text = `${color}${label}${costStr}${burnRateStr}${projectionStr}${theme.reset}`;

	return { text, action: "/cost" };
}
