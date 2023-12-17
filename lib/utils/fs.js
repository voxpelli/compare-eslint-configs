import { stat } from 'node:fs/promises';
import path from 'node:path';
import { cwd } from 'node:process';

class MissingFileError extends Error {
  /**
   * @param {string} filePath
   * @param {ConstructorParameters<typeof Error>[1]} [options]
   */
  constructor (filePath, options) {
    super(`Can't find file "${filePath}"`, options);

    /** @type {string} */
    this.filePath = filePath;
  }
}

/**
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function ensureExistingFilePathAbsolute (filePath) {
  const absoluteFilePath = path.resolve(cwd(), filePath);
  // TODO: Why did I have a ".catch(() => {})" here at times before?
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const fileStat = await stat(absoluteFilePath)
    .catch(cause => {
      throw new MissingFileError(filePath, { cause });
    });

  if (!fileStat.isFile) {
    throw new MissingFileError(filePath);
  }

  return absoluteFilePath;
}
