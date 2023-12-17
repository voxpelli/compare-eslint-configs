import meow from 'meow';
import { formatHelpMessage } from 'meow-with-subcommands';

import { sharedFlags } from '../../flags/index.js';
import { InputError } from '../../utils/errors.js';
import { summarizeConfigs } from '../../compare.js';
import { collectConfigs } from '../../collect-configs.js';
import { printConfigSummary } from './print-summary.js';
import { pick, pickWithKeys } from '../../utils/misc.js';

const commandName = 'summary';

/** @type {import('meow-with-subcommands').CliSubcommand} */
const command = {
  description: 'Summarises an ESLint config for CLI or Markdown',
  async run (argv, importMeta, { parentName }) {
    const name = `${parentName} ${commandName}`;

    const input = setupCommand(name, command.description, argv, importMeta);

    if (!input) {
      return;
    }

    const {
      configFiles,
      printOptions,
      targetFile,
    } = input;

    const configs = await collectConfigs(targetFile, configFiles);

    for (const [configName, config] of Object.entries(configs)) {
      const summarizedRules = summarizeConfigs({ [configName]: config });

      printConfigSummary(configName, summarizedRules, printOptions);
    }
  },
};

export default { [commandName]: command };

// Internal functions

/**
 * @typedef CommandContext
 * @property {string[]} configFiles
 * @property {string} targetFile
 * @property {import('./print-summary.js').PrintConfigSummaryOptions} printOptions
 */

/**
 * @param {string} name
 * @param {string} description
 * @param {readonly string[]} argv
 * @param {ImportMeta} importMeta
 * @returns {void|CommandContext}
 */
function setupCommand (name, description, argv, importMeta) {
  const {
    picked: flags,
    pickedKeys: flagKeys,
  } = pickWithKeys(
    sharedFlags,
    [
      'links',
      'markdown',
      'table',
      'targetFile',
      'verboseConfigs',
    ]
  );

  const cli = meow(formatHelpMessage(name, {
    flags,
    usage: '<eslint config file>',
  }), { argv, description, importMeta, flags });

  const configFiles = cli.input;

  const {
    links: includeLinks,
    markdown: outputMarkdown,
    targetFile,
    ...printOptions
  } = pick(cli.flags, flagKeys);

  if (configFiles.length > 1) {
    throw new InputError('Can only summarize one config at a time');
  }

  /** @type {CommandContext} */
  const result = {
    configFiles,
    targetFile,
    printOptions: {
      outputMarkdown,
      skipLinks: !includeLinks,
      ...printOptions,
    },
  };

  return result;
}
