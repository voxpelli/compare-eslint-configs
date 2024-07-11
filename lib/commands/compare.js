import { peowly } from 'peowly';

import { InputError } from '../utils/errors.js';

import { baseFlags } from '../flags/misc.js';
import { outputFlags, resolveOutputFlags } from '../flags/output.js';
import { inputFlags, resolveInputContext } from '../flags/input.js';
import { compareConfigs } from '../compare.js';
import { printComparationResult } from '../print-result.js';

/** @type {import('peowly-commands').CliCommand} */
export const compare = {
  description: 'Compares the provided eslint config file(s)',

  async run (argv, meta, { parentName }) {
    const name = parentName + ' compare';

    const {
      configFiles,
      configs,
      groupByRule,
      // TODO: Remove flag
      // jsonOutput,
      markdownOutput,
      skipLinks,
      // TODO: Remove flag
      // table,
      // TODO: Remove flag
      // verboseConfigs,
    } = await setupCommand(name, compare.description, argv, meta);

    const differences = compareConfigs(configs);

    printComparationResult(differences, configFiles, {
      groupByRule,
      markdown: markdownOutput,
      skipLinks,
      // table,
      // verboseConfigs,
    });
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
    showHelp,
  } = peowly({
    args,
    description,
    examples: [
      'target.eslintrc.json',
      '-t foo.js source.eslintrc.json target.eslintrc.json',
    ],
    name,
    options,
    pkg,
    usage: '<eslint config files, separated by spaces>',
  });

  const configFiles = [...input];

  if (configFiles.length === 0) {
    showHelp();
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit();
  }
  if (configFiles.length === 1) {
    if (configFiles[0] === '.eslintrc') {
      throw new InputError('There is nothing to compare .eslintrc to, add another config');
    }
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
