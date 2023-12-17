import { ESLint } from 'eslint';

import { InputError } from './utils/errors.js';
import { ensureExistingFilePathAbsolute } from './utils/fs.js';
import { zipObject } from './utils/misc.js';

/**
 * @typedef ResolvedConfig
 * @property {import('eslint').Linter.Config} config
 * @property {import('eslint').ESLint} engine
 */

/**
 * @param {string} targetFile
 * @param {ReadonlyArray<string>} configFiles
 * @returns {Promise<Record<string, ResolvedConfig>>}
 */
export async function collectConfigs (targetFile, configFiles) {
  // FIXME: Make configFiles a Set<string>?

  // FIXME: Add somewhere else
  // if (configFiles.length === 0) {
  //   if (!summary) {
  //     cli.showHelp();
  //     process.exit(exitCodeInput);
  //   }
  //   configFiles.unshift('.eslintrc');
  // } else if (configFiles.length === 1 && !summary) {
  //   if (configFiles[0] !== '.eslintrc') {
  //     console.error(chalk.bgRed('Can\'t compare:') + ' There is nothing to compare .eslintrc to, add another config');
  //     process.exit(exitCodeInput);
  //   }
  //   configFiles.unshift('.eslintrc');
  // }

  if (configFiles.length < 2 && configFiles[0] !== '.eslintrc') {
    configFiles = ['.eslintrc'];
  }

  const [
    targetAbsolute,
    ...configFilesAbsolute
  ] = await Promise.all([
    ensureExistingFilePathAbsolute(targetFile).catch(cause => {
      throw new InputError('Missing target file', undefined, { cause });
    }),
    ...configFiles.map(configFile =>
      ensureExistingFilePathAbsolute(configFile)
        .catch(cause => {
          throw new InputError('Missing config file', undefined, { cause });
        })
    ),
  ]);

  const executions = configFilesAbsolute.map(async configFileAbsolute => {
    const engine = new ESLint({
      useEslintrc: false,
      overrideConfigFile: configFileAbsolute,
    });

    /** @type {ResolvedConfig} */
    const result = {
      config: await engine.calculateConfigForFile(targetAbsolute),
      engine,
    };

    return result;
  });

  return zipObject(configFiles, await Promise.all(executions));
}
