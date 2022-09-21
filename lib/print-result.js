/* eslint-disable no-console */

import chalk from 'chalk';

/** @type {Array<import('chalk').ForegroundColor>} */
const configColors = [
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
];

/**
 * @param {string} configName
 * @param {string[]} configNames
 * @returns {import('chalk').ForegroundColor}
 */
function getConfigColor (configName, configNames) {
  return configColors[configNames.indexOf(configName)] || 'black';
}

/**
 * @param {import("./compare").ConfigDifferences} differences
 * @param {string[]} configNames
 * @param {{ groupByRule?: boolean }} options
 * @returns {void}
 */
export function printComparationResult (differences, configNames, { groupByRule } = {}) {
  const {
    mixedConfigs,
    mixedSeverity,
    onlyActiveIn
  } = differences;

  const onlyActiveInKeys = Object.keys(onlyActiveIn).sort();
  if (onlyActiveInKeys.length) {
    console.log(chalk.underline('\nOnly active in some:\n'));

    if (groupByRule) {
      for (const ruleName of onlyActiveInKeys) {
        console.log(`${chalk.bold(ruleName)} only active in:`);
        for (const configName of onlyActiveIn[ruleName]?.sort() || []) {
          console.log(chalk[getConfigColor(configName, configNames)](
            `  ${configName}`
          ));
        }
      }
    } else {
      for (const configName of configNames) {
        console.log(chalk.underline.bold(`${configName}:`));
        for (const ruleName of onlyActiveInKeys) {
          if (onlyActiveIn[ruleName]?.includes(configName)) {
            console.log((
              `    ${ruleName}`
            ));
          }
        }
        console.log();
      }
    }
  }

  const mixedSeverityEntries = Object.entries(mixedSeverity);
  if (mixedSeverityEntries.length) {
    console.log(chalk.underline('Mixed severities:'));
    for (const [ruleName, severities] of mixedSeverityEntries) {
      const formattedSeverities = Object.entries(severities)
        .map(
          ([level, configNames]) =>
            level + ': ' + configNames.join(', ')
        );
      console.log(`  ${chalk.bold(ruleName)}: ${formattedSeverities.join(', ')}`);
    }
    console.log();
  }

  const mixedConfigsKeys = Object.keys(mixedConfigs).sort();
  if (mixedConfigsKeys.length) {
    console.log(chalk.underline('Mixed configs where otherwise okay:'));
    for (const ruleName of mixedConfigsKeys) {
      console.log(`  ${ruleName}:`);
      const mixedConfig = mixedConfigs[ruleName];
      if (mixedConfig) {
        for (const configName of Object.keys(mixedConfig).sort()) {
          console.log(chalk[getConfigColor(configName, configNames)](
            `    ${JSON.stringify(mixedConfig[configName])}`
          ));
        }
      }
    }
    console.log();
  }
}
