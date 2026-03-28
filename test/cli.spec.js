import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, '../cli.js');
const fixture = (/** @type {string} */ name) => path.join(__dirname, 'data', name);

describe('CLI', () => {
  it('should show help with --help', async () => {
    const { stdout } = await execFileAsync('node', [cliPath, '--help']);
    assert.ok(stdout.includes('compare'));
    assert.ok(stdout.includes('diff'));
    assert.ok(stdout.includes('summary'));
    assert.ok(stdout.includes('inspect'));
  });

  it('should run inspect command on a fixture', async () => {
    const { stdout } = await execFileAsync('node', [cliPath, 'inspect', fixture('base.eslint.config.js')]);
    assert.ok(stdout.includes('base'));
    assert.ok(stdout.includes('Rules:'));
  });

  it('should exit with error for missing config file', async () => {
    await assert.rejects(
      () => execFileAsync('node', [cliPath, 'inspect', fixture('nonexistent.js')]),
      (/** @type {Error & { code?: number }} */ err) => {
        assert.ok(err.code !== 0 || err.message.includes('InputError'));
        return true;
      }
    );
  });
});
