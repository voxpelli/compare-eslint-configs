import { isObject } from '@voxpelli/typed-utils';

/**
 * @param {unknown} schema
 * @returns {object|undefined}
 */
export function getRuleOptionsSchema (schema) {
  if (Array.isArray(schema)) {
    if (schema.length) {
      return {
        type: 'array',
        items: schema,
        minItems: 0,
        maxItems: schema.length,
      };
    }
    return {
      type: 'array',
      minItems: 0,
      maxItems: 0,
    };
  }

  return isObject(schema) ? schema : undefined;
}
