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
 * @typedef Config
 * @property {import('eslint').Linter.Config} config
 * @property {import('eslint').ESLint} engine
 */

/**
 * @typedef RuleSummary
 * @property {string[]} [warn]
 * @property {string[]} [error]
 * @property {Set<string>} [docUrls]
 * @property {{ [configName: string]: unknown[] }} [options]
 */

/**
 * @param {{ [configName: string]: Config }} configs
 * @returns {{ [ruleName: string]: RuleSummary}}
 */
export function summarizeConfigs (configs) {
  /** @type {{ [ruleName: string]: RuleSummary}} */
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
      usedDeprecatedRules: [],
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
 * @typedef ConfigDifferences
 * @property {{ [ruleName: string]: string[] }} onlyActiveIn
 * @property {{ [ruleName: string]: { warn?: string[]|undefined, error?: string[]|undefined } }} mixedSeverity
 * @property {{ [ruleName: string]: { [configName: string]: unknown[] } }} mixedConfigs
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

  for (const [ruleName, { docUrls, error, options, warn }] of Object.entries(summarizedRules)) {
    const activeConfigs = [error || [], warn || []].flat();
    const activeCount = activeConfigs.length;

    const activeEveryWhere = activeCount === configCount;

    if (error && warn) {
      mixedSeverity[ruleName] = { error, warn };
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

/**
 * @typedef RuleConfig
 * @property {'warn'|'error'} severity
 * @property {unknown[]|null|undefined} [options]
 */

/**
 * @typedef ConfigDiff
 * @property {{ [ruleName: string]: RuleConfig }} added
 * @property {{ [ruleName: string]: RuleConfig }} removed
 * @property {{ [ruleName: string]: RuleConfig & { oldOptions: unknown[]|null } }} changedConfig
 * @property {{ [ruleName: string]: RuleConfig }} changedSeverity
 * @property {{ [ruleName: string]: string[] }} ruleDocs
 */

/**
 * @param {{ configName: string, config: Config }} target
 * @param {{ configName: string, config: Config }} source
 * @returns {ConfigDiff | false}
 */
export function diffConfigs (target, source) {
  const summarizedRules = summarizeConfigs({
    [target.configName]: target.config,
    [source.configName]: source.config,
  });

  /** @type {ConfigDiff["added"]} */
  const added = {};
  /** @type {ConfigDiff["removed"]} */
  const removed = {};
  /** @type {ConfigDiff["changedConfig"]} */
  const changedConfig = {};
  /** @type {ConfigDiff["changedSeverity"]} */
  const changedSeverity = {};
  /** @type {ConfigDiff["ruleDocs"]} */
  const ruleDocs = {};

  for (const [ruleName, { docUrls, error, options, warn }] of Object.entries(summarizedRules)) {
    const activeIn = (error || warn || []);

    if (docUrls) {
      ruleDocs[ruleName] = [...docUrls];
    }

    if ((error && warn) || activeIn.length === 2) {
      // If active in both, check what has changed...

      const severity = error?.includes(source.configName) ? 'error' : 'warn';

      if (error && warn) {
        changedSeverity[ruleName] = { severity };
      }

      if (options) {
        const targetOptions = options[target.configName];
        const sourceOptions = options[source.configName];

        if (targetOptions && sourceOptions) {
          if (!equal(targetOptions, sourceOptions)) {
            changedConfig[ruleName] = {
              severity,
              oldOptions: targetOptions,
              options: sourceOptions,
            };
          }
        } else if (targetOptions || sourceOptions) {
          changedConfig[ruleName] = {
            severity,
            // eslint-disable-next-line unicorn/no-null
            oldOptions: targetOptions || null,
            // eslint-disable-next-line unicorn/no-null
            options: sourceOptions || null,
          };
        }
      }
    } else if (activeIn.includes(source.configName)) {
      // ...else marked as added if only seen in the source config...
      added[ruleName] = {
        severity: error ? 'error' : 'warn',
        // eslint-disable-next-line unicorn/no-null
        options: (options && options[source.configName]) || null,
      };
    } else {
      // ...and else as removed.
      removed[ruleName] = {
        severity: error ? 'error' : 'warn',
        // eslint-disable-next-line unicorn/no-null
        options: (options && options[target.configName]) || null,
      };
    }
  }

  const hasDiff = Object.keys(added).length > 0 ||
    Object.keys(removed).length > 0 ||
    Object.keys(changedConfig).length > 0 ||
    Object.keys(changedSeverity).length > 0;

  return hasDiff
    ? {
        added,
        removed,
        changedConfig,
        changedSeverity,
        ruleDocs,
      }
    : false;
}
