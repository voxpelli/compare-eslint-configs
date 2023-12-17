/**
 * @template {keyof any} Keys
 * @template Values
 * @param {Keys[]|ReadonlyArray<Keys>} keys
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
 * @template T
 * @template {keyof T} K
 * @param {T} input
 * @param {K[]|ReadonlyArray<K>} keys
 * @returns {Readonly<Pick<T, K>>}
 */
export function pick (input, keys) {
  /** @type {Partial<Pick<T, K>>} */
  const result = {};
  for (const key of keys) {
    result[key] = input[key];
  }
  return /** @type {Pick<T, K>} */ (result);
}

/**
 * @template T
 * @template {keyof T} K
 * @param {T} input
 * @param {K[]} keys
 * @returns {{ picked: Readonly<Pick<T, K>>, pickedKeys: ReadonlyArray<K> }}
 */
export function pickWithKeys (input, keys) {
  return {
    picked: pick(input, keys),
    pickedKeys: keys,
  };
}

/**
 * @template T
 * @param {{ [configName: string]: T }} ruleCollection
 * @returns {{ [configName: string]: T }}
 */
export function sortRulesByName (ruleCollection) {
  return Object.fromEntries(Object.entries(ruleCollection).sort(([ruleNameA], [ruleNameB]) => {
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
  }));
}
