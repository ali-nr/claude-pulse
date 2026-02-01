import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ComponentOutput, McpConfig, McpServer } from "../schema";
import type { Theme } from "../themes/catppuccin";

let cachedServers: McpServer[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds

export function renderMcp(config: McpConfig, theme: Theme): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const label = config.label ?? "🧩 MCP";
	const icons = config.icons ?? {
		connected: "✓",
		disconnected: "✗",
		disabled: "○",
		error: "▲",
	};
	const maxDisplay = config.maxDisplay ?? 4;

	const servers = getMcpServers();
	const connectedCount = servers.filter((s) => s.status === "connected").length;
	const showOnlyProblems = config.showOnlyProblems ?? false;

	// Conditional visibility: hide when all servers are healthy
	if (showOnlyProblems) {
		const problemServers = servers.filter(
			(s) => s.status === "disconnected" || s.status === "error" || s.status === "disabled",
		);

		if (problemServers.length === 0) {
			return { text: "" };
		}

		const problemParts = problemServers.map((server) => {
			let icon: string;
			let serverColor: string;
			if (server.status === "disabled") {
				icon = icons.disabled;
				serverColor = theme.overlay0;
			} else if (server.status === "disconnected") {
				icon = icons.disconnected;
				serverColor = theme.red;
			} else {
				icon = icons.error;
				serverColor = theme.yellow;
			}
			return `${serverColor}${server.name} ${icon}${theme.reset}`;
		});

		const text = `${theme.yellow}⚠ ${label}:${theme.reset} ${problemParts.join("  ")}`;
		return { text, action: "/mcp" };
	}

	if (servers.length === 0) {
		const text = `${theme.sky}${label} ${theme.overlay0}0${theme.reset}`;
		return { text, action: "/mcp" };
	}

	// Build server status string with count
	const displayServers = servers.slice(0, maxDisplay);
	const remaining = servers.length - maxDisplay;

	const serverParts = displayServers.map((server) => {
		let icon: string;
		let color: string;

		switch (server.status) {
			case "connected":
				icon = icons.connected;
				color = theme.green;
				break;
			case "disconnected":
				icon = icons.disconnected;
				color = theme.red;
				break;
			case "disabled":
				icon = icons.disabled;
				color = theme.overlay0;
				break;
			default:
				icon = icons.error;
				color = theme.yellow;
		}

		return `${color}${server.name} ${icon}${theme.reset}`;
	});

	let serverStr = serverParts.join("  ");
	if (remaining > 0) {
		serverStr += `  ${theme.sky}+${remaining} more${theme.reset}`;
	}

	// Show count in label
	const countStr = `${connectedCount}/${servers.length}`;

	// If showNames is false, just show compact count
	if (config.showNames === false) {
		const text = `${theme.sky}${label} ${theme.green}${countStr}${theme.reset}`;
		return { text, action: "/mcp" };
	}

	const text = `${theme.sky}${label} ${theme.green}${countStr}${theme.reset}: ${serverStr}`;

	return { text, action: "/mcp" };
}

function getMcpServers(): McpServer[] {
	const now = Date.now();
	if (cachedServers && now - cacheTime < CACHE_TTL) {
		return cachedServers;
	}

	try {
		const output = execSync("claude mcp list 2>/dev/null", {
			encoding: "utf-8",
			timeout: 3000,
		});

		cachedServers = parseMcpOutput(output);

		// Cross-reference with ~/.claude.json to detect disabled servers
		// claude mcp list doesn't reflect runtime disabled state
		const disabledNames = getDisabledMcpServers();
		if (disabledNames.length > 0) {
			for (const server of cachedServers) {
				if (disabledNames.includes(server.name)) {
					server.status = "disabled";
				}
			}
		}
	} catch {
		cachedServers = [];
	}

	cacheTime = now;
	return cachedServers;
}

interface ClaudeJsonProject {
	disabledMcpServers?: string[];
}

interface ClaudeJson {
	projects?: Record<string, ClaudeJsonProject>;
}

function getDisabledMcpServers(): string[] {
	try {
		const claudeJsonPath = join(homedir(), ".claude.json");
		if (!existsSync(claudeJsonPath)) return [];

		const content = readFileSync(claudeJsonPath, "utf-8");
		const data = JSON.parse(content) as ClaudeJson;
		if (!data.projects) return [];

		// Find the most specific (longest) matching project path
		const cwd = process.cwd();
		let bestMatch = "";
		let bestDisabled: string[] = [];

		for (const [projectPath, projectData] of Object.entries(data.projects)) {
			if (
				cwd.startsWith(projectPath) &&
				projectPath.length > bestMatch.length &&
				projectData?.disabledMcpServers
			) {
				bestMatch = projectPath;
				bestDisabled = projectData.disabledMcpServers;
			}
		}

		return bestDisabled;
	} catch {
		return [];
	}
}

function parseMcpOutput(output: string): McpServer[] {
	const servers: McpServer[] = [];
	const lines = output.split("\n");

	for (const line of lines) {
		// New format: "context7: npx -y @upstash/context7-mcp - ✓ Connected"
		const newFormatMatch = line.match(
			/^(\S+):\s+(.+?)\s+-\s+([✓✔✗✘○◯!])\s*(Connected|Disconnected|Disabled|Error)/i,
		);

		if (newFormatMatch) {
			const [, name, command, , statusText] = newFormatMatch;
			let status: McpServer["status"];

			switch (statusText.toLowerCase()) {
				case "connected":
					status = "connected";
					break;
				case "disconnected":
					status = "disconnected";
					break;
				case "disabled":
					status = "disabled";
					break;
				default:
					status = "error";
			}

			servers.push({ name, status, command });
			continue;
		}

		// Legacy format fallback: "✓ Connected: context7 (stdio)"
		const legacyConnected = line.match(/[✓✔]\s*Connected:\s*(\S+)/i);
		const legacyDisconnected = line.match(/[✗✘]\s*Disconnected:\s*(\S+)/i);
		const legacyDisabled = line.match(/[○◯]\s*Disabled:\s*(\S+)/i);

		if (legacyConnected) {
			servers.push({ name: legacyConnected[1], status: "connected" });
		} else if (legacyDisconnected) {
			servers.push({ name: legacyDisconnected[1], status: "disconnected" });
		} else if (legacyDisabled) {
			servers.push({ name: legacyDisabled[1], status: "disabled" });
		}
	}

	return servers;
}
