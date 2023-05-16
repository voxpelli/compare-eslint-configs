import { ensurePhrasingContentList } from './chalk-markdown-mdast-helpers.js';

/**
 * @param {import('./chalk-markdown-mdast-helpers.js').PhrasingContentOrStringList[][]} rows
 * @param {import('mdast').AlignType[]} [align]
 * @returns {import('mdast').Table}
 */
export function mdastTableHelper (rows, align) {
  return {
    type: 'table',
    align,
    children: rows.map(cells => (
      {
        type: 'tableRow',
        children: cells.map(value => (
          {
            type: 'tableCell',
            children: ensurePhrasingContentList(value),
          }
        )),
      }
    )),
  };
}
