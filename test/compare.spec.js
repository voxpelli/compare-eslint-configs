import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { compareConfigs, diffConfigs, summarizeConfigs } from '../lib/compare.js';

const makeConfig = (/** @type {Record<string, unknown>} */ rules) => /** @type {any} */ ({
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

const makeConfigWithMeta = (/** @type {Record<string, unknown>} */ rules, meta = {}) => /** @type {any} */ ({
  config: { rules },
  engine: { getRulesMetaForResults: () => meta },
});

describe('diffConfigs', () => {
  const diffOpts = { targetFile: '', verbose: false };

  it('should detect added rules', () => {
    const result = diffConfigs(
      { configName: 'target', config: makeConfig({ 'no-console': 'warn' }) },
      { configName: 'source', config: makeConfig({ 'no-console': 'warn', 'prefer-const': 'error' }) },
      diffOpts
    );
    assert.notStrictEqual(result, false);
    assert.ok(result);
    assert.strictEqual(result.added['prefer-const']?.severity, 'error');
  });

  it('should detect removed rules', () => {
    const result = diffConfigs(
      { configName: 'target', config: makeConfig({ 'no-console': 'warn', 'prefer-const': 'error' }) },
      { configName: 'source', config: makeConfig({ 'no-console': 'warn' }) },
      diffOpts
    );
    assert.notStrictEqual(result, false);
    assert.ok(result);
    assert.ok(result.removed['prefer-const']);
  });

  it('should detect changed severity', () => {
    const result = diffConfigs(
      { configName: 'target', config: makeConfig({ 'no-console': 'warn' }) },
      { configName: 'source', config: makeConfig({ 'no-console': 'error' }) },
      diffOpts
    );
    assert.notStrictEqual(result, false);
    assert.ok(result);
    assert.ok(result.changedSeverity['no-console']);
  });

  it('should return false when configs are identical', () => {
    const result = diffConfigs(
      { configName: 'target', config: makeConfig({ 'no-console': 'error' }) },
      { configName: 'source', config: makeConfig({ 'no-console': 'error' }) },
      diffOpts
    );
    assert.strictEqual(result, false);
  });

  it('should handle numeric severity levels', () => {
    const result = diffConfigs(
      { configName: 'target', config: makeConfig({ 'no-console': 1 }) },
      { configName: 'source', config: makeConfig({ 'no-console': 2 }) },
      diffOpts
    );
    assert.notStrictEqual(result, false);
    assert.ok(result);
    assert.ok(result.changedSeverity['no-console']);
  });

  it('should propagate deprecated metadata', () => {
    const result = diffConfigs(
      { configName: 'target', config: makeConfigWithMeta({ 'old-rule': 'error' }, { 'old-rule': { deprecated: true } }) },
      { configName: 'source', config: makeConfigWithMeta({ 'old-rule': 'error', 'extra-rule': 'warn' }, { 'old-rule': { deprecated: true } }) },
      diffOpts
    );
    assert.notStrictEqual(result, false);
    assert.ok(result);
    assert.strictEqual(result.deprecated['old-rule'], true);
  });
});
