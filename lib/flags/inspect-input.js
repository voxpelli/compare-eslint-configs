import { stat } from 'node:fs/promises';
import path from 'node:path';
import { cwd } from 'node:process';
import { pathToFileURL } from 'node:url';

import { typesafeIsArray } from '@voxpelli/typed-utils';

import { InputError } from '../utils/errors.js';

/**
 * @param {Record<string, unknown>} _flags
 * @param {string} configFile
 * @returns {Promise<import('./flag-types.js').InspectInputContext>}
 */
export async function resolveInspectInput (_flags, configFile) {
  const configAbsolute = path.resolve(cwd(), configFile);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const configStat = await stat(configAbsolute).catch(() => {});

  if (!configStat?.isFile()) {
    throw new InputError(`Can't find config file "${configAbsolute}"`);
  }

  const fileUrl = pathToFileURL(configAbsolute).href;
  const mod = await import(fileUrl);
  const rawConfigs = mod.default;

  if (!typesafeIsArray(rawConfigs)) {
    throw new InputError(`"${configFile}" does not export a flat config array as its default export`);
  }

  return { configFile, rawConfigs };
}
