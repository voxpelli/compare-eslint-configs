import { stat } from 'node:fs/promises';
import path from 'node:path';
import { cwd } from 'node:process';

import { ESLint } from 'eslint';

import { zipObject } from '../utils/misc.js';
import { InputError } from '../utils/errors.js';

const FLAT_CONFIG_NAMES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
];

/**
 * @param {string} cwd
 * @returns {Promise<string>}
 */
export async function findDefaultConfig (cwd) {
  for (const name of FLAT_CONFIG_NAMES) {
    const configPath = path.resolve(cwd, name);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const configStat = await stat(configPath).catch(() => {});
    if (configStat?.isFile()) {
      return name;
    }
  }
  throw new InputError('No eslint.config.js found in current directory. Pass a config file explicitly.');
}

export const inputFlags = /** @satisfies {Record<string, import('peowly').AnyFlag & { listGroup: 'Input options' }>} */ ({
  targetFile: {
    description: 'The file context which the eslint config should be compared in. Defaults to index.js',
    listGroup: 'Input options',
    'short': 't',
    type: 'string',
    'default': 'index.js',
  },
});

/**
 * @param {import('peowly').TypedFlags<typeof inputFlags>} flags
 * @param {string[]} configFiles
 * @returns {Promise<import('./flag-types.js').InputContext>}
 */
export async function resolveInputContext (flags, configFiles) {
  const {
    targetFile,
  } = flags;

  const targetAbsolute = path.resolve(cwd(), targetFile);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const targetStat = await stat(targetAbsolute).catch(() => {});

  if (!targetStat || !targetStat.isFile) {
    // TODO: Add a fallback that automatically finds a JS file in the current folder
    throw new InputError(`Can't find "${targetAbsolute}", set a target with --target-file`);
  }

  const configs = await resolveConfigs(configFiles, targetAbsolute);

  return {
    configFiles,
    configs,
    targetFile: targetAbsolute,
  };
}

/**
 * @param {string[]} configFiles
 * @param {string} targetAbsolute
 * @returns {Promise<Record<string, { config: import('eslint').Linter.Config, engine: ESLint }>>}
 */
async function resolveConfigs (configFiles, targetAbsolute) {
  const configs = await Promise.all(configFiles.map(async configFile => {
    const engine = await resolveEngine(configFile);

    /** @type {import('eslint').Linter.Config} */
    const config = await engine.calculateConfigForFile(targetAbsolute);

    if (!config) {
      throw new InputError(
        `Config "${configFile}" has no rules for "${targetAbsolute}". ` +
        'Try a different --for-file that matches the config\'s \'files\' patterns.'
      );
    }

    return { config, engine };
  }));

  const result = zipObject(configFiles, configs);

  return result;
}

/**
 * @param {string} configFile
 * @returns {Promise<ESLint>}
 */
async function resolveEngine (configFile) {
  const configFileAbsolute = path.resolve(cwd(), configFile);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const configStat = await stat(configFileAbsolute);

  if (!configStat.isFile) {
    throw new InputError(`Can't find a config file "${configFileAbsolute}"`);
  }

  const engine = new ESLint({
    overrideConfigFile: configFileAbsolute,
  });

  return engine;
}
