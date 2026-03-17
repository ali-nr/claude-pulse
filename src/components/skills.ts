import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ComponentOutput, SkillsConfig } from "../schema";
import type { Theme } from "../themes/catppuccin";

interface SkillInfo {
	folder: string;
	valid: boolean;
	name?: string;
	error?: "missing_file" | "invalid_frontmatter" | "missing_fields";
}

interface SkillsSummary {
	skills: SkillInfo[];
	valid: number;
	broken: number;
	total: number;
}

export function renderSkills(config: SkillsConfig, theme: Theme): ComponentOutput {
	if (config.enabled === false) {
		return { text: "" };
	}

	const summary = getSkillsSummary();
	const label = config.label ?? "Skills";
	const showNames = config.showNames !== false;
	const showCount = config.showCount !== false;
	const maxDisplay = config.maxDisplay ?? Infinity;

	if (summary.total === 0) {
		const text = `${theme.mauve}✦ ${label} ${theme.overlay0}0${theme.reset}`;
		return { text };
	}

	const validNames = summary.skills
		.filter((s) => s.valid)
		.map((s) => s.name ?? s.folder)
		.slice(0, maxDisplay);

	const brokenNames = summary.skills.filter((s) => !s.valid).map((s) => s.folder);

	// Build header: "✦ Skills 42"
	const countStr = showCount ? ` ${theme.mauve}${summary.valid}${theme.reset}` : "";
	const header = `${theme.mauve}✦ ${label}${theme.reset}${countStr}`;

	// Build items — adaptive based on count
	const items: string[] = [];
	const GROUP_THRESHOLD = 10;
	const MIN_PREFIX_COUNT = 3;

	if (showNames && validNames.length > 0) {
		if (validNames.length > GROUP_THRESHOLD) {
			// Group by prefix for large collections
			const { groups, ungrouped } = groupByPrefix(validNames, MIN_PREFIX_COUNT);
			const hasGroups = Object.keys(groups).length > 0;

			if (hasGroups) {
				// Render prefix groups: "bmad:75"
				for (const [prefix, names] of Object.entries(groups).sort(
					(a, b) => b[1].length - a[1].length,
				)) {
					items.push(`${theme.overlay1}${prefix}:${theme.peach}${names.length}${theme.reset}`);
				}

				// Render ungrouped skills individually
				for (const name of ungrouped) {
					items.push(`${theme.flamingo}${name}${theme.reset}`);
				}
			} else {
				// No groups — show capped list with overflow
				const CAP = 10;
				const capped = validNames.slice(0, CAP);
				for (const name of capped) {
					items.push(`${theme.flamingo}${name}${theme.reset}`);
				}
				if (validNames.length > CAP) {
					items.push(`${theme.overlay0}+${validNames.length - CAP}${theme.reset}`);
				}
			}
		} else {
			// List individual names for small collections
			for (const name of validNames) {
				items.push(`${theme.flamingo}${name}${theme.reset}`);
			}
		}

		const overflow = summary.valid > maxDisplay ? summary.valid - maxDisplay : 0;
		if (overflow > 0) {
			items.push(`${theme.overlay0}+${overflow}${theme.reset}`);
		}
	}

	// Broken skills as individual items
	if (summary.broken > 0) {
		for (const name of brokenNames) {
			items.push(`${theme.red}▲${name}${theme.reset}`);
		}
	}

	// Flat text for simple rendering
	const text = items.length > 0 ? `${header} ${items.join(" ")}` : header;
	return { text, header, items };
}

/**
 * Group names by their common prefix (before first `-` or `:`).
 * Only groups with >= minCount members are grouped; the rest stay ungrouped.
 */
export function groupByPrefix(
	names: string[],
	minCount: number,
): { groups: Record<string, string[]>; ungrouped: string[] } {
	const buckets: Record<string, string[]> = {};

	for (const name of names) {
		const sep = name.includes(":") ? ":" : "-";
		const prefix = name.split(sep)[0];
		if (!buckets[prefix]) buckets[prefix] = [];
		buckets[prefix].push(name);
	}

	const groups: Record<string, string[]> = {};
	const ungrouped: string[] = [];

	for (const [prefix, members] of Object.entries(buckets)) {
		if (members.length >= minCount) {
			groups[prefix] = members;
		} else {
			ungrouped.push(...members);
		}
	}

	return { groups, ungrouped };
}

function getSkillsSummary(): SkillsSummary {
	const skills: SkillInfo[] = [];

	// Scan user-level skills
	const userSkillsPath = join(homedir(), ".claude", "skills");
	scanSkillsDirectory(userSkillsPath, skills);

	// Scan project-level skills
	const projectSkillsPath = join(process.cwd(), ".claude", "skills");
	scanSkillsDirectory(projectSkillsPath, skills);

	// Deduplicate by folder name (project overrides user)
	const seen = new Set<string>();
	const deduped: SkillInfo[] = [];
	for (const skill of skills.reverse()) {
		if (!seen.has(skill.folder)) {
			seen.add(skill.folder);
			deduped.push(skill);
		}
	}

	const valid = deduped.filter((s) => s.valid).length;
	const broken = deduped.filter((s) => !s.valid).length;

	return {
		skills: deduped.reverse(),
		valid,
		broken,
		total: deduped.length,
	};
}

function scanSkillsDirectory(dirPath: string, skills: SkillInfo[]): void {
	if (!existsSync(dirPath)) return;

	try {
		const entries = readdirSync(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			const skillInfo = validateSkill(dirPath, entry.name);
			skills.push(skillInfo);
		}
	} catch {
		// Silently ignore read errors
	}
}

function validateSkill(skillsDir: string, folder: string): SkillInfo {
	const skillPath = join(skillsDir, folder);
	const skillMdPath = join(skillPath, "SKILL.md");

	// Level 1: File exists
	if (!existsSync(skillMdPath)) {
		return { folder, valid: false, error: "missing_file" };
	}

	// Level 2 & 3: Parse frontmatter
	try {
		const content = readFileSync(skillMdPath, "utf-8");
		const frontmatter = parseFrontmatter(content);

		if (!frontmatter) {
			return { folder, valid: false, error: "invalid_frontmatter" };
		}

		if (!frontmatter.name || !frontmatter.description) {
			return { folder, valid: false, error: "missing_fields" };
		}

		return { folder, valid: true, name: frontmatter.name };
	} catch {
		return { folder, valid: false, error: "invalid_frontmatter" };
	}
}

export function parseFrontmatter(content: string): Record<string, string> | null {
	const lines = content.split("\n");

	// Check for opening ---
	if (lines[0]?.trim() !== "---") {
		return null;
	}

	// Find closing ---
	let endIndex = -1;
	for (let i = 1; i < lines.length; i++) {
		if (lines[i]?.trim() === "---") {
			endIndex = i;
			break;
		}
	}

	if (endIndex === -1) {
		return null;
	}

	// Parse simple YAML (key: value pairs)
	const result: Record<string, string> = {};
	for (let i = 1; i < endIndex; i++) {
		const line = lines[i];
		const match = line?.match(/^(\w+):\s*["']?(.+?)["']?\s*$/);
		if (match) {
			result[match[1]] = match[2];
		}
	}

	return result;
}
