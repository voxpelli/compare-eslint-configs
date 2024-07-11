import type { BaseFlags, InputContext, OutputFlags } from '../flags/flag-types.js';

interface CommandContextBase extends BaseFlags, InputContext {}

export interface CommandContextDiff extends CommandContextBase, OutputFlags {
  exitCode: boolean;
}

export interface CommandContextSummary extends CommandContextBase, OutputFlags {}
