import { peowly } from 'peowly';

import { baseFlags } from '../flags/misc.js';
import { outputFlags, resolveOutputFlags } from '../flags/output.js';
import { inputFlags, resolveInputContext } from '../flags/input.js';
import { summarizeConfigs } from '../compare.js';
import { printConfigSummary } from '../print-summary.js';

/** @type {import('peowly-commands').CliCommand} */
export const summary = {
  description: 'Prints a summary of the specified configs',

  async run (argv, meta, { parentName }) {
    const name = parentName + ' summary';

    const {
      configs,
      markdownOutput,
      skipLinks,
      table,
      verboseConfigs,
      // TODO: Remove flag
      // groupByRule,
      // TODO: Remove flag
      // jsonOutput,
    } = await setupCommand(name, summary.description, argv, meta);

    for (const [configName, config] of Object.entries(configs)) {
      const summarizedRules = summarizeConfigs({ [configName]: config });

      printConfigSummary(configName, summarizedRules, {
        markdown: markdownOutput,
        skipLinks,
        table,
        verboseConfigs,
      });
    }
  },
};

// Internal functions

/**
 * @param {string} name
 * @param {string} description
 * @param {string[]} args
 * @param {import('peowly-commands').CliMeta} meta
 * @returns {Promise<import('./command-types.d.ts').CommandContextSummary>}
 */
async function setupCommand (name, description, args, { pkg }) {
  const options = /** @satisfies {import('peowly').AnyFlags} */ ({
    ...baseFlags,
    ...inputFlags,
    ...outputFlags,
  });

  const {
    flags: {
      verbose,
      ...remainingFlags
    },
    input,
  } = peowly({
    args,
    description,
    examples: [
      '',
      '-t foo.js alternative.eslintrc.json',
    ],
    name,
    options,
    pkg,
    usage: '<eslint config files, separated by spaces>',
  });

  const configFiles = [...input];

  if (configFiles.length === 0) {
    configFiles.unshift('.eslintrc');
  }

  /** @type {import('./command-types.js').CommandContextSummary} */
  const result = {
    verbose,
    ...await resolveInputContext(remainingFlags, configFiles),
    ...resolveOutputFlags(remainingFlags),
  };

  return result;
}
