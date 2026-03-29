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

describe('CLI: audit command', () => {
  it('should show help with --help', async () => {
    const { stdout } = await execFileAsync('node', [cliPath, 'audit', '--help']);
    assert.ok(stdout.includes('deprecated'));
    assert.ok(stdout.includes('--show-unconfigured'));
  });

  it('should audit a config with deprecated rules', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'audit', fixture('deprecated.eslint.config.js'),
    ]);
    assert.ok(stdout.includes('no-return-await'));
    assert.ok(stdout.includes('Deprecated') || stdout.includes('deprecated'));
  });

  it('should output JSON with --json', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'audit', '--json', fixture('deprecated.eslint.config.js'),
    ]);
    const parsed = JSON.parse(stdout);
    assert.ok(parsed.deprecatedRules);
    assert.ok(parsed.stats);
  });

  it('should exit 1 with --exit-code when deprecated rules exist', async () => {
    await assert.rejects(
      () => execFileAsync('node', [
        cliPath, 'audit', '-e', fixture('deprecated.eslint.config.js'),
      ]),
      (/** @type {Error & { code?: number }} */ err) => {
        assert.strictEqual(err.code, 1);
        return true;
      }
    );
  });

  it('should auto-detect config when no arg given', async () => {
    const { stdout } = await execFileAsync('node', [cliPath, 'audit']);
    assert.ok(stdout.includes('Coverage') || stdout.includes('Configured'));
  });
});
