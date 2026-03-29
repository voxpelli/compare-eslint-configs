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

describe('deprecated rule display', () => {
  it('should show [deprecated] in summary for deprecated rules', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'summary',
      fixture('deprecated.eslint.config.js'),
      '-f', path.resolve(__dirname, '../cli.js'),
    ]);
    assert.ok(
      stdout.includes('[deprecated]') || stdout.includes('deprecated'),
      `Expected [deprecated] in output, got: ${stdout.slice(0, 200)}`
    );
  });

  it('should show [deprecated] in diff when comparing deprecated rules', async () => {
    const { stdout } = await execFileAsync('node', [
      cliPath, 'diff',
      fixture('base.eslint.config.js'),
      fixture('deprecated.eslint.config.js'),
      '-f', path.resolve(__dirname, '../cli.js'),
    ]);
    // The diff should mention no-return-await (added) and it should be marked deprecated
    assert.ok(stdout.includes('no-return-await'), 'Expected no-return-await in diff output');
  });
});
