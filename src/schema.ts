import { z } from "zod";

// Claude Code statusline input schema - passthrough unknown fields
export const ClaudeStatusInputSchema = z
	.object({
		hook_event_name: z.string(),
		session_id: z.string(),
		transcript_path: z.string(),
		cwd: z.string(),
		model: z.object({
			id: z.string(),
			display_name: z.string(),
		}),
		workspace: z.object({
			current_dir: z.string(),
			project_dir: z.string(),
		}),
		version: z.string(),
		output_style: z.object({
			name: z.string(),
		}),
		cost: z.object({
			total_cost_usd: z.number(),
			total_duration_ms: z.number(),
			total_api_duration_ms: z.number(),
			total_lines_added: z.number(),
			total_lines_removed: z.number(),
		}),
		context_window: z.object({
			total_input_tokens: z.number(),
			total_output_tokens: z.number(),
			context_window_size: z.number(),
			used_percentage: z.number(),
			remaining_percentage: z.number(),
			current_usage: z.object({
				input_tokens: z.number(),
				output_tokens: z.number(),
				cache_creation_input_tokens: z.number(),
				cache_read_input_tokens: z.number(),
			}),
		}),
	})
	.passthrough();

// Infer type from schema
export type ClaudeStatusInput = z.infer<typeof ClaudeStatusInputSchema>;

// MCP server schema
export const McpServerSchema = z.object({
	name: z.string(),
	status: z.enum(["connected", "disconnected", "disabled", "error"]),
	transport: z.string().optional(),
	command: z.string().optional(),
});

export type McpServer = z.infer<typeof McpServerSchema>;

// Component output schema
export const ComponentOutputSchema = z.object({
	text: z.string(),
	action: z.string().optional(),
});

export type ComponentOutput = z.infer<typeof ComponentOutputSchema>;

// Config schemas
export const TierConfigSchema = z.object({
	enabled: z.boolean().optional(),
	override: z.enum(["pro", "max", "api"]).optional(),
	labels: z
		.object({
			pro: z.string(),
			max: z.string(),
			api: z.string(),
		})
		.optional(),
});

export type TierConfig = z.infer<typeof TierConfigSchema>;

