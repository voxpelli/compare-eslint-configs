/* eslint-disable no-console */

import chalk from 'chalk';

/**
 * @param {import("./compare").ConfigDifferences} differences
 * @returns {void}
 */
export function printComparationResult (differences) {
  const {
    mixedConfigs,
    mixedSeverity,
    onlyActiveIn
  } = differences;

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
}
