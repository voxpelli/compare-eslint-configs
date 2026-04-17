import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveInspectInput } from '../lib/flags/inspect-input.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (/** @type {string} */ name) => path.join(__dirname, 'data', name);

describe('resolveInspectInput', () => {
  it('should load a flat config array from a fixture file', async () => {
    const result = await resolveInspectInput({}, fixture('base.eslint.config.js'));
    assert.ok(Array.isArray(result.rawConfigs));
    assert.strictEqual(result.rawConfigs.length, 1);
  });

  it('should throw InputError for a missing file', async () => {
    await assert.rejects(
      () => resolveInspectInput({}, fixture('nonexistent.eslint.config.js')),
      { name: 'InputError' }
    );
  });

  it('should throw InputError when file does not export an array', async () => {
    await assert.rejects(
      () => resolveInspectInput({}, fixture('not-an-array.eslint.config.js')),
      { name: 'InputError' }
    );
  });
});
