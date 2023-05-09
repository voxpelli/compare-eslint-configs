import { highlight } from 'cli-highlight';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
// TODO: Do we actually need this?
import { toString } from 'mdast-util-to-string';
import stripAnsi from 'strip-ansi';

/**
 * @typedef MdastToChalkOrMarkdownOptions
 * @property {boolean|undefined} [tablePipeAlign]
 */

/**
 * @param {import('./chalk-markdown.js').ChalkOrMarkdown} format
 * @returns {import('mdast-util-to-markdown').Options}
 */
function mdastToMarkdownAnsiOptions (format) {
  // Partly based on https://github.com/vweevers/markdown-to-ansi
  return {
    extensions: [
      // gfmAutolinkLiteralToMarkdown
      gfmTableToMarkdown({
        stringLength: str => stripAnsi(str).length,
      }),
    ],
    bullet: '-',
    listItemIndent: 'one',
    handlers: /** @satisfies {Partial<Record<import('mdast').Content["type"], import('mdast-util-to-markdown').Handle>>} */ ({
      inlineCode (node) {
        return highlight(node.value);
      },
      link (node) {
        return format.hyperlink(toString(node), node.url);
      },
      heading (node) {
        const depth = Math.max(Math.min(6, node.depth || 1), 1);

        return format.header(toString(node), depth);
      },
      emphasis (node) {
        return format.italic(stripAnsi(toString(node)));
      },
      strong (node) {
        // TODO: If a piece of string is both strong and emphasized, then we should support that! Not just plainly do "toString(node)"
        return format.bold(stripAnsi(toString(node)));
      },
      ansiTextElement (node) {
        return toString(node);
      },
    }),
  };
}

/**
 * @param {import('./chalk-markdown.js').ChalkOrMarkdown} _format
 * @param {MdastToChalkOrMarkdownOptions} [options]
 * @returns {import('mdast-util-to-markdown').Options}
 */
function mdastToMarkdownBaseOptions (_format, { tablePipeAlign } = {}) {
  return {
    extensions: [
      // gfmAutolinkLiteralToMarkdown
      gfmTableToMarkdown({ tablePipeAlign }),
    ],
  };
}

/**
 * @param {import('./chalk-markdown.js').ChalkOrMarkdown} format
 * @param {MdastToChalkOrMarkdownOptions} [options]
 * @returns {import('mdast-util-to-markdown').Options}
 */
export function mdastToMarkdownOptions (format, options) {
  return format.chalkOnly
    ? mdastToMarkdownAnsiOptions(format)
    : mdastToMarkdownBaseOptions(format, options);
}
