import { peowly } from 'peowly';

import { findDefaultConfig } from '../flags/input.js';
import { resolveInspectInput } from '../flags/inspect-input.js';
import { printInspectResult } from '../print-inspect.js';

export const inspect = {
  description: 'Inspects the structure of a flat eslint.config.js file',

  /** @type {import('peowly-commands').CliCommandRun} */
  async run (argv, meta, { parentName }) {
    const name = parentName + ' inspect';

    const { configFile, markdownOutput, rawConfigs, showRules } =
      await setupCommand(name, inspect.description, argv, meta);

    printInspectResult(configFile, rawConfigs, {
      markdown: markdownOutput,
      showRules,
    });
  },
};

/**
 * @param {string} name
 * @param {string} description
 * @param {string[]} args
 * @param {import('peowly-commands').CliMeta} meta
 * @returns {Promise<import('./command-types.d.ts').CommandContextInspect>}
 */
async function setupCommand (name, description, args, { pkg }) {
  const options = /** @satisfies {Record<string, import('peowly').AnyFlag>} */ ({
    markdown: {
      description: 'Format as Markdown',
      listGroup: 'Output options',
      'short': 'm',
      type: 'boolean',
      'default': false,
    },
    'show-rules': {
      description: 'List individual rule names in each config block',
      listGroup: 'Inspect options',
      'short': 's',
      type: 'boolean',
      'default': false,
    },
  });

  const { flags, input } = peowly({
    args,
    description,
    examples: [
      'eslint.config.js',
      '--show-rules eslint.config.js',
    ],
    name,
    options,
    pkg,
    usage: '<flat eslint config file>',
  });

  let [configFile] = input;

  if (!configFile) {
    configFile = await findDefaultConfig(process.cwd());
  }

  return {
    ...await resolveInspectInput(flags, configFile),
    markdownOutput: flags.markdown || false,
    showRules: flags['show-rules'] || false,
  };
}
