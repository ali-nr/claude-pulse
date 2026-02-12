import type { ClaudeStatusInput, ComponentOutput, ModelConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

/**
 * Parse model ID to extract family and version
 * Examples:
 *   claude-opus-4-5-20251101 → { family: "opus", version: "4.5" }
 *   claude-sonnet-4-20250514 → { family: "sonnet", version: "4" }
 *   claude-3-5-sonnet-20241022 → { family: "sonnet", version: "3.5" }
 *   claude-3-haiku-20240307 → { family: "haiku", version: "3" }
 */
export function parseModelId(modelId: string): { family: string; version: string } | null {
	const id = modelId.toLowerCase();

	// New format: claude-{family}-{major}-{minor}-{date} (e.g., claude-opus-4-5-20251101)
	const newFormat = id.match(/^claude-(\w+)-(\d+)-(\d+)-\d+$/);
	if (newFormat) {
		const [, family, major, minor] = newFormat;
		return { family, version: `${major}.${minor}` };
	}

	// New format without minor: claude-{family}-{major}-{date} (e.g., claude-sonnet-4-20250514)
	const newFormatNoMinor = id.match(/^claude-(\w+)-(\d+)-\d{8}$/);
	if (newFormatNoMinor) {
		const [, family, major] = newFormatNoMinor;
		return { family, version: major };
	}

	// Old format: claude-{major}-{minor}-{family}-{date} (e.g., claude-3-5-sonnet-20241022)
	const oldFormat = id.match(/^claude-(\d+)-(\d+)-(\w+)-\d+$/);
	if (oldFormat) {
		const [, major, minor, family] = oldFormat;
		return { family, version: `${major}.${minor}` };
	}

	// Old format without minor: claude-{major}-{family}-{date} (e.g., claude-3-haiku-20240307)
	const oldFormatNoMinor = id.match(/^claude-(\d+)-(\w+)-\d+$/);
	if (oldFormatNoMinor) {
		const [, major, family] = oldFormatNoMinor;
		return { family, version: major };
	}

	return null;
}

export function renderModel(
	input: ClaudeStatusInput,
	config: ModelConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const modelId = input.model?.id ?? "";
	const displayName = input.model?.display_name ?? "";
	const icons = config.icons ?? { opus: "🧠", sonnet: "🎵", haiku: "⚡" };
	const showIcon = config.showIcon !== false;

	let icon = "🤖";
	let color = theme.text;
	let modelLabel = displayName;

	// Try to parse the model ID for accurate version info
	const parsed = parseModelId(modelId);

	if (parsed) {
		const family = parsed.family;
		const version = parsed.version;

		if (family === "opus") {
			icon = icons.opus;
			color = theme.mauve;
			modelLabel = `Opus ${version}`;
		} else if (family === "sonnet") {
			icon = icons.sonnet;
			color = theme.blue;
			modelLabel = `Sonnet ${version}`;
		} else if (family === "haiku") {
			icon = icons.haiku;
			color = theme.green;
			modelLabel = `Haiku ${version}`;
		}
	} else {
		// Fallback to display name matching
		const modelName = displayName.toLowerCase();
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
	}

	// Use config label if set, otherwise use parsed/detected model label
	const label = config.label !== undefined ? config.label : modelLabel;
	const iconStr = showIcon ? `${icon} ` : "";
	const text = `${color}${iconStr}${label}${theme.reset}`;

	return { text, action: "/model" };
}
