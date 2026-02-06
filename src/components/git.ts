import { execSync } from "node:child_process";
import type { ComponentConfigs, ComponentOutput } from "../schema";
import type { Theme } from "../themes/catppuccin";

interface StatusLines {
	added: number;
	modified: number;
	deleted: number;
}

interface GitCache {
	branch: string;
	status: string;
	statusLines: StatusLines;
	time: number;
}

let cache: GitCache | null = null;
const CACHE_TTL = 2000; // 2 seconds

export function renderBranch(
	config: NonNullable<ComponentConfigs["branch"]>,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const git = getGitInfo();
	if (!git.branch) {
		return { text: "" };
	}

	const icon = "⎇ ";
	const label = config.label ?? "";
	const labelStr = label ? `${theme.teal}${label} ${theme.reset}` : "";
	const text = `${theme.teal}${icon}${theme.reset}${labelStr}${theme.teal}${git.branch}${theme.reset}`;
	return { text };
}

export function renderStatus(
	config: NonNullable<ComponentConfigs["status"]>,
	theme: Theme,
): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const git = getGitInfo();
	if (!git.status) {
		return { text: "" };
	}

	// Build labeled status parts
	const lines = git.statusLines;
	const parts: string[] = [];
	if (lines.added > 0) parts.push(`${theme.green}+${lines.added} new${theme.reset}`);
	if (lines.modified > 0) parts.push(`${theme.yellow}~${lines.modified} mod${theme.reset}`);
	if (lines.deleted > 0) parts.push(`${theme.red}-${lines.deleted} del${theme.reset}`);

	const text = parts.join(" ");
	return { text };
}

function getGitInfo(): { branch: string; status: string; statusLines: StatusLines } {
	const now = Date.now();
	if (cache && now - cache.time < CACHE_TTL) {
		return { branch: cache.branch, status: cache.status, statusLines: cache.statusLines };
	}

	let branch = "";
	let status = "";
	const statusLines: StatusLines = { added: 0, modified: 0, deleted: 0 };

	try {
		branch = execSync("git branch --show-current 2>/dev/null", {
			encoding: "utf-8",
			timeout: 1000,
		}).trim();
	} catch {
		// Not a git repo or git not available
	}

	if (branch) {
		try {
			const porcelain = execSync("git status --porcelain 2>/dev/null", {
				encoding: "utf-8",
				timeout: 1000,
			});

			const lines = porcelain.trim().split("\n").filter(Boolean);

			for (const line of lines) {
				const code = line.substring(0, 2);
				if (code.includes("A") || code.includes("?")) statusLines.added++;
				else if (code.includes("D")) statusLines.deleted++;
				else if (code.includes("M")) statusLines.modified++;
			}

			const parts: string[] = [];
			if (statusLines.added > 0) parts.push(`+${statusLines.added}`);
			if (statusLines.deleted > 0) parts.push(`-${statusLines.deleted}`);
			if (statusLines.modified > 0) parts.push(`~${statusLines.modified}`);

			status = parts.join(" ");
		} catch {
			// Git status failed
		}
	}

	cache = { branch, status, statusLines, time: now };
	return { branch, status, statusLines };
}
