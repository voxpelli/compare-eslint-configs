import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import { findDefaultConfig } from '../lib/flags/input.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

describe('findDefaultConfig', () => {
  it('should find eslint.config.js in the project root', async () => {
    const result = await findDefaultConfig(projectRoot);
    assert.strictEqual(result, 'eslint.config.js');
  });

  it('should throw InputError when no config found', async () => {
    const emptyDir = await mkdtemp(path.join(tmpdir(), 'test-'));
    try {
      await assert.rejects(
        () => findDefaultConfig(emptyDir),
        { name: 'InputError' }
      );
    } finally {
      await rmdir(emptyDir);
    }
  });
});
