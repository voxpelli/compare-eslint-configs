import type { BaseFlags, InspectInputContext, InputContext, OutputFlags } from '../flags/flag-types.js';

interface CommandContextBase extends BaseFlags, InputContext {}

export interface CommandContextDiff extends CommandContextBase, OutputFlags {
  exitCode: boolean;
}

export interface CommandContextInspect extends InspectInputContext {
  markdownOutput: boolean;
  showRules: boolean;
}

export interface CommandContextSummary extends CommandContextBase, OutputFlags {}
