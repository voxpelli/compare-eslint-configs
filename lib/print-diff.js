/* eslint-disable no-console */

import {
  MarkdownOrChalk,
  mdastLinkify,
  mdastListHelper,
} from 'markdown-or-chalk';

import { formatJsonForMdast } from './format-json.js';
import { sortRulesByName } from './utils/misc.js';
import { getDeepDifference } from './utils/diff.js';

/** @typedef {Omit<import('./print-result.js').PrintOptions, 'table'>} PrintOptions */

/**
 * @param {import('./compare.js').ConfigDiff} diffResult
 * @param {PrintOptions} options
 * @returns {void}
 */
export function printDiffResult (diffResult, options) {
  const format = new MarkdownOrChalk(options.markdown);

  if (Object.keys(diffResult.added).length) {
    console.log(format.header('Added'));
    console.log(format.fromMdast(formatRuleList(sortRulesByName(diffResult.added), diffResult.ruleDocs, options)));
  }

  if (Object.keys(diffResult.removed).length) {
    console.log(format.header('Removed'));
    console.log(format.fromMdast(formatRuleList(sortRulesByName(diffResult.removed), diffResult.ruleDocs, options)));
  }

  if (Object.keys(diffResult.changedSeverity).length) {
    console.log(format.header('Changed severity'));
    console.log(format.fromMdast(formatRuleList(sortRulesByName(diffResult.changedSeverity), diffResult.ruleDocs, options)));
  }

  if (Object.keys(diffResult.changedConfig).length) {
    console.log(format.header('Changed config'));
    console.log(format.fromMdast(formatRuleList(sortRulesByName(diffResult.changedConfig), diffResult.ruleDocs, options)));
  }
}

/**
 * @param {import('./compare.js').ConfigDiff["added"]} rules
 * @param {import('./compare.js').ConfigDiff["ruleDocs"]} ruleDocs
 * @param {PrintOptions} options
 * @returns {import('mdast').List}
 */
function formatRuleList (rules, ruleDocs, { markdown, skipLinks, verboseConfigs }) {
  let longestRuleNameWithOption = 0;

  for (const [ruleName, { options }] of Object.entries(rules)) {
    if (options && ruleName.length > longestRuleNameWithOption) {
      longestRuleNameWithOption = ruleName.length;
    }
  }

  const format = new MarkdownOrChalk(markdown);

  /** @type {import('markdown-or-chalk').PhrasingContentOrStringList[]} */
  const formattedRules = [];

  for (const [ruleName, ruleConfig] of Object.entries(rules)) {
    const docUrl = (ruleDocs[ruleName] || [])[0];

    // TODO: Improve diff presentation in chalk and markdown output, use maybe eg. jest-diff
    // TODO: When `verbosed-configs` is used, print the config on their own lines here
    const addedOptions = getDeepDifference(ruleConfig.oldOptions || [], ruleConfig.options || []);
    const removedOptions = getDeepDifference(ruleConfig.options || [], ruleConfig.oldOptions || []);

    const formattedAddedOptions = addedOptions ? formatJsonForMdast(addedOptions, verboseConfigs) : undefined;
    const formattedRemovedOptions = removedOptions ? formatJsonForMdast(removedOptions, verboseConfigs) : undefined;

    formattedRules.push([
      format.logSymbolsMdast[ruleConfig.severity === 'error' ? 'error' : 'warning'],
      (ruleConfig.options ? (format.chalkOnly ? format.logSymbolsMdast.info : ':wrench:') : ''),
      ' ',
      mdastLinkify(ruleName, docUrl, skipLinks),
      ruleConfig.options && format.chalkOnly ? ''.padEnd(longestRuleNameWithOption - ruleName.length + 2, ' ') : '',
      removedOptions ? ' config removed' + (formattedRemovedOptions ? ': ' : '') : '',
      formattedRemovedOptions ?? '',
      addedOptions ? (removedOptions ? ',' : '') + ' config added' + (formattedAddedOptions ? ': ' : '') : '',
      formattedAddedOptions ?? '',
    ]);
  }

  return mdastListHelper(formattedRules);
}
