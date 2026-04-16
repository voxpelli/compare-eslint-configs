import { MarkdownOrChalk } from 'markdown-or-chalk';
import { isKeyWithType, isObject, isObjectWithKey, isStringArray, typesafeIsArray } from '@voxpelli/typed-utils';

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
    const config = isObject(rawConfig) ? rawConfig : {};
    const name = isKeyWithType(config, 'name', 'string') ? config['name'] : '(unnamed)';
    const files = isObjectWithKey(config, 'files') && isStringArray(config['files']) ? config['files'] : undefined;
    const ignores = isObjectWithKey(config, 'ignores') && isStringArray(config['ignores']) ? config['ignores'] : undefined;
    const rules = isObjectWithKey(config, 'rules') && config['rules'];

    const ruleEntries = rules ? Object.entries(rules) : [];
    const errorCount = ruleEntries.filter(([, v]) => {
      const level = typesafeIsArray(v) ? v[0] : v;
      return level === 'error' || level === 2;
    }).length;
    const warnCount = ruleEntries.filter(([, v]) => {
      const level = typesafeIsArray(v) ? v[0] : v;
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
