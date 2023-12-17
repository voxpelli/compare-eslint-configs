const coreFlags = /** @satisfies {import('meow-with-subcommands').AnyFlags} */ ({
  targetFile: {
    shortFlag: 't',
    type: 'string',
    'default': 'index.js',
    listGroup: 'Core',
    description: 'The file context which the eslint config should be compared in. Defaults to index.js',
  },
});

const formattingFlags = /** @satisfies {import('meow-with-subcommands').AnyFlags} */ ({
  links: {
    type: 'boolean',
    'default': true,
    listGroup: 'Formatting',
    description: 'Whether to include links to documentation',
  },
  table: {
    type: 'boolean',
    'default': false,
    listGroup: 'Formatting',
    description: 'Prints the output in a table format rather than list format',
  },
  verboseConfigs: {
    type: 'boolean',
    'default': false,
    listGroup: 'Formatting',
    description: 'Includes full config data in the output, even the complex ones',
  },
});

const outputFlags = /** @satisfies {import('meow-with-subcommands').AnyFlags} */ ({
  json: {
    type: 'boolean',
    shortFlag: 'j',
    'default': false,
    listGroup: 'Output',
    description: 'Output result as json',
  },
  markdown: {
    type: 'boolean',
    shortFlag: 'm',
    'default': false,
    listGroup: 'Output',
    description: 'Output result as markdown',
  },
});

export const sharedFlags = {
  ...coreFlags,
  ...formattingFlags,
  ...outputFlags,
};
