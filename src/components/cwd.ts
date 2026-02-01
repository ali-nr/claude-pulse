import { homedir } from "node:os";
import { basename } from "node:path";
import type { ClaudeStatusInput, ComponentOutput, CwdConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";
import { getPulseColor } from "./name";

export function renderCwd(
	input: ClaudeStatusInput,
	config: CwdConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const cwd = input.workspace?.current_dir ?? input.cwd ?? "";
	if (!cwd) {
		return { text: "" };
	}

	const label = config.label ?? "";
	const style = config.style ?? "short";
	const maxLength = config.maxLength ?? 30;
	const showIcon = config.showIcon !== false;

	let displayPath: string;

	switch (style) {
		case "full":
			displayPath = cwd;
			break;
		case "basename":
			displayPath = basename(cwd);
			break;
		case "project": {
			// Just show the project folder name - clean and minimal
			displayPath = basename(cwd);
			break;
		}
		default: {
			// Replace home directory with ~
			const home = homedir();
			displayPath = cwd.startsWith(home) ? `~${cwd.slice(home.length)}` : cwd;

			// Truncate if too long
			if (displayPath.length > maxLength) {
				const parts = displayPath.split("/");
				// Keep first and last parts, abbreviate middle
				if (parts.length > 3) {
					displayPath = `${parts[0]}/…/${parts[parts.length - 1]}`;
				}
			}
			break;
		}
	}

	const icon = showIcon ? "▶ " : "";
	const labelStr = label ? `${label} ` : "";

	const cwdColor = getPulseColor(theme, 0.15);
	const text = `${cwdColor}${theme.bold}${icon}${labelStr}${displayPath}${theme.reset}`;

	return { text };
}
