/** @typedef {string | import('mdast').BlockContent} BlockContentOrString */
/** @typedef {MaybeArray<BlockContentOrString>} BlockContentOrStringList */

/** @typedef {string | import('mdast').PhrasingContent} PhrasingContentOrString */
/** @typedef {MaybeArray<PhrasingContentOrString>} PhrasingContentOrStringList */

/**
 * @template T
 * @typedef {T[]|T} MaybeArray
 */

/**
 * @template T
 * @template Replacement
 * @typedef {T extends string ? Replacement : T} StringReplace
 */

/**
 * @template {import('mdast').BlockContent} T
 * @param {T|string} value
 * @returns {T|import('mdast').Paragraph}
 */
export function ensureBlockContent (value) {
  if (typeof value === 'string') {
    return { type: 'paragraph', children: [{ type: 'text', value }] };
  }
  return value;
}

/**
 * @template {import('mdast').BlockContent} T
 * @param {MaybeArray<T|string>} list
 * @returns {Array<T|import('mdast').Paragraph>}
 */
export function ensureBlockContenList (list) {
  return (Array.isArray(list) ? list : [list])
    // eslint-disable-next-line unicorn/no-array-callback-reference
    .map(ensureBlockContent);
}

/**
 * @template {import('mdast').PhrasingContent} T
 * @param {T|string} value
 * @returns {T|import('mdast').Text}
 */
export function ensurePhrasingContent (value) {
  if (typeof value === 'string') {
    return { type: 'text', value };
  }
  return value;
}

/**
 * @template {import('mdast').PhrasingContent} T
 * @param {MaybeArray<T|string>} list
 * @returns {Array<T|import('mdast').Text>}
 */
export function ensurePhrasingContentList (list) {
  return (Array.isArray(list) ? list : [list])
    // eslint-disable-next-line unicorn/no-array-callback-reference
    .map(ensurePhrasingContent);
}

/**
 * @param {string} value
 * @param {string|undefined} url
 * @param {boolean} [skipLinks]
 * @returns {import('mdast').Link|import('mdast').Text}
 */
export function mdastLinkify (value, url, skipLinks) {
  return url && !skipLinks
    ? {
        type: 'link',
        url,
        children: [{ type: 'text', value }],
      }
    : { type: 'text', value };
}
