import { builtinRules } from 'eslint/use-at-your-own-risk';
import { getStringValueByPath, isKeyWithType, isObject, isObjectWithKey, typesafeIsArray } from '@voxpelli/typed-utils';

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
 * @property {number} totalBuiltinsConfigured
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

/**
 * @typedef PluginRuleMeta
 * @property {Record<string, unknown>} meta
 * @property {string} pluginName
 */

/**
 * @typedef AuditContext
 * @property {Map<string, 'warn' | 'error'>} configuredRules
 * @property {string[]} pluginNames
 * @property {Map<string, PluginRuleMeta>} pluginRuleMeta
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
    const rules = isObjectWithKey(configObj, 'rules') && configObj['rules'];
    if (!isObject(rules)) continue;

    for (const [ruleName, ruleConfig] of Object.entries(rules)) {
      const level = typesafeIsArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
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
    const plugins = isObjectWithKey(configObj, 'plugins') && configObj['plugins'];
    if (!isObject(plugins)) continue;

    for (const name of Object.keys(plugins)) {
      names.add(name);
    }
  }

  return [...names].sort();
}

/**
 * Collect rule metadata from all plugins in the raw flat config array
 *
 * @param {unknown[]} rawConfigs
 * @returns {Map<string, PluginRuleMeta>}
 */
function collectPluginRuleMeta (rawConfigs) {
  /** @type {Map<string, PluginRuleMeta>} */
  const result = new Map();

  for (const configObj of rawConfigs) {
    const plugins = isObjectWithKey(configObj, 'plugins') && configObj['plugins'];
    if (!isObject(plugins)) continue;

    for (const [prefix, plugin] of Object.entries(plugins)) {
      const rules = isObjectWithKey(plugin, 'rules') && plugin['rules'];
      if (!isObject(rules)) continue;

      for (const [ruleName, rule] of Object.entries(rules)) {
        const meta = isObjectWithKey(rule, 'meta') && rule['meta'];
        if (!isObject(meta)) continue;
        result.set(`${prefix}/${ruleName}`, { meta, pluginName: prefix });
      }
    }
  }

  return result;
}

/**
 * Check for configured builtin rules that are deprecated
 *
 * @param {AuditContext} context
 * @returns {DeprecatedRuleInfo[]}
 */
function checkDeprecatedBuiltins ({ configuredRules }) {
  /** @type {DeprecatedRuleInfo[]} */
  const results = [];

  for (const [ruleName, rule] of builtinRules) {
    const deprecated = rule.meta?.deprecated;
    if (!deprecated) continue;
    if (!configuredRules.has(ruleName)) continue;

    /** @type {DeprecatedRuleInfo['replacedBy']} */
    const replacedBy = [];

    if (typeof deprecated === 'object' && Array.isArray(deprecated.replacedBy)) {
      for (const replacement of deprecated.replacedBy) {
        replacedBy.push({
          ruleId: replacement.rule?.name,
          pluginName: replacement.plugin?.name,
          message: replacement.message,
          url: replacement.url,
        });
      }
    }

    results.push({
      ruleName,
      severity: configuredRules.get(ruleName) || 'error',
      replacedBy,
      docUrl: rule.meta?.docs?.url,
      deprecatedSince: typeof deprecated === 'object' ? deprecated.deprecatedSince ?? undefined : undefined,
      availableUntil: typeof deprecated === 'object' ? deprecated.availableUntil ?? undefined : undefined,
    });
  }

  return results;
}

/**
 * Check for configured plugin rules that are deprecated
 *
 * @param {AuditContext} context
 * @returns {DeprecatedRuleInfo[]}
 */
