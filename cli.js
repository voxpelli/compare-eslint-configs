#!/usr/bin/env node
/* eslint-disable no-console */

import { stat } from 'node:fs/promises';
import path from 'node:path';
import { cwd } from 'node:process';

import chalk from 'chalk';
import { ESLint } from 'eslint';
import meow from 'meow';
import { messageWithCauses, stackWithCauses } from 'pony-cause';

import { compareConfigs } from './lib/compare.js';
import { printComparationResult } from './lib/print-result.js';
import { zipObject } from './lib/utils.js';

const cli = meow(`
  Usage
    $ compare-eslint -t <target file> <eslint config files, separated by spaces>

  Compares the provided eslint config files.

  Options
    -t, --target   The target file to compare the config for. Defaults to index.js
    --help         Print this help and exits.
    --version      Prints current version and exits.

  Examples
    $ compare-eslint -t foo.js .eslintrc alternative.eslintrc.json
`, {
  importMeta: import.meta,
  flags: {
    target: {
      alias: 't',
      type: 'string',
    },
  }
});

const {
  target = 'index.js',
} = cli.flags;

const configFiles = [...cli.input];

const targetAbsolute = path.resolve(cwd(), target);

if (configFiles.length === 0) {
  console.error(chalk.bgRed('Missing files:') + ' You need to provide at least one config files\n');
  process.exit(1);
} else if (configFiles.length === 1) {
  configFiles.unshift('.eslintrc');
}

const targetStat = await stat(targetAbsolute);
if (!targetStat.isFile) {
  console.error(chalk.bgRed('Invalid target:') + ` Can't find target file "${targetAbsolute}"\n`);
  process.exit(1);
}

// TODO: First check that both configs exist? And/or generate the configs on the fly?
// TODO: Make target file configurable?

try {
  const executions = configFiles.map(async configFile => {
    const configFileAbsolute = path.resolve(cwd(), configFile);
    const configStat = await stat(configFileAbsolute);

    if (!configStat.isFile) {
      throw new Error(`Can't find a config file named "${configFileAbsolute}"`);
    }

    const engine = new ESLint({
      useEslintrc: false,
      overrideConfigFile: configFileAbsolute
    });

    /** @type {import('eslint').Linter.Config} */
    const config = await engine.calculateConfigForFile(targetAbsolute);

    return config;
  });

  const configs = zipObject(configFiles, await Promise.all(executions));

  const differences = compareConfigs(configs);

  printComparationResult(differences, configFiles);
} catch (err) {
  console.error(
    chalk.bgRed('Unexpected error:') +
    (err instanceof Error ? ' ' + messageWithCauses(err) + '\n\n' + stackWithCauses(err) : '') +
    '\n'
  );
  process.exit(1);
}