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
 * @template {Record<string,any>} Obj
 * @template Value
 * @param {Obj} obj
 * @param {(value: Obj[key], key: keyof Obj) => Value} callback
 * @returns {Record<keyof Obj, Value>}
 */
export function mapObject (obj, callback) {
  /** @type {(keyof Obj)[]} */
  const keys = [];

  /** @type {Value[]} */
  const values = [];

  for (const [key, value] of Object.entries(obj)) {
    keys.push(key);
    values.push(callback(value, key));
  }

  return zipObject(keys, values);
}
