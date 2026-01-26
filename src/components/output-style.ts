import type { ClaudeStatusInput, ComponentConfigs, ComponentOutput } from "../schema";
import type { Theme } from "../themes/catppuccin";

export function renderOutputStyle(
	input: ClaudeStatusInput,
	config: NonNullable<ComponentConfigs["outputStyle"]>,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const styleName = input.output_style?.name ?? "default";
	const label = config.label ?? "style";

	const text = `${theme.overlay1}${label}: ${styleName}${theme.reset}`;

	return { text, action: "/output-style" };
}
