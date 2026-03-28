import { peowly } from 'peowly';

import { baseFlags } from '../flags/misc.js';
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
 */
async function setupCommand (name, description, args, { pkg }) {
  const options = /** @satisfies {Record<string, import('peowly').AnyFlag>} */ ({
    ...baseFlags,
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

  const { flags, input, showHelp } = peowly({
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

  const [configFile] = input;

  if (!configFile) {
    showHelp();
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit();
  }

  return {
    ...await resolveInspectInput(flags, configFile),
    markdownOutput: flags.markdown || false,
    showRules: flags['show-rules'] || false,
  };
}
