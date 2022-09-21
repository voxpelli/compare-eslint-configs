import { execa } from 'execa';

import { compareConfigs } from './lib/compare.js';
import { printComparationResult } from './lib/print-result.js';
import { zipObject } from './lib/utils.js';

/** @type {['airbnb', 'standard']} */
const configNames = [
  'airbnb',
  'standard',
];

// TODO: First check that both configs exist? And/or generate the configs on the fly?
// TODO: Make target file configurable?

const executionOutput = (await Promise.all([
  execa('npx eslint --no-eslintrc -c source.eslintrc.json --print-config index.js', { cwd: new URL('./', import.meta.url) }),
  execa('npx eslint --no-eslintrc -c .eslintrc --print-config index.js', { cwd: new URL('./', import.meta.url) })
]));

/** @type {Array<import('eslint').Linter.Config>} */
const parsedOutput = executionOutput.map(output => JSON.parse(output.stdout));

const configs = zipObject(configNames, parsedOutput);
const differences = compareConfigs(configs);

printComparationResult(differences);
