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
