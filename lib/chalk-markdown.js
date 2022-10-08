import chalk from 'chalk';

export class ChalkOrMarkdown {
  /** @type {boolean} */
  useMarkdown;
  /**
   * @param {boolean} useMarkdown
   */
  constructor (useMarkdown) {
    this.useMarkdown = !!useMarkdown;
  }

  /**
   * @param {string} text
   * @param {number} [level]
   * @returns {string}
   */
  header (text, level = 1) {
    return this.useMarkdown
      ? `\n${''.padStart(level, '#')} ${text}\n`
      : chalk.underline(`\n${level === 1 ? chalk.bold(text) : text}\n`);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  bold (text) {
    return this.useMarkdown
      ? `**${text}**`
      : chalk.bold(`${text}`);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  italic (text) {
    return this.useMarkdown
      ? `_${text}_`
      : chalk.italic(`${text}`);
  }

  /**
   * @param {string[]} items
   * @returns {string}
   */
  list (items) {
    const indentedContent = items.map(item => this.indent(item).trimStart());
    return this.useMarkdown
      ? '* ' + indentedContent.join('\n* ') + '\n'
      : indentedContent.join('\n') + '\n';
  }

  /**
   * @param {string} text
   * @param {number} [level]
   * @returns {string}
   */
  indent (text, level = 1) {
    const indent = ''.padStart(level * 2, ' ');
    return indent + text.split('\n').join('\n' + indent);
  }

  /**
   * @param {unknown} value
   * @returns {string}
   */
  json (value) {
    return this.useMarkdown
      ? '```json\n' + JSON.stringify(value) + '\n```'
      : JSON.stringify(value);
  }
}