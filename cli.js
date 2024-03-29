#!/usr/bin/env node
/* eslint-disable no-console */

import { stat } from 'node:fs/promises';
import path from 'node:path';
import { cwd } from 'node:process';

import chalk from 'chalk';
import { ESLint } from 'eslint';
import meow from 'meow';
import { messageWithCauses, stackWithCauses } from 'pony-cause';

import { compareConfigs, diffConfigs, summarizeConfigs } from './lib/compare.js';
import { printComparationResult } from './lib/print-result.js';
import { zipObject } from './lib/utils/misc.js';
import { printConfigSummary } from './lib/print-summary.js';
import { printDiffResult } from './lib/print-diff.js';

const exitCodeDiff = 1;
const exitCodeInput = 2;
const exitCodeException = 3;

const cli = meow(`
  Usage
    $ compare-eslint <eslint config files, separated by spaces>

  Compares or summarizes the provided eslint config file(s).

  Presentation options
    --group-rules  -r  Prints the rules that only exists in some configs grouped by rule rather than config.
    --json         -j  Output the results as JSON instead.
    --markdown     -m  Format the result as Markdown instead. Useful for copy and pasting into eg. GitHub.
    --no-links         Skips adding hyperlinks to rule documentation
    --table            Prints the output in a table format rather than list format
    --verbose-configs  Includes full config data in the output, even the complex one

  Comparison options
    --diff         -d  Prints what's changed between the second and the first file
    --summary      -s  Prints a summary of the specified configs instead
    --target-file  -t  The file context which the eslint config should be compared in. Defaults to index.js

  Diff options
    --exit-code    -e  Make the program exit with codes similar to diff, 1 if there were differences else 0

  Additional options
    --help             Print this help and exits.
    --verbose      -v  Prints verbose output such as debug messages
    --version          Prints current version and exits.

  Examples
    $ compare-eslint -t foo.js .eslintrc alternative.eslintrc.json
`, {
  importMeta: import.meta,
  flags: {
    diff: { shortFlag: 'd', type: 'boolean', 'default': false },
    exitCode: { shortFlag: 'e', type: 'boolean', 'default': false },
    groupRules: { shortFlag: 'r', type: 'boolean', 'default': false },
    json: { shortFlag: 'j', type: 'boolean', 'default': false },
    links: { type: 'boolean', 'default': true },
    markdown: { shortFlag: 'm', type: 'boolean', 'default': false },
    summary: { shortFlag: 's', type: 'boolean', 'default': false },
    table: { type: 'boolean', 'default': false },
    targetFile: { shortFlag: 't', type: 'string', 'default': 'index.js' },
    verbose: { shortFlag: 'v', type: 'boolean', 'default': false },
    verboseConfigs: { type: 'boolean', 'default': false },
  },
});

const {
  diff,
  exitCode,
  groupRules: groupByRule,
  json: jsonOutput,
  links,
  markdown,
  summary,
  table,
  targetFile,
  verbose,
  verboseConfigs,
} = cli.flags;

if (markdown && jsonOutput) {
  console.error(chalk.bgRed('Conflicting options:') + ' Can\'t chose both JSON and Markdown at once');
  process.exit(exitCodeInput);
}
if (diff && summary) {
  console.error(chalk.bgRed('Conflicting options:') + ' Can\'t chose both diff and summary at once');
  process.exit(exitCodeInput);
}
if (jsonOutput && !diff) {
  console.error(chalk.bgRed('Unsupported output:') + ' JSON output is currently only supported for diffs');
  process.exit(exitCodeInput);
}

const configFiles = [...cli.input];

if (configFiles.length === 0) {
  if (!summary) {
    cli.showHelp();
    process.exit(exitCodeInput);
  }
  configFiles.unshift('.eslintrc');
} else if (configFiles.length === 1 && !summary) {
  if (configFiles[0] === '.eslintrc') {
    console.error(chalk.bgRed('Can\'t compare:') + ' There is nothing to compare .eslintrc to, add another config');
    process.exit(exitCodeInput);
  }

  configFiles.unshift('.eslintrc');
}

const targetAbsolute = path.resolve(cwd(), targetFile);
// eslint-disable-next-line security/detect-non-literal-fs-filename
const targetStat = await stat(targetAbsolute).catch(() => {});

if (!targetStat || !targetStat.isFile) {
  // TODO: Add a fallback that automatically finds a JS file in the current folder
  console.error(chalk.bgRed('Invalid target:') + ` Can't find "${targetAbsolute}", set a target with --target-file`);
  process.exit(exitCodeInput);
}

try {
  const executions = configFiles.map(async configFile => {
    const configFileAbsolute = path.resolve(cwd(), configFile);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const configStat = await stat(configFileAbsolute);

    if (!configStat.isFile) {
      throw new Error(`Can't find a config file named "${configFileAbsolute}"`);
    }

    const engine = new ESLint({
      useEslintrc: false,
      overrideConfigFile: configFileAbsolute,
    });

    /** @type {import('eslint').Linter.Config} */
    const config = await engine.calculateConfigForFile(targetAbsolute);

    return { config, engine };
  });

  const configs = zipObject(configFiles, await Promise.all(executions));

  if (summary) {
    for (const [configName, config] of Object.entries(configs)) {
      const summarizedRules = summarizeConfigs({ [configName]: config });

      printConfigSummary(configName, summarizedRules, {
        markdown,
        skipLinks: !links,
        table,
        verboseConfigs,
      });
    }
  } else if (diff) {
    const targetConfigName = configFiles[0] || '';
    const sourceConfigName = configFiles[1] || '';

    const targetConfig = configs[targetConfigName];
    const sourceConfig = configs[sourceConfigName];

    if (configFiles.length > 2 || !targetConfig || !sourceConfig) {
      console.error(chalk.bgRed('Incorrect number of configs:') + ' Diff calculation only works when given two configs');
      process.exit(exitCodeInput);
    }
    if (table) {
      console.error(chalk.bgRed('Unsupported option:') + ' Table is not yet supported for comparison output');
      process.exit(exitCodeInput);
    }

    const diffResult = diffConfigs(
      { configName: targetConfigName, config: targetConfig },
      { configName: sourceConfigName, config: sourceConfig },
      { verbose }
    );

    if (diffResult) {
      if (jsonOutput) {
        const {
          added,
          changedConfig,
          changedSeverity,
          removed,
        } = diffResult;

        console.log(JSON.stringify({
          added,
          changedConfig,
          changedSeverity,
          removed,
        }, undefined, 2));
      } else {
        printDiffResult(diffResult, {
          markdown,
          skipLinks: !links,
          // table,
          verboseConfigs,
        });
      }

      process.exit(exitCode ? exitCodeDiff : 0);
    }
  } else {
    const differences = compareConfigs(configs);

    if (table) {
      console.error(chalk.bgRed('Unsupported option:') + ' Table is not yet supported for comparison output');
      process.exit(exitCodeInput);
    }
    if (verboseConfigs) {
      console.error(chalk.bgRed('Unsupported option:') + ' Verbose configs are not yet supported for comparison output');
      process.exit(exitCodeInput);
    }

    printComparationResult(differences, configFiles, {
      groupByRule,
      markdown,
      skipLinks: !links,
      // table,
      // verboseConfigs,
    });
  }
} catch (err) {
  console.error(
    chalk.bgRed('Unexpected error:') +
    (err instanceof Error ? ' ' + messageWithCauses(err) + '\n\n' + stackWithCauses(err) : '') +
    '\n'
  );
  process.exit(exitCodeException);
}
