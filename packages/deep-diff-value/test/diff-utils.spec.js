import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getDeepDifference } from '@voxpelli/deep-diff-value';

describe('getDeepDifference', () => {
  it('should return undefined for equal primitives', () => {
    assert.strictEqual(getDeepDifference(1, 1), undefined);
    assert.strictEqual(getDeepDifference('a', 'a'), undefined);
    assert.strictEqual(getDeepDifference(true, true), undefined);
  });

  it('should return valueB for different primitives', () => {
    assert.strictEqual(getDeepDifference(1, 2), 2);
    assert.strictEqual(getDeepDifference('a', 'b'), 'b');
  });

  it('should return undefined for deeply equal objects', () => {
    assert.strictEqual(
      getDeepDifference({ a: 1, b: 2 }, { a: 1, b: 2 }),
      undefined
    );
  });

  it('should return only changed keys for plain objects', () => {
    const result = getDeepDifference({ a: 1, b: 2 }, { a: 1, b: 3 });
    assert.deepStrictEqual(result, { b: 3 });
  });

  it('should handle nested objects', () => {
    const result = getDeepDifference(
      { a: { x: 1, y: 2 } },
      { a: { x: 1, y: 3 } }
    );
    assert.deepStrictEqual(result, { a: { y: 3 } });
  });

  it('should return valueB when types differ (primitive vs object)', () => {
    assert.deepStrictEqual(
      getDeepDifference(/** @type {any} */ ('string'), /** @type {any} */ ({ a: 1 })),
      { a: 1 }
    );
  });

  it('should return valueB when types differ (primitive vs array)', () => {
    assert.deepStrictEqual(
      getDeepDifference(/** @type {any} */ ('string'), /** @type {any} */ ([1, 2])),
      [1, 2]
    );
  });

  it('should return undefined for equal arrays', () => {
    assert.strictEqual(
      getDeepDifference([1, 2, 3], [1, 2, 3]),
      undefined
    );
  });

  it('should detect changed array elements', () => {
    const result = getDeepDifference(
      ['always'],
      ['never']
    );
    assert.deepStrictEqual(result, ['never']);
  });

  it('should return undefined for deeply equal arrays of objects', () => {
    assert.strictEqual(
      getDeepDifference(
        [{ a: 1 }, { b: 2 }],
        [{ a: 1 }, { b: 2 }]
      ),
      undefined
    );
  });

  it('should handle added keys in valueB object', () => {
    const result = getDeepDifference({ a: 1 }, { a: 1, b: 2 });
    assert.deepStrictEqual(result, { b: 2 });
  });

  it('should not detect removed keys (only checks valueB keys)', () => {
    const result = getDeepDifference({ a: 1, b: 2 }, { a: 1 });
    assert.strictEqual(result, undefined);
  });

  it('should handle undefined valueA', () => {
    assert.strictEqual(getDeepDifference(/** @type {any} */ (undefined), /** @type {any} */ ('hello')), 'hello');
    assert.deepStrictEqual(getDeepDifference(/** @type {any} */ (undefined), /** @type {any} */ ({ a: 1 })), { a: 1 });
  });
});
