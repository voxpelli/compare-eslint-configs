import { peowly } from 'peowly';

import { InputError } from '../utils/errors.js';

import { baseFlags } from '../flags/misc.js';
import { outputFlags, resolveOutputFlags } from '../flags/output.js';
import { findDefaultConfig, inputFlags, resolveInputContext } from '../flags/input.js';
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
      jsonOutput,
      markdownOutput,
      skipLinks,
      targetFile,
      verbose,
    } = await setupCommand(name, compare.description, argv, meta);

    if (jsonOutput) {
      throw new InputError('--json is not supported by the compare command. Use the diff command for JSON output.');
    }

    const differences = compareConfigs(configs, { targetFile, verbose });

    printComparationResult(differences, configFiles, {
      groupByRule,
      markdown: markdownOutput,
      skipLinks,
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
      'other.eslint.config.js',
      '-f foo.js base.eslint.config.js other.eslint.config.js',
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
    const defaultConfig = await findDefaultConfig(process.cwd());
    if (configFiles[0] === defaultConfig) {
      throw new InputError(`There is nothing to compare ${defaultConfig} to, add another config`);
    }
    configFiles.unshift(defaultConfig);
  }

  /** @type {import('./command-types.js').CommandContextSummary} */
  const result = {
    verbose,
    ...await resolveInputContext(remainingFlags, configFiles),
    ...resolveOutputFlags(remainingFlags),
  };

  return result;
}
