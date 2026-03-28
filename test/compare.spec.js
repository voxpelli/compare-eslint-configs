import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { compareConfigs } from '../lib/compare.js';

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
});
