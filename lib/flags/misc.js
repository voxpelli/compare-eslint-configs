export const comparisonFlags = /** @satisfies {Record<string, import("peowly").AnyFlag & { listGroup: 'Comparison options' }>} */ ({
  diff: {
    description: 'Prints what\'s changed between the second and the first file',
    listGroup: 'Comparison options',
    'short': 'd',
    type: 'boolean',
    'default': false,
  },
  summary: {
    description: 'Prints a summary of the specified configs instead',
    listGroup: 'Comparison options',
    'short': 's',
    type: 'boolean',
    'default': false,
  },
  targetFile: {
    description: 'The file context which the eslint config should be compared in. Defaults to index.js',
    listGroup: 'Comparison options',
    'short': 't',
    type: 'string',
    'default': 'index.js',
  },
});

export const miscFlags = /** @satisfies {Record<string, import("peowly").AnyFlag>} */ ({
  'exit-code': {
    description: 'Make the program exit with codes similar to diff, 1 if there were differences else 0',
    listGroup: 'Diff options',
    'short': 'e',
    type: 'boolean',
    'default': false,
  },
  verbose: {
    description: 'Prints verbose output such as debug messages',
    'short': 'v',
    type: 'boolean',
    'default': false,
  },
});

export const presentationFlags = /** @satisfies {Record<string, import("peowly").AnyFlag & { listGroup: 'Presentation options' }>} */ ({
  'group-rules': {
    description: 'Prints the rules that only exists in some configs grouped by rule rather than config',
    listGroup: 'Presentation options',
    'short': 'r',
    type: 'boolean',
    'default': false,
  },
  json: {
    description: 'Output the results as JSON instead',
    listGroup: 'Presentation options',
    'short': 'j',
    type: 'boolean',
    'default': false,
  },
  markdown: {
    description: 'Format the result as Markdown instead. Useful for copy and pasting into eg. GitHub',
    listGroup: 'Presentation options',
    'short': 'm',
    type: 'boolean',
    'default': false,
  },
  'no-links': {
    description: 'Skips adding hyperlinks to rule documentation',
    listGroup: 'Presentation options',
    type: 'boolean',
    'default': false,
  },
  table: {
    description: 'Prints the output in a table format rather than list format',
    listGroup: 'Presentation options',
    type: 'boolean',
    'default': false,
  },
  verboseConfigs: {
    description: 'Includes full config data in the output, even the complex one',
    listGroup: 'Presentation options',
    type: 'boolean',
    'default': false,
  },
});
