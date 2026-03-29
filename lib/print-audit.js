/* eslint-disable no-console */

import {
  MarkdownOrChalk,
  mdastLinkify,
  mdastListHelper,
} from 'markdown-or-chalk';

/**
 * @typedef PrintAuditOptions
 * @property {boolean} markdown
 * @property {boolean} skipLinks
 * @property {boolean} showUnconfigured
 */

/**
 * @param {import('./audit.js').AuditResult} result
 * @param {PrintAuditOptions} options
 * @returns {void}
 */
export function printAuditResult (result, { markdown, showUnconfigured, skipLinks }) {
  const format = new MarkdownOrChalk(markdown);

  // Section 1: Coverage statistics
  const statsLines = [
    format.header('Coverage').trim(),
    '',
    `  Configured rules: ${result.stats.totalConfigured}`,
    `  Deprecated in use: ${result.stats.totalDeprecated}`,
    `  Active builtins: ${result.stats.totalBuiltinsActive} (of ${result.stats.totalBuiltins} total)`,
    `  Unconfigured builtins: ${result.stats.totalBuiltinsUnconfigured}`,
  ];

  if (result.stats.pluginNames.length > 0) {
    statsLines.push(`  Plugins loaded: ${result.stats.pluginNames.join(', ')}`);
  }

  statsLines.push('');
  console.log(statsLines.join('\n'));

  // Section 2: Deprecated rules
  if (result.deprecatedRules.length > 0) {
    console.log(format.header('Deprecated rules in use'));

    /** @type {import('markdown-or-chalk').PhrasingContentOrStringList[]} */
    const formattedRules = [];

    for (const rule of result.deprecatedRules) {
      /** @type {import('markdown-or-chalk').PhrasingContentOrStringList} */
      const mainLine = [
        format.logSymbolsMdast[rule.severity === 'error' ? 'error' : 'warning'],
        ' ',
        mdastLinkify(rule.ruleName, rule.docUrl, skipLinks),
        format.dim(' [deprecated]'),
      ];

      /** @type {string[]} */
      const details = [];

      if (rule.replacedBy.length > 0) {
        for (const replacement of rule.replacedBy) {
          const replId = replacement.ruleId
            ? (replacement.pluginName ? `${replacement.pluginName}: ${replacement.ruleId}` : replacement.ruleId)
            : '(see docs)';
          const replUrl = replacement.url || '';
          const replDisplay = replUrl && !skipLinks
            ? format.hyperlink(replId, replUrl, { fallback: false })
            : replId;
          details.push(`→ ${replDisplay}`);
        }
      } else {
        details.push('→ no replacement available');
      }

      if (rule.deprecatedSince) {
        const timeline = rule.availableUntil
          ? `since ${rule.deprecatedSince}, available until ${rule.availableUntil}`
          : `since ${rule.deprecatedSince}`;
        details.push(format.dim(timeline));
      }

      formattedRules.push([...mainLine, '\n' + format.list(details).trimEnd()]);
    }

    console.log(format.fromMdast(mdastListHelper(formattedRules)));
  } else {
    console.log(format.header('Deprecated rules'));
    console.log('  None found — all configured rules are active.\n');
  }

  // Section 3: Unconfigured builtin rules (conditional)
  if (showUnconfigured && result.unconfiguredBuiltins.length > 0) {
    const recommended = result.unconfiguredBuiltins.filter(r => r.isRecommended);
    const other = result.unconfiguredBuiltins.filter(r => !r.isRecommended);

    console.log(format.header('Unconfigured builtin rules'));

    if (recommended.length > 0) {
      console.log(format.bold(`Recommended (${recommended.length}):`));

      /** @type {import('markdown-or-chalk').PhrasingContentOrStringList[]} */
      const items = [];

      for (const rule of recommended) {
        items.push([mdastLinkify(rule.ruleName, rule.docUrl, skipLinks)]);
      }

      console.log(format.fromMdast(mdastListHelper(items)));
    }

    if (other.length > 0) {
      console.log(format.bold(`Other (${other.length}):`));

      /** @type {import('markdown-or-chalk').PhrasingContentOrStringList[]} */
      const items = [];

      for (const rule of other) {
        items.push([mdastLinkify(rule.ruleName, rule.docUrl, skipLinks)]);
      }

      console.log(format.fromMdast(mdastListHelper(items)));
    }
  } else if (!showUnconfigured && result.stats.totalBuiltinsUnconfigured > 0) {
    console.log(format.dim(`Use --show-unconfigured to list ${result.stats.totalBuiltinsUnconfigured} unconfigured builtin rules`) + '\n');
  }
}