function checkDeprecatedPluginRules ({ configuredRules, pluginRuleMeta }) {
  /** @type {DeprecatedRuleInfo[]} */
  const results = [];

  for (const [fullRuleName, { meta }] of pluginRuleMeta) {
    const deprecated = meta['deprecated'];
    if (!deprecated) continue;
    if (!configuredRules.has(fullRuleName)) continue;

    /** @type {DeprecatedRuleInfo['replacedBy']} */
    const replacedBy = [];

    if (isKeyWithType(deprecated, 'replacedBy', 'array')) {
      for (const replacement of deprecated['replacedBy']) {
        const replacementRule = isObjectWithKey(replacement, 'rule') && replacement['rule'];
        const replacementPlugin = isObjectWithKey(replacement, 'plugin') && replacement['plugin'];
        replacedBy.push({
          ruleId: isKeyWithType(replacementRule, 'name', 'string') ? replacementRule['name'] : undefined,
          pluginName: isKeyWithType(replacementPlugin, 'name', 'string') ? replacementPlugin['name'] : undefined,
          message: isKeyWithType(replacement, 'message', 'string') ? replacement['message'] : undefined,
          url: isKeyWithType(replacement, 'url', 'string') ? replacement['url'] : undefined,
        });
      }
    }

    results.push({
      ruleName: fullRuleName,
      severity: configuredRules.get(fullRuleName) || 'error',
      replacedBy,
      docUrl: getStringValueByPath(meta, ['docs', 'url']) || undefined,
      deprecatedSince: isKeyWithType(deprecated, 'deprecatedSince', 'string') ? deprecated['deprecatedSince'] : undefined,
      availableUntil: isKeyWithType(deprecated, 'availableUntil', 'string') ? deprecated['availableUntil'] : undefined,
    });
  }

  return results;
}

/**
 * Check for non-deprecated builtin rules that are not configured
 *
 * @param {AuditContext} context
 * @returns {{ unconfiguredBuiltins: UnconfiguredRuleInfo[], totalBuiltinsActive: number }}
 */
function checkUnconfiguredBuiltins ({ configuredRules }) {
  /** @type {UnconfiguredRuleInfo[]} */
  const unconfiguredBuiltins = [];
  let totalBuiltinsActive = 0;

  for (const [ruleName, rule] of builtinRules) {
    if (rule.meta?.deprecated) continue;

    totalBuiltinsActive++;

    if (!configuredRules.has(ruleName)) {
      unconfiguredBuiltins.push({
        ruleName,
        docUrl: rule.meta?.docs?.url,
        isRecommended: rule.meta?.docs?.recommended === true,
      });
    }
  }

  unconfiguredBuiltins.sort((a, b) => {
    if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
    return a.ruleName.localeCompare(b.ruleName);
  });

  return { unconfiguredBuiltins, totalBuiltinsActive };
}

/**
 * Audit a single ESLint flat config for deprecated rules and coverage
 *
 * @param {unknown[]} rawConfigs - The raw flat config array
 * @returns {AuditResult}
 */
export function auditConfig (rawConfigs) {
  /** @type {AuditContext} */
  const context = {
    configuredRules: collectConfiguredRules(rawConfigs),
    pluginNames: collectPluginNames(rawConfigs),
    pluginRuleMeta: collectPluginRuleMeta(rawConfigs),
  };

  const deprecatedRules = [
    ...checkDeprecatedBuiltins(context),
    ...checkDeprecatedPluginRules(context),
  ];
  deprecatedRules.sort((a, b) => a.ruleName.localeCompare(b.ruleName));

  const { totalBuiltinsActive, unconfiguredBuiltins } = checkUnconfiguredBuiltins(context);

  return {
    deprecatedRules,
    unconfiguredBuiltins,
    stats: {
      totalConfigured: context.configuredRules.size,
      totalBuiltinsConfigured: [...context.configuredRules.keys()].filter(name => !name.includes('/')).length,
      totalDeprecated: deprecatedRules.length,
      totalBuiltins: builtinRules.size,
      totalBuiltinsActive,
      totalBuiltinsUnconfigured: unconfiguredBuiltins.length,
      pluginNames: context.pluginNames,
    },
  };
}
