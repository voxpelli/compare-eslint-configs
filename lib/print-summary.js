/* eslint-disable no-console */

import {
  MarkdownOrChalk,
  mdastLinkify,
  mdastListHelper,
  mdastTableHelper,
} from 'markdown-or-chalk';

import { formatJsonForMarkdown, formatJsonForMdast } from './format-json.js';
import { sortRulesByName } from './utils/misc.js';

/**
 * @param {string} configName
 * @param {{ [ruleName: string]: import('./compare.js').RuleSummary }} summary
 * @param {import('./print-result.js').PrintOptions} options
 * @returns {void}
 */
export function printConfigSummary (configName, summary, options) {
  const format = new MarkdownOrChalk(options.markdown);

  console.log(format.header(configName));

  console.log(format.fromMdast(formatConfigSummary(configName, summary, options)));
}

/**
 * @param {string} _configName
 * @param {{ [ruleName: string]: import('./compare.js').RuleSummary }} summary
 * @param {import('./print-result.js').PrintOptions} options
 * @returns {import('mdast').Content}
 */
function formatConfigSummary (_configName, summary, options) {
  const sortedRules = Object.entries(sortRulesByName(summary));

  return options.table
    ? formatConfigSummaryTable(sortedRules, options)
    : formatConfigSummaryList(sortedRules, options);
}

/**
 * @param {Array<[string, import('./compare.js').RuleSummary]>} sortedRules
 * @param {import('./print-result.js').PrintOptions} options
 * @returns {import('mdast').List}
 */
function formatConfigSummaryList (sortedRules, { markdown, skipLinks, verboseConfigs }) {
  let longestRuleNameWithOption = 0;
  for (const [ruleName, { options }] of sortedRules) {
    if (options && ruleName.length > longestRuleNameWithOption) {
      longestRuleNameWithOption = ruleName.length;
    }
  }

  const format = new MarkdownOrChalk(markdown);

  /** @type {import('markdown-or-chalk').PhrasingContentOrStringList[]} */
  const formattedRules = [];

  for (const [
    ruleName,
    { docUrls, error, options },
  ] of sortedRules) {
    const docUrl = [...(docUrls || [])][0];
    const optionsValue = options && Object.values(options)?.[0];

    const formattedOptions = (verboseConfigs && optionsValue) ? formatJsonForMdast(optionsValue, verboseConfigs) : undefined;

    formattedRules.push([
      format.logSymbolsMdast[error?.length ? 'error' : 'warning'],
      (options ? (format.chalkOnly ? format.logSymbolsMdast.info : ':wrench:') : ''),
      ' ',
      mdastLinkify(ruleName, docUrl, skipLinks),
      (verboseConfigs && options && format.chalkOnly ? ''.padEnd(longestRuleNameWithOption - ruleName.length + 2, ' ') : ''),
      formattedOptions ? ' ' : '',
      formattedOptions ?? '',
    ]);
  }

  return mdastListHelper(formattedRules);
}

/** @typedef {import('markdown-or-chalk').PhrasingContentOrStringList} PhrasingContentOrStringList */

/**
 * @param {Array<[string, import('./compare.js').RuleSummary]>} sortedRules
 * @param {import('./print-result.js').PrintOptions} options
 * @returns {import('mdast').Table}
 */
function formatConfigSummaryTable (sortedRules, { markdown, skipLinks, verboseConfigs }) {
  // TODO: Add ability for ruleset to add comments / justification for including rule

  /** @type {Array<[PhrasingContentOrStringList, string, string, PhrasingContentOrStringList]>} */
  const tableData = [
    ['Rule', 'Error', 'Warning', 'Config'],
  ];

  for (const [
    ruleName,
    { docUrls, error, options: config },
  ] of sortedRules) {
    const docUrl = [...(docUrls || [])][0];
    const optionsValue = config && Object.values(config)?.[0];

    tableData.push([
      mdastLinkify(ruleName, docUrl, skipLinks),
      error?.length ? 'Yes' : '',
      error?.length ? '' : 'Yes',
      optionsValue ? formatJsonForMarkdown(optionsValue, 'See config', verboseConfigs) : '',
    ]);
  }

  return mdastTableHelper(
    tableData,
    markdown ? ['left', 'center', 'center', 'left'] : undefined
  );
}
