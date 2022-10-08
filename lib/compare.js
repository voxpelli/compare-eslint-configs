import equal from 'fast-deep-equal';

/** @type {Record<import('eslint').Linter.RuleLevel, undefined|'warn'|'error'>} */
const LEVEL_TO_SEVERITY = {
  '0': undefined,
  '1': 'warn',
  '2': 'error',
  'off': undefined,
  'warn': 'warn',
  'error': 'error',
};

/**
 * @typedef ruleSummary
 * @property {string[]} [warn]
 * @property {string[]} [error]
 * @property {Set<string>} [docUrls]
 * @property {{ [configName: string]: any[] }} [options]
 */

/**
 * @param {{ [configName: string]: Config }} configs
 * @returns {{ [ruleName: string]: ruleSummary}}
 */
function summarizeConfigs (configs) {
  /** @type {{ [ruleName: string]: ruleSummary}} */
  const foundRules = {};

  for (const [configName, { config, engine }] of Object.entries(configs)) {
    const relevantConfigRules = [];
    const { rules = {} } = config;

    for (const [ruleName, rule] of Object.entries(rules)) {
      if (rule === undefined) continue;

      const [level, ...options] = Array.isArray(rule) ? rule : [rule];

      const severity = LEVEL_TO_SEVERITY[level];

      if (!severity) continue;

      relevantConfigRules.push(ruleName);

      const foundRulesData = foundRules[ruleName] || (foundRules[ruleName] = {});
      const ruleSeverityToConfig = foundRulesData[severity] || (foundRulesData[severity] = []);

      ruleSeverityToConfig.push(configName);

      if (options.length) {
        const ruleOptionsToConfig = foundRulesData.options || (foundRulesData.options = {});
        ruleOptionsToConfig[configName] = options;
      }
    }

    const rulesMeta = engine.getRulesMetaForResults([{
      filePath: '',
      messages: relevantConfigRules.map(ruleId => ({ ruleId, column: 1, line: 1, message: '', severity: 2 })),
      suppressedMessages: [],
      errorCount: 1,
      fixableErrorCount: 1,
      fatalErrorCount: 1,
      warningCount: 1,
      fixableWarningCount: 1,
      usedDeprecatedRules: []
    }]);
    for (const ruleId in rulesMeta) {
      const docUrl = rulesMeta[ruleId]?.docs?.url;
      const foundRule = foundRules[ruleId];

      if (docUrl && foundRule) {
        const docUrls = foundRule.docUrls || new Set();
        docUrls.add(docUrl);
        foundRule.docUrls = docUrls;
      }
    }
  }

  return foundRules;
}

/**
 * @typedef Config
 * @property {import('eslint').Linter.Config} config
 * @property {import('eslint').ESLint} engine
 */

/**
 * @typedef ConfigDifferences
 * @property {{ [ruleName: string]: string[] }} onlyActiveIn
 * @property {{ [ruleName: string]: { warn?: string[]|undefined, error?: string[]|undefined } }} mixedSeverity
 * @property {{ [ruleName: string]: { [configName: string]: any[] } }} mixedConfigs
 * @property {{ [ruleName: string]: string[] }} ruleDocs
 */

/**
 * @param {{ [configName: string]: Config }} configs
 * @returns {ConfigDifferences}
 */
export function compareConfigs (configs) {
  const configCount = Object.keys(configs).length;
  const summarizedRules = summarizeConfigs(configs);

  /** @type {ConfigDifferences["onlyActiveIn"]} */
  const onlyActiveIn = {};
  /** @type {ConfigDifferences["mixedSeverity"]} */
  const mixedSeverity = {};
  /** @type {ConfigDifferences["mixedConfigs"]} */
  const mixedConfigs = {};
  /** @type {ConfigDifferences["ruleDocs"]} */
  const ruleDocs = {};

  for (const [ruleName, { docUrls, options, ...severity }] of Object.entries(summarizedRules)) {
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

    if (docUrls) {
      ruleDocs[ruleName] = [...docUrls];
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
    mixedConfigs,
    ruleDocs,
  };
}
