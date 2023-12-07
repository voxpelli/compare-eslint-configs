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
import { zipObject } from './lib/utils.js';
import { printConfigSummary } from './lib/print-summary.js';

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
    --summary      -s  Prints a summary of the specified configs instead
    --diff         -d  Prints what's changed between the second and the first file
    --target-file  -t  The file context which the eslint config should be compared in. Defaults to index.js

  Additional options
    --help             Print this help and exits.
    --version          Prints current version and exits.

  Examples
    $ compare-eslint -t foo.js .eslintrc alternative.eslintrc.json
`, {
  importMeta: import.meta,
  flags: {
    diff: { alias: 'd', type: 'boolean', 'default': false },
    groupRules: { alias: 'r', type: 'boolean', 'default': false },
    json: { alias: 'j', type: 'boolean', 'default': false },
    links: { type: 'boolean', 'default': true },
    markdown: { alias: 'm', type: 'boolean', 'default': false },
    summary: { alias: 's', type: 'boolean', 'default': false },
    table: { type: 'boolean', 'default': false },
    targetFile: { alias: 't', type: 'string', 'default': 'index.js' },
    verboseConfigs: { type: 'boolean', 'default': false },
  },
});

const {
  diff,
  groupRules: groupByRule,
  json: jsonOutput,
  links,
  markdown,
  summary,
  table,
  targetFile,
  verboseConfigs,
} = cli.flags;

if (markdown && jsonOutput) {
  console.error(chalk.bgRed('Conflicting options:') + ' Can\'t chose both JSON and Markdown at once');
  process.exit(1);
}
if (diff && summary) {
  console.error(chalk.bgRed('Conflicting options:') + ' Can\'t chose both diff and summary at once');
  process.exit(1);
}
if (jsonOutput && !diff) {
  console.error(chalk.bgRed('Unsupported output:') + ' JSON output is currently only supported for diffs');
  process.exit(1);
}

const configFiles = [...cli.input];

if (configFiles.length === 0) {
  if (!summary) {
    cli.showHelp();
    process.exit(1);
  }
  configFiles.unshift('.eslintrc');
} else if (configFiles.length === 1 && !summary) {
  if (configFiles[0] === '.eslintrc') {
    console.error(chalk.bgRed('Can\'t compare:') + ' There is nothing to compare .eslintrc to, add another config');
    process.exit(1);
  }

  configFiles.unshift('.eslintrc');
}

const targetAbsolute = path.resolve(cwd(), targetFile);
// eslint-disable-next-line security/detect-non-literal-fs-filename
const targetStat = await stat(targetAbsolute).catch(() => {});

if (!targetStat || !targetStat.isFile) {
  // TODO: Add a fallback that automatically finds a JS file in the current folder
  console.error(chalk.bgRed('Invalid target:') + ` Can't find "${targetAbsolute}", set a target with --target-file`);
  process.exit(1);
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
    if (!jsonOutput) {
      console.error(chalk.bgRed('Unsupported output:') + ' JSON output is currently the only supported output for diffs');
      process.exit(1);
    }
    if (configFiles.length > 2) {
      console.error(chalk.bgRed('Too many configs:') + ' Diff calculation only works when given two configs');
      process.exit(1);
    }

    const targetConfigName = configFiles[0] || '';
    const sourceConfigName = configFiles[1] || '';

    const targetConfig = configs[targetConfigName];
    const sourceConfig = configs[sourceConfigName];

    if (!targetConfig || !sourceConfig) {
      console.error(chalk.bgRed('Too few configs:') + ' Diff calculation only works when given two configs');
      process.exit(1);
    }

    const diffResult = diffConfigs(
      { configName: targetConfigName, config: targetConfig },
      { configName: sourceConfigName, config: sourceConfig }
    );

    if (diffResult) {
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
      process.exit(2);
    }
  } else {
    const differences = compareConfigs(configs);

    printComparationResult(differences, configFiles, {
      groupByRule,
      markdown,
      skipLinks: !links,
      table,
      verboseConfigs,
    });
  }
} catch (err) {
  console.error(
    chalk.bgRed('Unexpected error:') +
    (err instanceof Error ? ' ' + messageWithCauses(err) + '\n\n' + stackWithCauses(err) : '') +
    '\n'
  );
  process.exit(1);
}
