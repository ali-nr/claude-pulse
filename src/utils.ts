import { execSync } from "node:child_process";

let cachedProjectRoot: string | null | undefined;

/**
 * Find the git project root. Claude Code uses git root for project-level
 * settings, so we need to match that behavior instead of using process.cwd().
 */
export function getProjectRoot(): string | null {
	if (cachedProjectRoot !== undefined) return cachedProjectRoot;

	try {
		cachedProjectRoot = execSync("git rev-parse --show-toplevel", {
			encoding: "utf-8",
			timeout: 2000,
			stdio: ["pipe", "pipe", "ignore"],
		}).trim();
	} catch {
		cachedProjectRoot = null;
	}

	return cachedProjectRoot;
}
