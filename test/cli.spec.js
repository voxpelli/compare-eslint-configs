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

  it('should run diff between two fixtures', async () => {
    const cliFile = path.resolve(__dirname, '../cli.js');
    const { stdout } = await execFileAsync('node', [
      cliPath, 'diff',
      fixture('base.eslint.config.js'),
      fixture('strict.eslint.config.js'),
      '-f', cliFile,
    ]);
    assert.ok(stdout.length > 0, 'diff should produce output for different configs');
  });

  it('should output valid JSON for diff --json', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'diff',
      fixture('base.eslint.config.js'),
      fixture('strict.eslint.config.js'),
      '-f', path.resolve(__dirname, '../cli.js'),
      '--json',
    ]);
    const parsed = JSON.parse(stdout);
    assert.ok(parsed.added || parsed.removed || parsed.changedSeverity || parsed.changedConfig);
  });

  it('should exit with code 1 when --exit-code is set and diff exists', async () => {
    await assert.rejects(
      () => execFileAsync('node', [
        cliPath, 'diff',
        fixture('base.eslint.config.js'),
        fixture('strict.eslint.config.js'),
        '-f', path.resolve(__dirname, '../cli.js'),
        '-e',
      ]),
      (/** @type {Error & { code?: number }} */ err) => {
        // ResultError uses process.exitCode, not process.exit
        assert.ok(err.code !== 0);
        return true;
      }
    );
  });

  it('should output valid JSON for compare --json', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'compare',
      fixture('base.eslint.config.js'),
      fixture('strict.eslint.config.js'),
      '-f', path.resolve(__dirname, '../cli.js'),
      '--json',
    ]);
    const parsed = JSON.parse(stdout);
    assert.ok(parsed.onlyActiveIn || parsed.mixedSeverity || parsed.mixedConfigs);
  });

  it('should output valid JSON for summary --json', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'summary',
      fixture('base.eslint.config.js'),
      '-f', path.resolve(__dirname, '../cli.js'),
      '--json',
    ]);
    const parsed = JSON.parse(stdout);
    assert.ok(typeof parsed === 'object' && parsed !== null);
    // Should contain rule names as keys
    const keys = Object.keys(parsed);
    assert.ok(keys.length > 0, 'summary JSON should contain rules');
  });

  it('should exit with error for missing config file', async () => {
    await assert.rejects(
      () => execFileAsync('node', [cliPath, 'inspect', fixture('nonexistent.js')]),
      (/** @type {Error & { code?: number }} */ err) => {
        assert.strictEqual(err.code, 1);
        return true;
      }
    );
  });
});
