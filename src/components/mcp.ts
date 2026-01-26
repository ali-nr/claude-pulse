import { execSync } from "node:child_process";
import type { ComponentOutput, McpConfig, McpServer } from "../schema";
import type { Theme } from "../themes/catppuccin";

let cachedServers: McpServer[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds

export function renderMcp(config: McpConfig, theme: Theme): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const label = config.label ?? "MCP";
	const icons = config.icons ?? {
		connected: "✓",
		disconnected: "✗",
		disabled: "○",
		error: "!",
	};
	const maxDisplay = config.maxDisplay ?? 4;

	const servers = getMcpServers();
	const connectedCount = servers.filter((s) => s.status === "connected").length;

	if (servers.length === 0) {
		const text = `${theme.overlay0}${label}: 0${theme.reset}`;
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
		serverStr += `  ${theme.overlay0}+${remaining} more${theme.reset}`;
	}

	// Show count in label
	const countStr = `${connectedCount}/${servers.length}`;

	// If showNames is false, just show compact count
	if (config.showNames === false) {
		const text = `${theme.text}${label} ${theme.green}${countStr}${theme.reset}`;
		return { text, action: "/mcp" };
	}

	const text = `${theme.text}${label} ${theme.green}${countStr}${theme.reset}: ${serverStr}`;

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
	} catch {
		cachedServers = [];
	}

	cacheTime = now;
	return cachedServers;
}

function parseMcpOutput(output: string): McpServer[] {
	const servers: McpServer[] = [];
	const lines = output.split("\n");

	for (const line of lines) {
		// New format: "context7: npx -y @upstash/context7-mcp - ✓ Connected"
		// or "deepwiki: https://mcp.deepwiki.com/mcp (HTTP) - ✓ Connected"
		// or "server-name: command - ✗ Disconnected"
		// or "server-name: command - ○ Disabled"
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
