import { filter, isUnknownArray } from '@voxpelli/typed-utils';
import equal from 'fast-deep-equal';
import isPlainObject from 'is-plain-obj';

/**
 * @param {unknown} value
 * @returns {value is Record<PropertyKey, unknown>}
 */
function improvedIsPlainObject (value) {
  return isPlainObject(value);
}

/**
 * @template ValueA
 * @template {ValueA | import('../advanced-types.js').DeepPartial<ValueA>} ValueB
 * @param {ValueA | undefined} valueA
 * @param {ValueB | undefined} valueB
 * @param {number} depth
 * @returns {ValueB | import('../advanced-types.js').DeepPartial<ValueB> | undefined}
 */
function innerGetDeepDifference (valueA, valueB, depth) {
  if (valueA === valueB || equal(valueA, valueB)) {
    return;
  }

  if (depth > 20) {
    throw new Error('Too deep difference calculation');
  }

  if (isUnknownArray(valueB)) {
    if (!isUnknownArray(valueA)) {
      return valueB;
    }

    const result = filter(
      valueB.map((value, i) => innerGetDeepDifference(valueA[i], value, depth + 1))
    );

    if (result.length === 0) {
      return;
    }

    return /** @type {import('../advanced-types.js').DeepPartial<ValueB & unknown[]>} */ (result);
  }

  if (improvedIsPlainObject(valueB)) {
    if (!improvedIsPlainObject(valueA)) {
      return valueB;
    }

    const difference = Object.entries(valueB)
      .map(
        /**
         * @param {[PropertyKey, unknown]} value
         * @returns {[PropertyKey, unknown]|undefined}
         */
        ([key, value]) => {
          const valueFromValueA = valueA[key];

          const innerDifference = innerGetDeepDifference(valueFromValueA, value, depth + 1);

          return innerDifference ? [key, innerDifference] : undefined;
        }
      );

    const filteredDifference = filter(difference);

    const result = Object.fromEntries(filteredDifference);

    if (Object.keys(result).length === 0) {
      return;
    }

    return /** @type {import('../advanced-types.js').DeepPartial<ValueB & Record<PropertyKey, unknown>>} */ (result);
  }

  return valueB;
}

/**
 * @template ValueA
 * @template {ValueA | import('../advanced-types.js').DeepPartial<ValueA>} ValueB
 * @param {ValueA | undefined} valueA
 * @param {ValueB | undefined} valueB
 * @returns {ValueB | import('../advanced-types.js').DeepPartial<ValueB> | undefined}
 */
export function getDeepDifference (valueA, valueB) {
  return innerGetDeepDifference(valueA, valueB, 0);
}
