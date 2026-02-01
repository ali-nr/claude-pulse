import { basename } from "node:path";
import type { ClaudeStatusInput, ComponentOutput, NameConfig } from "../schema";
import { loadState, saveState } from "../state";
import type { Theme } from "../themes/catppuccin";

const PULSE_INTERVAL = 5 * 60 * 1000; // 5 minutes between pulse cycles
const PULSE_WINDOW = 30000; // 30 seconds — generous window for slow refresh rates

export function renderName(
	input: ClaudeStatusInput,
	config: NameConfig,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	// Special logo mode: ❤♣♣❤ with Claude colors (peach + purple)
	if (config.custom === "logo") {
		const heart = `${theme.peach}❤${theme.reset}`;
		const club = `${theme.mauve}♣${theme.reset}`;
		return { text: `${heart}${club}${club}${heart}` };
	}

	// Pulse logo mode: ♥ pulse with brand gradient + color wave animation
	if (config.custom === "pulse") {
		const heartColor = getPulseColor(theme, 0);
		const icon = `${heartColor}♥${theme.reset}`;
		const p = `${theme.mauve}p${theme.reset}`;
		const u = `${theme.lavender}u${theme.reset}`;
		const l = `${theme.blue}l${theme.reset}`;
		const s = `${theme.sapphire}s${theme.reset}`;
		const e = `${theme.sky}e${theme.reset}`;
		return { text: `${icon} ${p}${u}${l}${s}${e}` };
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

// High-contrast wave: cool → warm → hot → warm → cool
const WAVE_COLORS_KEYS = [
	"mauve",
	"pink",
	"red",
	"peach",
	"yellow",
	"green",
	"sky",
	"mauve",
] as const;

/**
 * Get the current pulse wave progress (0-1) or null if not pulsing.
 */
export function getPulseProgress(): number | null {
	const now = Date.now();
	const state = loadState();

	if (!state.firstRenderAt) {
		saveState({ ...state, firstRenderAt: now });
		return null;
	}

	const elapsed = now - state.firstRenderAt;
	const timeSinceLastPulse = elapsed % PULSE_INTERVAL;

	if (timeSinceLastPulse > PULSE_WINDOW) {
		return null;
	}

	return timeSinceLastPulse / PULSE_WINDOW;
}

/**
 * Get pulse wave color at a given progress offset.
 * offset=0 is the heart, offset=0.15 is slightly behind (for cwd trailing the wave).
 */
export function getPulseColor(theme: Theme, offset = 0): string {
	const progress = getPulseProgress();
	if (progress === null) {
		return theme.mauve;
	}

	const wave = WAVE_COLORS_KEYS.map((k) => theme[k]);
	// Apply offset and clamp to 0-1
	const adjusted = Math.max(0, Math.min(1, progress - offset));
	const index = Math.floor(adjusted * (wave.length - 1));
	return wave[index];
}
