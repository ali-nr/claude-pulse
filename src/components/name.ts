import { basename } from "node:path";
import type { ClaudeStatusInput, ComponentOutput, NameConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

export function renderName(
	input: ClaudeStatusInput,
	config: NameConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	// Special logo mode: ❤️♣️♣️❤️ with Claude colors
	if (config.custom === "logo" || config.custom === "❤♣♣❤" || config.custom === "❤️♣️♣️❤️") {
		const heart = `${theme.peach}❤️${theme.reset}`;
		const club = `${theme.mauve}♣️${theme.reset}`;
		return { text: `${heart}${club}${club}${heart}` };
	}

	// Use custom name or derive from project directory
	const projectDir = input.workspace?.project_dir ?? input.cwd ?? "";
	const name = config.custom ?? basename(projectDir);

	if (!name) {
		return { text: "" };
	}

	const text = `${theme.blue}${theme.bold}${name}${theme.reset}`;
	return { text };
}
