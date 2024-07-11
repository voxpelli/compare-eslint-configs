export const baseFlags = /** @satisfies {Record<string, import('peowly').AnyFlag>} */ ({
  verbose: {
    description: 'Prints verbose output such as debug messages',
    'short': 'v',
    type: 'boolean',
    'default': false,
  },
});
