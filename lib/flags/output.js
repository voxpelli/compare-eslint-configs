import { InputError } from '../utils/errors.js';

export const outputFlags = /** @satisfies {Record<string, import('peowly').AnyFlag & { listGroup: 'Output options' }>} */ ({
  'group-rules': {
    description: 'Prints the rules that only exists in some configs grouped by rule rather than config',
    listGroup: 'Output options',
    'short': 'r',
    type: 'boolean',
    'default': false,
  },
  json: {
    description: 'Output the results as JSON instead',
    listGroup: 'Output options',
    'short': 'j',
    type: 'boolean',
    'default': false,
  },
  markdown: {
    description: 'Format the result as Markdown instead. Useful for copy and pasting into eg. GitHub',
    listGroup: 'Output options',
    'short': 'm',
    type: 'boolean',
    'default': false,
  },
  'no-links': {
    description: 'Skips adding hyperlinks to rule documentation',
    listGroup: 'Output options',
    type: 'boolean',
    'default': false,
  },
  table: {
    description: 'Prints the output in a table format rather than list format',
    listGroup: 'Output options',
    type: 'boolean',
    'default': false,
  },
  verboseConfigs: {
    description: 'Includes full config data in the output, even the complex one',
    listGroup: 'Output options',
    type: 'boolean',
    'default': false,
  },
});

/**
 * @param {import('peowly').TypedFlags<typeof outputFlags>} flags
 * @returns {import('./flag-types.d.ts').OutputFlags}
 */
export function resolveOutputFlags (flags) {
  const {
    'group-rules': groupByRule,
    json: jsonOutput,
    markdown: markdownOutput,
    'no-links': skipLinks,
    table,
    verboseConfigs,
  } = flags;

  if (jsonOutput && markdownOutput) {
    throw new InputError('Can\'t chose both JSON and Markdown at once');
  }

  return {
    groupByRule,
    jsonOutput,
    markdownOutput,
    skipLinks,
    table,
    verboseConfigs,
  };
}
