import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, '../cli.js');
const cliJs = path.resolve(__dirname, '../cli.js');
const fixture = (/** @type {string} */ name) => path.join(__dirname, 'data', name);

describe('CLI: compare command', () => {
  it('should compare two fixture configs', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'compare',
      fixture('base.eslint.config.js'),
      fixture('strict.eslint.config.js'),
      '-f', cliJs,
    ]);
    // strict has prefer-const and no-var that base doesn't
    assert.ok(stdout.includes('prefer-const') || stdout.includes('no-var'));
  });

  it('should suppress links with --no-links', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'compare',
      fixture('base.eslint.config.js'),
      fixture('strict.eslint.config.js'),
      '-f', cliJs,
      '--no-links', '-m',
    ]);
    assert.ok(!stdout.includes('](http'), '--no-links should suppress markdown links');
  });

  it('should expose --verbose-configs flag', async () => {
    const { stdout } = await execFileAsync('node', [cliPath, 'compare', '--help']);
    assert.ok(stdout.includes('--verbose-configs'), 'flag should be kebab-case');
  });

  it('should auto-detect local config when only one file given', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'compare',
      fixture('strict.eslint.config.js'),
      '-f', cliJs,
    ]);
    assert.ok(stdout.length > 0);
  });
});

describe('CLI: summary command', () => {
  it('should summarize a fixture config', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'summary',
      fixture('base.eslint.config.js'),
      '-f', cliJs,
    ]);
    assert.ok(stdout.includes('no-console'));
    assert.ok(stdout.includes('no-unused-vars'));
  });

  it('should output table format with --table', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'summary',
      fixture('base.eslint.config.js'),
      '-f', cliJs,
      '--table',
    ]);
    // Table format has | separators
    assert.ok(stdout.includes('|'));
  });

  it('should output markdown with -m', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'summary',
      fixture('base.eslint.config.js'),
      '-f', cliJs,
      '-m',
    ]);
    // Markdown has # headers or * lists
    assert.ok(stdout.includes('#') || stdout.includes('*'));
  });

  it('should output valid JSON with --json', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'summary',
      fixture('base.eslint.config.js'),
      '-f', cliJs,
      '--json',
    ]);
    const parsed = JSON.parse(stdout);
    assert.ok(typeof parsed === 'object' && parsed !== null);
    const keys = Object.keys(parsed);
    assert.ok(keys.length > 0, 'summary JSON should contain rules');
    // docUrls should be arrays, not Sets
    for (const rule of Object.values(parsed)) {
      if (/** @type {Record<string, unknown>} */ (rule)['docUrls']) {
        assert.ok(Array.isArray(/** @type {Record<string, unknown>} */ (rule)['docUrls']));
      }
    }
  });
});
