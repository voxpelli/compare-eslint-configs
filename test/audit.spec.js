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
});
