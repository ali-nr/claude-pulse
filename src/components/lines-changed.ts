import type { ClaudeStatusInput, ComponentOutput, LinesChangedConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

export function renderLinesChanged(
	input: ClaudeStatusInput,
	config: LinesChangedConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const added = input.cost?.total_lines_added ?? 0;
	const removed = input.cost?.total_lines_removed ?? 0;

	if (added === 0 && removed === 0) {
		return { text: "" };
	}

	const parts: string[] = [];
	if (added > 0) parts.push(`${theme.green}+${added}${theme.reset}`);
	if (removed > 0) parts.push(`${theme.red}-${removed}${theme.reset}`);

	return { text: parts.join(" ") };
}
