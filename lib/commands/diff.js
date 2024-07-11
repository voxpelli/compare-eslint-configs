import { peowly } from 'peowly';

import { InputError } from '../utils/errors.js';

import { baseFlags } from '../flags/misc.js';
import { outputFlags, resolveOutputFlags } from '../flags/output.js';
import { inputFlags, resolveInputContext } from '../flags/input.js';
import { diffConfigs } from '../compare.js';
import { printDiffResult } from '../print-diff.js';

/** @type {import('peowly-commands').CliCommand} */
export const diff = {
  description: 'Prints what\'s changed between the second and the first file',

  async run (argv, meta, { parentName }) {
    const name = parentName + ' diff';

    const context = await setupCommand(name, diff.description, argv, meta);

    const workResult = context && await doTheWork(context);

    if (workResult) {
      formatWorkResult(workResult, context);
    }
  },
};

// Internal functions

/**
 * @param {string} name
 * @param {string} description
 * @param {string[]} args
 * @param {import('peowly-commands').CliMeta} meta
 * @returns {Promise<import('./command-types.d.ts').CommandContextDiff>}
 */
async function setupCommand (name, description, args, { pkg }) {
  const options = /** @satisfies {import('peowly').AnyFlags} */ ({
    ...baseFlags,
    ...inputFlags,
    ...outputFlags,
    'exit-code': {
      description: 'Make the program exit with codes similar to diff, 1 if there were differences else 0',
      listGroup: 'Diff options',
      'short': 'e',
      type: 'boolean',
      'default': false,
    },
  });

  const {
    flags: {
      'exit-code': exitCode,
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
    usage: '[<source config file if not .eslintrc>] <target config file>',
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

  /** @type {import('./command-types.js').CommandContextDiff} */
  const result = {
    exitCode,
    verbose,
    ...await resolveInputContext(remainingFlags, configFiles),
    ...resolveOutputFlags(remainingFlags),
  };

  return result;
}

/**
 * @param {Pick<import('./command-types.d.ts').CommandContextDiff, 'configFiles' | 'configs' | 'verbose'>} context
 * @returns {Promise<false|import('../compare.js').ConfigDiff>}
 */
async function doTheWork (context) {
  const { configFiles, configs, verbose } = context;

  const targetConfigName = configFiles[0] || '';
  const sourceConfigName = configFiles[1] || '';

  const targetConfig = configs[targetConfigName];
  const sourceConfig = configs[sourceConfigName];

  if (configFiles.length > 2 || !targetConfig || !sourceConfig) {
    throw new InputError('Diff calculation only works when given two configs');
  }

  return diffConfigs(
    { configName: targetConfigName, config: targetConfig },
    { configName: sourceConfigName, config: sourceConfig },
    { verbose }
  );
}

/**
 * @param {import('../compare.js').ConfigDiff} diffResult
 * @param {Omit<import('./command-types.d.ts').CommandContextDiff, 'configFiles' | 'configs' | 'verbose'>} context
 * @returns {void}
 */
function formatWorkResult (diffResult, context) {
  const {
    exitCode,
    // TODO: Remove from available options
    // groupByRule,
    jsonOutput,
    markdownOutput,
    skipLinks,
    // TODO: Remove from available options
    // table,
    verboseConfigs,
  } = context;

  if (jsonOutput) {
    const {
      added,
      changedConfig,
      changedSeverity,
      removed,
    } = diffResult;

    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      added,
      changedConfig,
      changedSeverity,
      removed,
    }, undefined, 2));
  } else {
    printDiffResult(diffResult, {
      markdown: markdownOutput,
      skipLinks,
      // table,
      verboseConfigs,
    });
  }

  if (exitCode) {
    process.exitCode = 1;
  }
}
