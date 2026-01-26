import { execSync } from "node:child_process";
import type { ComponentConfigs, ComponentOutput } from "../schema";
import type { Theme } from "../themes/catppuccin";

interface GitCache {
	branch: string;
	status: string;
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

	const text = `${theme.mauve}${git.branch}${theme.reset}`;
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

	const text = `${theme.green}${git.status}${theme.reset}`;
	return { text };
}

function getGitInfo(): { branch: string; status: string } {
	const now = Date.now();
	if (cache && now - cache.time < CACHE_TTL) {
		return { branch: cache.branch, status: cache.status };
	}

	let branch = "";
	let status = "";

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
			let added = 0;
			let deleted = 0;
			let modified = 0;

			for (const line of lines) {
				const code = line.substring(0, 2);
				if (code.includes("A") || code.includes("?")) added++;
				else if (code.includes("D")) deleted++;
				else if (code.includes("M")) modified++;
			}

			const parts: string[] = [];
			if (added > 0) parts.push(`+${added}`);
			if (deleted > 0) parts.push(`-${deleted}`);
			if (modified > 0) parts.push(`~${modified}`);

			status = parts.join(" ");
		} catch {
			// Git status failed
		}
	}

	cache = { branch, status, time: now };
	return { branch, status };
}
