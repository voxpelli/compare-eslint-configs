import { MarkdownOrChalk } from 'markdown-or-chalk';

/**
 * @typedef {object} PrintInspectOptions
 * @property {boolean} markdown
 * @property {boolean} showRules
 */

/**
 * @param {string} configFile
 * @param {unknown[]} rawConfigs
 * @param {PrintInspectOptions} options
 */
export function printInspectResult (configFile, rawConfigs, { markdown, showRules }) {
  const format = new MarkdownOrChalk(markdown);

  const lines = [
    format.header(`${configFile} — ${rawConfigs.length} config object${rawConfigs.length === 1 ? '' : 's'}`).trim(),
    '',
  ];

  for (const [index, rawConfig] of rawConfigs.entries()) {
    const config = /** @type {Record<string, unknown>} */ (rawConfig || {});
    const name = /** @type {string | undefined} */ (config['name']) || '(unnamed)';
    const files = /** @type {string[] | undefined} */ (config['files']);
    const ignores = /** @type {string[] | undefined} */ (config['ignores']);
    const rules = /** @type {Record<string, unknown> | undefined} */ (config['rules']);

    const ruleEntries = rules ? Object.entries(rules) : [];
    const errorCount = ruleEntries.filter(([, v]) => {
      const level = Array.isArray(v) ? v[0] : v;
      return level === 'error' || level === 2;
    }).length;
    const warnCount = ruleEntries.filter(([, v]) => {
      const level = Array.isArray(v) ? v[0] : v;
      return level === 'warn' || level === 1;
    }).length;

    lines.push(format.bold(`[${index}] ${name}`));

    if (files) {
      lines.push(`  Files:   ${files.join(', ')}`);
    }
    if (ignores) {
      lines.push(`  Ignores: ${ignores.join(', ')}`);
    }

    if (ruleEntries.length > 0) {
      lines.push(`  Rules:   ${ruleEntries.length} (${errorCount} error, ${warnCount} warn)`);

      if (showRules) {
        for (const [ruleName] of ruleEntries) {
          lines.push(`    - ${ruleName}`);
        }
      }
    } else if (!files && !ignores) {
      lines.push('  (plugin registration or language options only)');
    } else {
      lines.push('  (no rules)');
    }

    lines.push('');
  }

  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));
}
