import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { auditConfig } from '../lib/audit.js';

describe('auditConfig', () => {
  it('should return empty results for empty config', () => {
    const result = auditConfig([]);
    assert.strictEqual(result.deprecatedRules.length, 0);
    assert.ok(result.unconfiguredBuiltins.length > 0);
    assert.strictEqual(result.stats.totalConfigured, 0);
    assert.ok(result.stats.totalBuiltins > 200);
  });

  it('should detect configured rules', () => {
    const result = auditConfig([{
      rules: { 'no-console': 'warn', 'no-unused-vars': 'error' },
    }]);
    assert.strictEqual(result.stats.totalConfigured, 2);
  });

  it('should detect deprecated rules with replacedBy', () => {
    // no-extra-semi is deprecated in ESLint 9 with @stylistic replacement
    const result = auditConfig([{
      rules: { 'no-extra-semi': 'error' },
    }]);
    const deprecated = result.deprecatedRules.find(r => r.ruleName === 'no-extra-semi');
    assert.ok(deprecated, 'no-extra-semi should be detected as deprecated');
    assert.strictEqual(deprecated.severity, 'error');
    assert.ok(deprecated.replacedBy.length > 0, 'should have replacedBy entries');
  });

  it('should not include deprecated rules in unconfigured list', () => {
    const result = auditConfig([]);
    const depNames = new Set(result.unconfiguredBuiltins.map(r => r.ruleName));
    // no-extra-semi is deprecated, should NOT be in unconfigured
    assert.ok(!depNames.has('no-extra-semi'));
  });

  it('should mark recommended rules', () => {
    const result = auditConfig([]);
    const recommended = result.unconfiguredBuiltins.filter(r => r.isRecommended);
    assert.ok(recommended.length > 0, 'should have some recommended unconfigured rules');
  });

  it('should skip off rules', () => {
    const result = auditConfig([{
      rules: { 'no-console': 'off' },
    }]);
    assert.strictEqual(result.stats.totalConfigured, 0);
  });

  it('should detect plugin names', () => {
    const result = auditConfig([{
      plugins: { unicorn: {}, n: {} },
      rules: { 'no-console': 'error' },
    }]);
    assert.deepStrictEqual(result.stats.pluginNames, ['n', 'unicorn']);
  });

  it('should detect deprecated plugin rules', () => {
    const fakePlugin = {
      rules: {
        'old-rule': {
          meta: {
            deprecated: {
              message: 'Use new-rule instead',
              replacedBy: [{ rule: { name: 'new-rule' }, message: 'Use new-rule instead' }],
              deprecatedSince: 'v1.0.0',
            },
            docs: { url: 'https://example.com/old-rule' },
          },
          create () { return {}; },
        },
      },
    };
    const result = auditConfig([{
      plugins: { fake: fakePlugin },
      rules: { 'fake/old-rule': 'warn' },
    }]);
    const deprecated = result.deprecatedRules.find(r => r.ruleName === 'fake/old-rule');
    assert.ok(deprecated, 'fake/old-rule should be detected as deprecated');
    assert.strictEqual(deprecated.severity, 'warn');
    assert.strictEqual(deprecated.deprecatedSince, 'v1.0.0');
    assert.ok(deprecated.replacedBy.length > 0, 'should have replacedBy entries');
    assert.strictEqual(deprecated.replacedBy[0]?.ruleId, 'new-rule');
  });

  it('should not flag non-deprecated plugin rules', () => {
    const fakePlugin = {
      rules: {
        'ok-rule': {
          meta: { docs: {} },
          create () { return {}; },
        },
      },
    };
    const result = auditConfig([{
      plugins: { fake: fakePlugin },
      rules: { 'fake/ok-rule': 'error' },
    }]);
    assert.ok(!result.deprecatedRules.some(r => r.ruleName === 'fake/ok-rule'));
  });

  it('should include both builtin and plugin deprecated in totalDeprecated', () => {
    const fakePlugin = {
      rules: {
        'old-rule': {
          meta: { deprecated: { replacedBy: [] } },
          create () { return {}; },
        },
      },
    };
    const result = auditConfig([{
      plugins: { fake: fakePlugin },
      rules: {
        'no-return-await': 'warn',
        'fake/old-rule': 'warn',
      },
    }]);
    assert.strictEqual(result.stats.totalDeprecated, 2);
    assert.ok(result.deprecatedRules.some(r => r.ruleName === 'no-return-await'));
    assert.ok(result.deprecatedRules.some(r => r.ruleName === 'fake/old-rule'));
  });
});
