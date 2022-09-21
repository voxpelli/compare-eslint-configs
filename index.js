/* eslint-disable no-console */

import { execa } from 'execa';
import chalk from 'chalk';

import { compareConfigs } from './lib/compare.js';
import { zipObject } from './lib/utils.js';

/** @type {['airbnb', 'standard']} */
const configNames = [
  'airbnb',
  'standard',
];
const executionOutput = (await Promise.all([
  execa('npx eslint --no-eslintrc -c source.eslintrc.json --print-config index.js', { cwd: new URL('./', import.meta.url) }),
  execa('npx eslint --no-eslintrc -c .eslintrc --print-config index.js', { cwd: new URL('./', import.meta.url) })
]));

/** @type {Array<import('eslint').Linter.Config>} */
const parsedOutput = executionOutput.map(output => JSON.parse(output.stdout));

const configs = zipObject(configNames, parsedOutput);

const {
  mixedConfigs,
  mixedSeverity,
  onlyActiveIn
} = compareConfigs(configs);

for (const configName of Object.keys(onlyActiveIn).sort()) {
  console.log(`Only active in ${configName}:`);
  for (const ruleName of onlyActiveIn[configName]?.sort() || []) {
    console.log(chalk[configName === 'standard' ? 'green' : 'red'](`  ${ruleName}`));
  }
}

console.log('Mixed severities:');
for (const [ruleName, severities] of Object.entries(mixedSeverity)) {
  const formattedSeverities = Object.entries(severities)
    .map(
      ([level, configNames]) =>
        level + ': ' + configNames.join(', ')
    );
  console.log(`  ${ruleName}: ${formattedSeverities.join(', ')}`);
}

console.log('Mixed configs where otherwise okay:');
for (const ruleName of Object.keys(mixedConfigs).sort()) {
  console.log(`  ${ruleName}:`);
  const mixedConfig = mixedConfigs[ruleName];
  if (mixedConfig) {
    for (const configName of Object.keys(mixedConfig).sort()) {
      console.log(chalk[configName === 'standard' ? 'green' : 'red'](`    ${JSON.stringify(mixedConfig[configName])}`));
    }
  }
}
