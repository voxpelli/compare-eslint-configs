import { peowly } from 'peowly';

import { baseFlags } from '../flags/misc.js';
import { outputFlags, resolveOutputFlags } from '../flags/output.js';
import { findDefaultConfig, inputFlags, resolveInputContext } from '../flags/input.js';
import { summarizeConfigs } from '../compare.js';
import { printConfigSummary } from '../print-summary.js';

/** @type {import('peowly-commands').CliCommand} */
export const summary = {
  description: 'Prints a summary of the specified configs',

  async run (argv, meta, { parentName }) {
    const name = parentName + ' summary';

    const {
      configs,
      jsonOutput,
      markdownOutput,
      skipLinks,
      table,
      targetFile,
      verbose,
      verboseConfigs,
    } = await setupCommand(name, summary.description, argv, meta);

    for (const [configName, config] of Object.entries(configs)) {
      const summarizedRules = summarizeConfigs({ [configName]: config }, { targetFile, verbose });

      if (jsonOutput) {
        // Convert Set to Array for JSON serialization
        /** @type {Record<string, unknown>} */
        const serializable = {};
        for (const [ruleName, summary] of Object.entries(summarizedRules)) {
          serializable[ruleName] = {
            ...summary,
            docUrls: summary.docUrls ? [...summary.docUrls] : undefined,
          };
        }
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(serializable, undefined, 2));
        continue;
      }

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
      '-f foo.js other.eslint.config.js',
    ],
    name,
    options,
    pkg,
    usage: '<eslint config files, separated by spaces>',
  });

  const configFiles = [...input];

  if (configFiles.length === 0) {
    const defaultConfig = await findDefaultConfig(process.cwd());
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
