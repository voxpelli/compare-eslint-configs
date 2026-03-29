import { peowly } from 'peowly';

import { InputError } from '../utils/errors.js';
import { findDefaultConfig } from '../flags/input.js';
import { resolveInspectInput } from '../flags/inspect-input.js';
import { auditConfig } from '../audit.js';
import { printAuditResult } from '../print-audit.js';

export const audit = {
  description: 'Audits an ESLint config for deprecated rules and coverage',

  /** @type {import('peowly-commands').CliCommandRun} */
  async run (argv, meta, { parentName }) {
    const name = parentName + ' audit';

    const context = await setupCommand(name, audit.description, argv, meta);
    const result = auditConfig(context.rawConfigs);

    if (context.jsonOutput) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(result, undefined, 2));
    } else {
      printAuditResult(result, {
        markdown: context.markdownOutput,
        skipLinks: context.skipLinks,
        showUnconfigured: context.showUnconfigured,
      });
    }

    if (context.exitCode && result.deprecatedRules.length > 0) {
      process.exitCode = 1;
    }
  },
};

/**
 * @param {string} name
 * @param {string} description
 * @param {string[]} args
 * @param {import('peowly-commands').CliMeta} meta
 * @returns {Promise<import('./command-types.d.ts').CommandContextAudit>}
 */
async function setupCommand (name, description, args, { pkg }) {
  const options = /** @satisfies {Record<string, import('peowly').AnyFlag>} */ ({
    markdown: {
      description: 'Format as Markdown',
      listGroup: 'Output options',
      'short': 'm',
      type: 'boolean',
      'default': false,
    },
    json: {
      description: 'Format as JSON',
      listGroup: 'Output options',
      'short': 'j',
      type: 'boolean',
      'default': false,
    },
    'no-links': {
      description: 'Skip hyperlinks to rule documentation',
      listGroup: 'Output options',
      type: 'boolean',
      'default': false,
    },
    'show-unconfigured': {
      description: 'List all builtin ESLint rules not present in the config',
      listGroup: 'Audit options',
      'short': 'u',
      type: 'boolean',
      'default': false,
    },
    'exit-code': {
      description: 'Exit with 1 if deprecated rules found',
      listGroup: 'Audit options',
      'short': 'e',
      type: 'boolean',
      'default': false,
    },
  });

  const { flags, input } = peowly({
    args,
    description,
    examples: [
      'eslint.config.js',
      '--show-unconfigured eslint.config.js',
      '--json eslint.config.js',
      '-e eslint.config.js',
    ],
    name,
    options,
    pkg,
    usage: '[<flat eslint config file>]',
  });

  if (input.length > 1) {
    throw new InputError('audit accepts only one config file');
  }

  let [configFile] = input;

  if (!configFile) {
    configFile = await findDefaultConfig(process.cwd());
  }

  if (flags.json && flags.markdown) {
    throw new InputError('Cannot use both --json and --markdown');
  }

  const { rawConfigs } = await resolveInspectInput(flags, configFile);

  return {
    configFile,
    rawConfigs,
    markdownOutput: flags.markdown || false,
    jsonOutput: flags.json || false,
    skipLinks: flags['no-links'] || false,
    showUnconfigured: flags['show-unconfigured'] || false,
    exitCode: flags['exit-code'] || false,
  };
}
