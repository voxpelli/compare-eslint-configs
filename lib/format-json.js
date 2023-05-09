/**
 * @param {object} data
 * @param {string} summary
 * @param {boolean} includeVerbose
 * @returns {import('mdast').PhrasingContent[]}
 */
export function formatJsonForMarkdown (data, summary, includeVerbose) {
  if (isNonVerboseJson(data)) {
    return [{
      type: 'inlineCode',
      value: JSON.stringify(data),
    }];
  }

  if (includeVerbose) {
    return [
      { type: 'html', value: `<details><summary>${summary}</summary><pre>` },
      ...(
        JSON.stringify(data, undefined, 2)
          .split('\n')
          .flatMap(value => /** @type {const} */ ([
            { type: 'text', value },
            { type: 'html', value: '<br/>' },
          ]))
      ),
      { type: 'html', value: '</pre></details>' },
    ];
  }

  return [{ type: 'text', value: summary }];
}

/**
 * @param {object} data
 * @param {boolean} includeVerbose
 * @returns {import('mdast').PhrasingContent|undefined}
 */
export function formatJsonForMdast (data, includeVerbose) {
  if (includeVerbose || isNonVerboseJson(data)) {
    return {
      type: 'inlineCode',
      value: JSON.stringify(data),
    };
  }
}

/**
 * @param {object} data
 * @returns {boolean}
 */
function isNonVerboseJson (data) {
  return Array.isArray(data) && data.length === 1 && typeof data[0] === 'string';
}