export const ModelConfigSchema = z.object({
	enabled: z.boolean().optional(),
	label: z.string().optional(),
	showIcon: z.boolean().optional(),
	icons: z
		.object({
			opus: z.string(),
			sonnet: z.string(),
			haiku: z.string(),
		})
		.optional(),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

export const ContextConfigSchema = z.object({
	enabled: z.boolean().optional(),
	label: z.string().optional(),
	style: z.enum(["bar", "percent", "both", "detailed", "compact"]).optional(),
	showRate: z.boolean().optional(),
	showCompactHint: z.boolean().optional(),
	showTokens: z.boolean().optional(),
	showSystemUsage: z.boolean().optional(),
	thresholds: z
		.object({
			warn: z.number(),
			critical: z.number(),
			danger: z.number(),
		})
		.optional(),
});

export type ContextConfig = z.infer<typeof ContextConfigSchema>;

export const CostConfigSchema = z.object({
	enabled: z.boolean().optional(),
	label: z.string().optional(),
	showBurnRate: z.boolean().optional(),
	showProjection: z.boolean().optional(),
	showBudgetRemaining: z.boolean().optional(),
	thresholds: z
		.object({
			warn: z.number(),
			critical: z.number(),
		})
		.optional(),
});

export type CostConfig = z.infer<typeof CostConfigSchema>;

export const McpConfigSchema = z.object({
	enabled: z.boolean().optional(),
	label: z.string().optional(),
	showNames: z.boolean().optional(),
	style: z.enum(["compact", "expanded", "auto"]).optional(),
	icons: z
		.object({
			connected: z.string(),
			disconnected: z.string(),
			disabled: z.string(),
			error: z.string(),
		})
		.optional(),
	maxDisplay: z.number().optional(),
	showOnlyProblems: z.boolean().optional(),
});

export type McpConfig = z.infer<typeof McpConfigSchema>;

export const CwdConfigSchema = z.object({
	enabled: z.boolean().optional(),
	label: z.string().optional(),
	style: z.enum(["full", "short", "basename", "project"]).optional(),
	maxLength: z.number().optional(),
	showIcon: z.boolean().optional(),
});

export type CwdConfig = z.infer<typeof CwdConfigSchema>;

export const TimeConfigSchema = z.object({
	enabled: z.boolean().optional(),
	showTimezone: z.boolean().optional(),
	showIcon: z.boolean().optional(),
	format: z.enum(["12h", "24h"]).optional(),
});

export type TimeConfig = z.infer<typeof TimeConfigSchema>;

export const SystemConfigSchema = z.object({
	enabled: z.boolean().optional(),
	showCacheUsage: z.boolean().optional(),
	showFreeSpace: z.boolean().optional(),
});

export type SystemConfig = z.infer<typeof SystemConfigSchema>;

export const NameConfigSchema = z.object({
	enabled: z.boolean().optional(),
	custom: z.string().optional(),
});

export const SessionConfigSchema = z.object({
	enabled: z.boolean().optional(),
	showDuration: z.boolean().optional(),
	showId: z.boolean().optional(),
	label: z.string().optional(),
});

export type SessionConfig = z.infer<typeof SessionConfigSchema>;

export type NameConfig = z.infer<typeof NameConfigSchema>;

export const LinesChangedConfigSchema = z.object({
	enabled: z.boolean().optional(),
	label: z.string().optional(),
	showAdded: z.boolean().optional(),
	showRemoved: z.boolean().optional(),
	showNet: z.boolean().optional(),
});

export type LinesChangedConfig = z.infer<typeof LinesChangedConfigSchema>;

export const HooksConfigSchema = z.object({
	enabled: z.boolean().optional(),
	label: z.string().optional(),
	showCount: z.boolean().optional(),
	showNames: z.boolean().optional(),
	maxDisplay: z.number().optional(),
});

export type HooksConfig = z.infer<typeof HooksConfigSchema>;

export const CacheConfigSchema = z.object({
	enabled: z.boolean().optional(),
	label: z.string().optional(),
	showHitRate: z.boolean().optional(),
	showTokensSaved: z.boolean().optional(),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

export const ComponentConfigsSchema = z.object({
	tier: TierConfigSchema.optional(),
	model: ModelConfigSchema.optional(),
	context: ContextConfigSchema.optional(),
	cost: CostConfigSchema.optional(),
	mcp: McpConfigSchema.optional(),
	cwd: CwdConfigSchema.optional(),
	time: TimeConfigSchema.optional(),
	system: SystemConfigSchema.optional(),
	name: NameConfigSchema.optional(),
	session: SessionConfigSchema.optional(),
	outputStyle: z
		.object({ enabled: z.boolean().optional(), label: z.string().optional() })
		.optional(),
	branch: z.object({ enabled: z.boolean().optional(), label: z.string().optional() }).optional(),
	status: z.object({ enabled: z.boolean().optional() }).optional(),
	linesChanged: LinesChangedConfigSchema.optional(),
	hooks: HooksConfigSchema.optional(),
	cache: CacheConfigSchema.optional(),
});

export type ComponentConfigs = z.infer<typeof ComponentConfigsSchema>;

export const LineOverrideSchema = z.object({
	enabled: z.boolean().optional(),
	separator: z.string().optional(),
});

export type LineOverride = z.infer<typeof LineOverrideSchema>;

// Fixed 5-line layout — users can enable/disable and change separators, but not rearrange
// Line 1 (identity) is not configurable — pulse logo + cwd is fixed branding
export const LinesConfigSchema = z.object({
	git: LineOverrideSchema.optional(),
	engine: LineOverrideSchema.optional(),
	mcp: LineOverrideSchema.optional(),
	hooks: LineOverrideSchema.optional(),
});

export type LinesConfig = z.infer<typeof LinesConfigSchema>;

// Internal line definition used at render time
export interface LineDefinition {
	name: string;
	enabled: boolean;
	components: string[];
	separator: string;
}

export const PulseConfigSchema = z.object({
	theme: z.string(),
	lines: LinesConfigSchema.optional(),
	components: ComponentConfigsSchema,
	interactive: z
		.object({
			enabled: z.boolean(),
		})
		.optional(),
	reactive: z
		.object({
			enabled: z.boolean(),
			pollInterval: z.number(),
		})
		.optional(),
});

export type PulseConfig = z.infer<typeof PulseConfigSchema>;

// Helper to safely parse input - trust Claude Code's JSON structure
export function parseClaudeInput(json: string): ClaudeStatusInput | null {
	try {
		const data = JSON.parse(json) as ClaudeStatusInput;
		// Trust the input - Claude Code provides the data
		return data;
	} catch {
		return null;
	}
}
