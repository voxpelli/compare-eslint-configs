import equal from 'fast-deep-equal';

/** @type {Record<import('eslint').Linter.RuleLevel, import('eslint').Linter.Severity>} */
const LEVEL_TO_SEVERITY = {
  '0': 0,
  '1': 1,
  '2': 2,
  'off': 0,
  'warn': 1,
  'error': 2,
};

/**
 * @param {{ [configName: string]: import('eslint').Linter.Config }} configs
 * @returns {{ [ruleName: string]: { 1?: string[], 2?: string[], options?: { [configName: string]: any[] }}}}
 */
function summarizeConfigs (configs) {
  /** @type {ReturnType<summarizeConfigs>} */
  const foundRules = {};

  for (const [configName, { rules = {} }] of Object.entries(configs)) {
    for (const [ruleName, rule] of Object.entries(rules)) {
      if (rule === undefined) continue;

      const [level, ...options] = Array.isArray(rule) ? rule : [rule];

      const severity = LEVEL_TO_SEVERITY[level];

      if (severity === 0) continue;

      const foundRulesData = foundRules[ruleName] || (foundRules[ruleName] = {});
      const ruleSeverityToConfig = foundRulesData[severity] || (foundRulesData[severity] = []);

      ruleSeverityToConfig.push(configName);

      if (options.length) {
        const ruleOptionsToConfig = foundRulesData.options || (foundRulesData.options = {});
        ruleOptionsToConfig[configName] = options;
      }
    }
  }

  return foundRules;
}

/**
 * @typedef ConfigDifferences
 * @property {{ [ruleName: string]: string[] }} onlyActiveIn
 * @property {{ [ruleName: string]: { 1?: string[], 2?: string[] } }} mixedSeverity
 * @property {{ [ruleName: string]: { [configName: string]: any[] } }} mixedConfigs
 */

/**
 * @param  {{ [configName: string]: import('eslint').Linter.Config }} configs
 * @returns {ConfigDifferences}
 */
export function compareConfigs (configs) {
  const configCount = Object.keys(configs).length;
  const configRules = summarizeConfigs(configs);

  /** @type {ConfigDifferences["onlyActiveIn"]} */
  const onlyActiveIn = {};
  /** @type {ConfigDifferences["mixedSeverity"]} */
  const mixedSeverity = {};
  /** @type {ConfigDifferences["mixedConfigs"]} */
  const mixedConfigs = {};

  for (const [ruleName, { options, ...severity }] of Object.entries(configRules)) {
    /** @type {Array<string[]>} */
    const activeGroups = Object.values(severity);
    const activeConfigs = activeGroups.flat();
    const activeCount = activeConfigs.length;

    const activeEveryWhere = activeCount === configCount;

    if (activeGroups.length > 1) {
      mixedSeverity[ruleName] = severity;
    }

    if (!activeEveryWhere) {
      onlyActiveIn[ruleName] = activeConfigs;
    }

    const [baseOptions, ...remainingOptions] = Object.values(options || {});

    if (options && baseOptions) {
      if (remainingOptions.length === activeCount - 1) {
        for (const configOptions of remainingOptions) {
          if (!equal(baseOptions, configOptions)) {
            mixedConfigs[ruleName] = options;
            break;
          }
        }
      } else {
        mixedConfigs[ruleName] = options;
      }
    }
  }

  return {
    onlyActiveIn,
    mixedSeverity,
    mixedConfigs
  };
}
