import { builtinRules } from 'eslint/use-at-your-own-risk';

/**
 * @typedef DeprecatedRuleInfo
 * @property {string} ruleName
 * @property {'warn' | 'error'} severity
 * @property {Array<{ ruleId?: string | undefined, pluginName?: string | undefined, message?: string | undefined, url?: string | undefined }>} replacedBy
 * @property {string | undefined} [docUrl]
 * @property {string | undefined} [deprecatedSince]
 * @property {string | undefined} [availableUntil]
 */

/**
 * @typedef UnconfiguredRuleInfo
 * @property {string} ruleName
 * @property {string | undefined} [docUrl]
 * @property {boolean} isRecommended
 */

/**
 * @typedef AuditStats
 * @property {number} totalConfigured
 * @property {number} totalDeprecated
 * @property {number} totalBuiltins
 * @property {number} totalBuiltinsActive
 * @property {number} totalBuiltinsUnconfigured
 * @property {string[]} pluginNames
 */

/**
 * @typedef AuditResult
 * @property {DeprecatedRuleInfo[]} deprecatedRules
 * @property {UnconfiguredRuleInfo[]} unconfiguredBuiltins
 * @property {AuditStats} stats
 */

/** @type {Record<import('eslint').Linter.RuleSeverity, undefined|'warn'|'error'>} */
const LEVEL_TO_SEVERITY = {
  '0': undefined,
  '1': 'warn',
  '2': 'error',
  'off': undefined,
  'warn': 'warn',
  'error': 'error',
};

/**
 * Collect all configured rules from raw flat config array
 *
 * @param {unknown[]} rawConfigs
 * @returns {Map<string, 'warn' | 'error'>}
 */
function collectConfiguredRules (rawConfigs) {
  /** @type {Map<string, 'warn' | 'error'>} */
  const configured = new Map();

  for (const configObj of rawConfigs) {
    const rules = /** @type {Record<string, unknown> | undefined} */ (
      /** @type {Record<string, unknown>} */ (configObj || {})['rules']
    );
    if (!rules) continue;

    for (const [ruleName, ruleConfig] of Object.entries(rules)) {
      const level = Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
      const severity = LEVEL_TO_SEVERITY[/** @type {import('eslint').Linter.RuleSeverity} */ (level)];

      if (severity) {
        configured.set(ruleName, severity);
      }
    }
  }

  return configured;
}

/**
 * Collect plugin names from raw flat config array
 *
 * @param {unknown[]} rawConfigs
 * @returns {string[]}
 */
function collectPluginNames (rawConfigs) {
  /** @type {Set<string>} */
  const names = new Set();

  for (const configObj of rawConfigs) {
    const plugins = /** @type {Record<string, unknown> | undefined} */ (
      /** @type {Record<string, unknown>} */ (configObj || {})['plugins']
    );
    if (!plugins) continue;

    for (const name of Object.keys(plugins)) {
      names.add(name);
    }
  }

  return [...names].sort();
}

/**
 * Audit a single ESLint flat config for deprecated rules and coverage
 *
 * @param {unknown[]} rawConfigs - The raw flat config array
 * @returns {AuditResult}
 */
export function auditConfig (rawConfigs) {
  const configuredRules = collectConfiguredRules(rawConfigs);
  const pluginNames = collectPluginNames(rawConfigs);

  /** @type {DeprecatedRuleInfo[]} */
  const deprecatedRules = [];

  /** @type {UnconfiguredRuleInfo[]} */
  const unconfiguredBuiltins = [];

  let totalBuiltinsActive = 0;

  // Check builtin rules
  for (const [ruleName, rule] of builtinRules) {
    const deprecated = rule.meta?.deprecated;
    const isConfigured = configuredRules.has(ruleName);

    if (deprecated) {
      // If configured and deprecated, report it
      if (isConfigured) {
        /** @type {Array<{ ruleId?: string | undefined, pluginName?: string | undefined, message?: string | undefined, url?: string | undefined }>} */
        const replacedBy = [];

        if (typeof deprecated === 'object' && Array.isArray(deprecated.replacedBy)) {
          for (const replacement of deprecated.replacedBy) {
            replacedBy.push({
              ruleId: /** @type {string | undefined} */ (replacement.rule?.name),
              pluginName: /** @type {string | undefined} */ (replacement.plugin?.name),
              message: /** @type {string | undefined} */ (replacement.message),
              url: /** @type {string | undefined} */ (replacement.url),
            });
          }
        }

        deprecatedRules.push({
          ruleName,
          severity: /** @type {'warn' | 'error'} */ (configuredRules.get(ruleName) || 'error'),
          replacedBy,
          docUrl: rule.meta?.docs?.url,
          deprecatedSince: typeof deprecated === 'object' ? deprecated.deprecatedSince ?? undefined : undefined,
          availableUntil: typeof deprecated === 'object' ? deprecated.availableUntil ?? undefined : undefined,
        });
      }
      // Don't count deprecated rules as "active" unconfigured
    } else {
      totalBuiltinsActive++;
      if (!isConfigured) {
        unconfiguredBuiltins.push({
          ruleName,
          docUrl: rule.meta?.docs?.url,
          isRecommended: rule.meta?.docs?.recommended === true,
        });
      }
    }
  }

  // Sort results
  deprecatedRules.sort((a, b) => a.ruleName.localeCompare(b.ruleName));
  unconfiguredBuiltins.sort((a, b) => {
    // Recommended first, then alphabetical
    if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
    return a.ruleName.localeCompare(b.ruleName);
  });

  return {
    deprecatedRules,
    unconfiguredBuiltins,
    stats: {
      totalConfigured: configuredRules.size,
      totalDeprecated: deprecatedRules.length,
      totalBuiltins: builtinRules.size,
      totalBuiltinsActive,
      totalBuiltinsUnconfigured: unconfiguredBuiltins.length,
      pluginNames,
    },
  };
}
