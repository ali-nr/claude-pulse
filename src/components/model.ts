import type { ClaudeStatusInput, ComponentOutput, ModelConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

export function renderModel(
	input: ClaudeStatusInput,
	config: ModelConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const displayName = input.model?.display_name ?? "";
	const modelName = displayName.toLowerCase();
	const icons = config.icons ?? { opus: "🧠", sonnet: "🎵", haiku: "⚡" };
	const showIcon = config.showIcon !== false;

	let icon = "🤖";
	let color = theme.text;
	let modelLabel = displayName;

	if (modelName.includes("opus")) {
		icon = icons.opus;
		color = theme.mauve;
		modelLabel = "Opus";
	} else if (modelName.includes("sonnet")) {
		icon = icons.sonnet;
		color = theme.blue;
		modelLabel = "Sonnet";
	} else if (modelName.includes("haiku")) {
		icon = icons.haiku;
		color = theme.green;
		modelLabel = "Haiku";
	}

	// Use config label if set, otherwise use model's display name
	const label = config.label !== undefined ? config.label : modelLabel;
	const iconStr = showIcon ? `${icon} ` : "";
	const text = `${color}${iconStr}${label}${theme.reset}`;

	return { text, action: "/model" };
}
