import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { compareConfigs, summarizeConfigs } from '../lib/compare.js';

/** @param {Record<string, unknown>} rules */
const makeConfig = (rules) => /** @type {any} */ ({
  config: { rules },
  engine: { getRulesMetaForResults: () => ({}) },
});

describe('summarizeConfigs', () => {
  it('should extract rules from a config', () => {
    const result = summarizeConfigs({
      base: makeConfig({ 'no-console': 'warn', 'no-unused-vars': 'error' }),
    });
    assert.deepStrictEqual(result['no-console']?.warn, ['base']);
    assert.deepStrictEqual(result['no-unused-vars']?.error, ['base']);
  });

  it('should skip disabled rules', () => {
    const result = summarizeConfigs({
      base: makeConfig({ 'no-console': 'off' }),
    });
    assert.strictEqual(result['no-console'], undefined);
  });
});

describe('compareConfigs', () => {
  it('should return empty diff for empty configs', () => {
    const differences = compareConfigs({});
    assert.deepStrictEqual(differences, {
      onlyActiveIn: {},
      mixedSeverity: {},
      mixedConfigs: {},
      ruleDocs: {},
      deprecated: {},
    });
  });

  it('should detect rules only active in one config', () => {
    const result = compareConfigs({
      a: makeConfig({ 'no-console': 'error', 'prefer-const': 'error' }),
      b: makeConfig({ 'no-console': 'error' }),
    });
    assert.deepStrictEqual(result.onlyActiveIn['prefer-const'], ['a']);
    assert.strictEqual(result.onlyActiveIn['no-console'], undefined);
  });

  it('should detect mixed severity', () => {
    const result = compareConfigs({
      strict: makeConfig({ 'no-console': 'error' }),
      lenient: makeConfig({ 'no-console': 'warn' }),
    });
    assert.deepStrictEqual(result.mixedSeverity['no-console']?.error, ['strict']);
    assert.deepStrictEqual(result.mixedSeverity['no-console']?.warn, ['lenient']);
  });
});
