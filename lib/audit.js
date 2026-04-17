import { builtinRules } from 'eslint/use-at-your-own-risk';
import {
  getStringValueByPath,
  hasOwn,
  isKeyWithType,
  isObject,
  isObjectWithKey,
  typesafeIsArray,
} from '@voxpelli/typed-utils';

/**
 * @typedef DeprecatedReplacedBy
 * @property {string | undefined} [ruleId]
 * @property {string | undefined} [pluginName]
 * @property {string | undefined} [message]
 * @property {string | undefined} [url]
 */

/**
 * @typedef DeprecatedRuleInfo
 * @property {string} ruleName
 * @property {'warn' | 'error'} severity
 * @property {DeprecatedReplacedBy[]} replacedBy
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
 * @typedef AuditContext
 * @property {Map<string, 'warn' | 'error'>} configuredRules
 * @property {string[]} pluginNames
 * @property {Map<string, Record<string, unknown>>} pluginRuleMeta
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
    const rules = isObjectWithKey(configObj, 'rules') && isObject(configObj['rules'])
      ? configObj['rules']
      : {};

    for (const [ruleName, ruleConfig] of Object.entries(rules)) {
      const level = typesafeIsArray(ruleConfig) ? ruleConfig[0] : ruleConfig;
      const severity = hasOwn(LEVEL_TO_SEVERITY, level) && LEVEL_TO_SEVERITY[level];

      if (severity) {
        configured.set(ruleName, severity);
      } else if (hasOwn(LEVEL_TO_SEVERITY, level)) {
        configured.delete(ruleName);
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
    const plugins = isObjectWithKey(configObj, 'plugins') && isObject(configObj['plugins'])
      ? configObj['plugins']
      : {};

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
 * @returns {Map<string, Record<string, unknown>>}
 */
function collectPluginRuleMeta (rawConfigs) {
  /** @type {Map<string, Record<string, unknown>>} */
  const result = new Map();

  for (const configObj of rawConfigs) {
    const plugins = isObjectWithKey(configObj, 'plugins') && isObject(configObj['plugins'])
      ? configObj['plugins']
      : {};

    for (const [prefix, plugin] of Object.entries(plugins)) {
      const rules = isObjectWithKey(plugin, 'rules') && isObject(plugin['rules'])
        ? plugin['rules']
        : {};

      for (const [ruleName, rule] of Object.entries(rules)) {
        if (isObjectWithKey(rule, 'meta') && isObject(rule.meta)) {
          result.set(`${prefix}/${ruleName}`, rule.meta);
        }
      }
    }
  }

  return result;
}

/**
 * Build a DeprecatedRuleInfo from pre-extracted metadata fields.
 * Returns undefined when the rule is not deprecated or not configured.
 *
 * `deprecated` is polymorphic: ESLint's core rules type it as
 * `boolean | DeprecatedInfo | undefined`, while plugin rules supply `unknown`.
 * The helper narrows with runtime guards instead of a typed contract.
 *
 * @param {string} ruleName
 * @param {unknown} deprecated
 * @param {string | undefined} docUrl
 * @param {Map<string, 'warn' | 'error'>} configuredRules
 * @returns {DeprecatedRuleInfo | undefined}
 */
function buildDeprecatedRuleInfo (ruleName, deprecated, docUrl, configuredRules) {
  if (!deprecated) return;
  if (!configuredRules.has(ruleName)) return;

  /** @type {DeprecatedRuleInfo['replacedBy']} */
  const replacedBy = [];

  if (isKeyWithType(deprecated, 'replacedBy', 'array')) {
    for (const replacement of deprecated['replacedBy']) {
      replacedBy.push({
        ruleId: getStringValueByPath(replacement, ['rule', 'name']) || undefined,
        pluginName: getStringValueByPath(replacement, ['plugin', 'name']) || undefined,
        message: getStringValueByPath(replacement, ['message']) || undefined,
        url: getStringValueByPath(replacement, ['url']) || undefined,
      });
    }
  }

  return {
    ruleName,
    severity: configuredRules.get(ruleName) || 'error',
    replacedBy,
    docUrl,
    deprecatedSince: isKeyWithType(deprecated, 'deprecatedSince', 'string') ? deprecated['deprecatedSince'] : undefined,
    availableUntil: isKeyWithType(deprecated, 'availableUntil', 'string') ? deprecated['availableUntil'] : undefined,
  };
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
    const info = buildDeprecatedRuleInfo(ruleName, rule.meta?.deprecated, rule.meta?.docs?.url, configuredRules);
    if (info) results.push(info);
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

  for (const [fullRuleName, meta] of pluginRuleMeta) {
    const docUrl = getStringValueByPath(meta, ['docs', 'url']) || undefined;
    const info = buildDeprecatedRuleInfo(fullRuleName, meta['deprecated'], docUrl, configuredRules);
    if (info) results.push(info);
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
