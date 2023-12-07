/**
 * @template {keyof any} Keys
 * @template Values
 * @param {Keys[]} keys
 * @param {Values[]} values
 * @returns {Record<Keys, Values>}
 */
export function zipObject (keys, values) {
  /** @type {Partial<Record<Keys, Values>>} */
  const result = {};

  for (const [i, key] of keys.entries()) {
    result[key] = values[i];
  }

  return /** @type {Record<Keys, Values>} */ (result);
}

/**
 * @param {string[]} ruleNames
 * @returns {string[]}
 */
function sortRulesByName (ruleNames) {
  return ruleNames.sort((ruleNameA, ruleNameB) => {
    const [ruleOrPluginA, pluginRuleA] = ruleNameA.split('/');
    const [ruleOrPluginB, pluginRuleB] = ruleNameB.split('/');

    if (pluginRuleA && pluginRuleB) {
      if (ruleOrPluginA === ruleOrPluginB) {
        return pluginRuleA < pluginRuleB ? -1 : 1;
      }
      return (ruleOrPluginA || '') < (ruleOrPluginB || '') ? -1 : 1;
    }

    if (pluginRuleA || pluginRuleB) {
      return pluginRuleA ? 1 : -1;
    }

    return (ruleOrPluginA || '') < (ruleOrPluginB || '') ? -1 : 1;
  });
}

/**
 * @template T
 * @param {{ [configName: string]: T }} ruleCollection
 * @returns {{ [configName: string]: T }}
 */
export function sortRuleCollectionByName (ruleCollection) {
  return zipObject(sortRulesByName(Object.keys(ruleCollection)), Object.values(ruleCollection));
}
