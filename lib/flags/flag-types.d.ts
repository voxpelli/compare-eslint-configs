import type { ESLint, Linter } from 'eslint';

export interface InputContext {
  configFiles: string[],
  configs: Record<string, { config: Linter.Config, engine: ESLint }>;
}

export interface BaseFlags {
  verbose: boolean;
}

export interface OutputFlags {
  groupByRule: boolean;
  jsonOutput: boolean;
  markdownOutput: boolean;
  skipLinks: boolean;
  table: boolean;
  verboseConfigs: boolean;
}
