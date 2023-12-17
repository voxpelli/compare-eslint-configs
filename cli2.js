/* eslint-disable no-console */

import chalk from 'chalk';
import { meowWithSubcommands } from 'meow-with-subcommands';
import { messageWithCauses, stackWithCauses } from 'pony-cause';

import cliCommands from './lib/commands/index.js';
import { InputError } from './lib/utils/errors.js';

try {
  await meowWithSubcommands(
    cliCommands,
    {
      argv: process.argv.slice(2),
      name: 'compare-eslint-configs',
      importMeta: import.meta,
    }
  );
} catch (err) {
  /** @type {string} */
  let errorTitle;
  /** @type {string} */
  let errorMessage = '';
  /** @type {string} */
  let errorDetails = '';
  /** @type {string|undefined} */
  let errorBody;

  if (err instanceof InputError) {
    errorTitle = 'Invalid input';
    errorMessage = err.message;
    errorBody = err.body;
    errorDetails = err.cause ? messageWithCauses(err.cause) : '';
  } else if (err instanceof Error) {
    errorTitle = 'Unexpected error';
    errorMessage = messageWithCauses(err);
    errorBody = stackWithCauses(err);
  } else {
    errorTitle = 'Unexpected error with no details';
  }

  console.error(`\n${chalk.white.bgRed(errorTitle + ':')} ${errorMessage} `);
  if (errorDetails) {
    console.error('\n' + chalk.dim(errorDetails));
  }
  if (errorBody) {
    console.error('\n' + errorBody);
  }

  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}
