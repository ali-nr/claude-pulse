/**
 * Terminal-width-aware line wrapping.
 *
 * Strips ANSI escape codes to measure visible width, then wraps
 * component parts onto additional lines when they exceed terminal width.
 */

// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape detection requires matching \x1b
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;

/** Return the visible (printed) length of a string that may contain ANSI codes. */
export function visibleLength(str: string): number {
	return str.replace(ANSI_RE, "").length;
}

/**
 * Join component parts with a separator, wrapping to new lines
 * when the visible width would exceed `maxWidth`.
 *
 * Continuation lines are indented with `indent` spaces to visually
 * distinguish them from new logical lines.
 */
export function wrapParts(
	parts: string[],
	separator: string,
	maxWidth: number,
	indent = 2,
	maxPerLine = 0,
): string {
	if (parts.length === 0) return "";

	const sepWidth = visibleLength(separator);
	const pad = " ".repeat(indent);
	const lines: string[] = [];
	let currentLine = parts[0];
	let currentWidth = visibleLength(parts[0]);
	let partsOnLine = 1;

	for (let i = 1; i < parts.length; i++) {
		const partWidth = visibleLength(parts[i]);
		const wouldBe = currentWidth + sepWidth + partWidth;
		const hitMax = maxPerLine > 0 && partsOnLine >= maxPerLine;

		if (wouldBe > maxWidth || hitMax) {
			lines.push(currentLine);
			currentLine = pad + parts[i];
			currentWidth = indent + partWidth;
			partsOnLine = 1;
		} else {
			currentLine += separator + parts[i];
			currentWidth = wouldBe;
			partsOnLine++;
		}
	}

	lines.push(currentLine);
	return lines.join("\n");
}

/** Return the current terminal width, defaulting to 80 if unavailable. */
export function getTerminalWidth(): number {
	return process.stdout.columns || Number(process.env.COLUMNS) || 80;
}
