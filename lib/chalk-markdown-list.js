import { ensurePhrasingContentList } from './chalk-markdown-mdast-helpers.js';

/**
 * @param {import('./chalk-markdown-mdast-helpers.js').PhrasingContentOrStringList[]} items
 * @returns {import('mdast').List}
 */
export function mdastListHelper (items) {
  return {
    type: 'list',
    spread: false,
    children: items.map(item => {
      return {
        type: 'listItem',
        children: [{
          type: 'paragraph',
          children: ensurePhrasingContentList(item),
        }],
      };
    }),
  };
}
