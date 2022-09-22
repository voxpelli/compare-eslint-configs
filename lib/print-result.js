/* eslint-disable no-console */

import { ChalkOrMarkdown } from './chalk-markdown.js';

/**
 * @param {string} level
 * @returns {string}
 */
const getReadableLevel = (level) => {
  if (level === '0') return 'off';
  if (level === '1') return 'warn';
  if (level === '2') return 'error';
  return level;
};

/**
 * @param {import("./compare").ConfigDifferences} differences
 * @param {string[]} configNames
 * @param {{ groupByRule?: boolean, markdown?: boolean }} options
 * @returns {void}
 */
export function printComparationResult (differences, configNames, options) {
  const {
    mixedConfigs,
    mixedSeverity,
    onlyActiveIn
  } = differences;

  const {
    groupByRule = false,
    markdown = false,
  } = options || {};

  const format = new ChalkOrMarkdown(markdown);

  const onlyActiveInKeys = Object.keys(onlyActiveIn).sort();
  if (onlyActiveInKeys.length) {
    console.log(format.header('Only active in some:'));

    if (groupByRule) {
      for (const ruleName of onlyActiveInKeys) {
        console.log(format.header(
          `${format.bold(ruleName)} only active in:`,
          2
        ));
        /** @type {string[]} */
        const items = [];
        for (const configName of onlyActiveIn[ruleName]?.sort() || []) {
          items.push(configName);
        }
        console.log('  ' + items.join(', ' + '\n'));
      }
    } else {
      for (const configName of configNames) {
        console.log(format.header(`${configName}:`, 2));
        /** @type {string[]} */
        const items = [];
        for (const ruleName of onlyActiveInKeys) {
          if (onlyActiveIn[ruleName]?.includes(configName)) {
            items.push(ruleName);
          }
        }
        console.log(format.list(items));
      }
    }
  }

  const mixedSeverityEntries = Object.entries(mixedSeverity);
  if (mixedSeverityEntries.length) {
    console.log(format.header('Mixed severities:'));
    /** @type {string[]} */
    const items = [];
    for (const [ruleName, severities] of mixedSeverityEntries) {
      const formattedSeverities = Object.entries(severities)
        .map(
          ([level, configNames]) =>
            format.italic(getReadableLevel(level)) + ': ' + configNames.join(', ')
        );
      items.push(format.bold(ruleName) + '\n' + format.list(formattedSeverities).trimEnd());
    }
    console.log(format.list(items));
  }

  const mixedConfigsKeys = Object.keys(mixedConfigs).sort();
  if (mixedConfigsKeys.length) {
    console.log(format.header('Mixed configs where otherwise okay:'));
    /** @type {string[]} */
    const items = [];
    for (const ruleName of mixedConfigsKeys) {
      /** @type {string[]} */
      const innerItems = [];
      const mixedConfig = mixedConfigs[ruleName];
      if (mixedConfig) {
        for (const configName of Object.keys(mixedConfig).sort()) {
          innerItems.push(`${format.italic(configName)}:\n${format.json(mixedConfig[configName])}`);
        }
      }
      items.push(format.bold(ruleName) + '\n' + format.list(innerItems).trimEnd());
    }
    console.log(format.list(items));
  }
}
