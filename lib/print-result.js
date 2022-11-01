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
    onlyActiveIn,
    ruleDocs,
  } = differences;

  const {
    groupByRule = false,
    markdown = false,
  } = options || {};

  const format = new ChalkOrMarkdown(markdown);

  const onlyActiveInKeys = Object.keys(onlyActiveIn).sort();
  if (onlyActiveInKeys.length) {
    /** @type {string[]} */
    const items = [];

    if (groupByRule) {
      for (const ruleName of onlyActiveInKeys) {
        /** @type {string[]} */
        const items = [];
        for (const configName of onlyActiveIn[ruleName]?.sort() || []) {
          items.push(configName);
        }
        if (items.length) {
          console.log(format.header(
            `${format.hyperlink(format.bold(ruleName), (ruleDocs[ruleName] || [])[0], { fallback: false })} only active in:`,
            2
          ));
          console.log('  ' + items.join(', ' + '\n'));
        }
      }
    } else {
      for (const configName of configNames) {
        /** @type {string[]} */
        const innerItems = [];
        for (const ruleName of onlyActiveInKeys) {
          if (onlyActiveIn[ruleName]?.includes(configName)) {
            innerItems.push(format.hyperlink(ruleName, (ruleDocs[ruleName] || [])[0], { fallback: false }));
          }
        }
        if (innerItems.length) {
          items.push(format.bold(configName) + '\n' + format.list(innerItems).trimEnd());
        }
      }
    }

    if (items.length) {
      console.log(format.header('Only active in some:'));
      console.log(format.list(items));
    }
  }

  const mixedSeverityEntries = Object.entries(mixedSeverity);
  if (mixedSeverityEntries.length) {
    /** @type {string[]} */
    const items = [];
    for (const [ruleName, severities] of mixedSeverityEntries) {
      const formattedSeverities = Object.entries(severities)
        .map(
          ([level, configNames]) =>
            format.italic(getReadableLevel(level)) + ': ' + (configNames || []).join(', ')
        );
      items.push(format.hyperlink(format.bold(ruleName), (ruleDocs[ruleName] || [])[0], { fallback: false }) + '\n' + format.list(formattedSeverities).trimEnd());
    }
    console.log(format.header('Mixed severities:'));
    console.log(format.list(items));
  }

  const mixedConfigsKeys = Object.keys(mixedConfigs).sort();
  if (mixedConfigsKeys.length) {
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
      items.push(format.hyperlink(format.bold(ruleName), (ruleDocs[ruleName] || [])[0], { fallback: false }) + '\n' + format.list(innerItems).trimEnd());
    }
    console.log(format.header('Mixed configs where otherwise okay:'));
    console.log(format.list(items));
  }
}
