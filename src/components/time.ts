import type { ComponentOutput, TimeConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

export function renderTime(config: TimeConfig, theme: Theme): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const showTimezone = config.showTimezone ?? true;
	const showIcon = config.showIcon ?? true;
	const format = config.format ?? "12h";

	const now = new Date();

	// Get timezone abbreviation (AEST, PST, etc.)
	const tzAbbrev =
		now.toLocaleTimeString("en-AU", { timeZoneName: "short" }).split(" ").pop() ?? "";

	// Get city name as fallback
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const cityName = timezone.split("/").pop() ?? timezone;

	// Format time
	let timeStr: string;
	if (format === "24h") {
		timeStr = now.toLocaleTimeString("en-AU", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	} else {
		timeStr = now.toLocaleTimeString("en-AU", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	}

	const icon = showIcon ? "🕐 " : "";
	// Use abbreviation if available (AEST), otherwise city name (Melbourne)
	const tzDisplay = tzAbbrev.length <= 5 ? tzAbbrev : cityName;
	const tzStr = showTimezone ? ` ${tzDisplay}` : "";

	const text = `${theme.overlay1}${icon}${timeStr}${tzStr}${theme.reset}`;

	return { text };
}
