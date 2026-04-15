# Compare ESLint configs

[![npm version](https://img.shields.io/npm/v/compare-eslint-configs.svg?style=flat)](https://www.npmjs.com/package/compare-eslint-configs)
[![npm downloads](https://img.shields.io/npm/dm/compare-eslint-configs.svg?style=flat)](https://www.npmjs.com/package/compare-eslint-configs)
[![neostandard-style](https://img.shields.io/badge/code%20style-neostandard-brightgreen.svg)](https://github.com/neostandard/neostandard)
[![ES Module Ready Badge](https://img.shields.io/badge/es%20module%20ready-yes-success.svg)](https://esmodules.dev/)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)

Compares two or more ESLint flat config files and reports which rules differ — active in some but not others, different severities, or different options. Built for validating config migrations and auditing shared configs.

## Requirements

- Node.js `^20.19.0 || ^22.13.0 || >=24.0.0`
- ESLint 9 or 10 (flat config format — `eslint.config.js`)

## Usage

```bash
npm install -g compare-eslint-configs
compare-eslint-configs compare eslint.config.js other.eslint.config.js
```

Or simply:

```bash
npx compare-eslint-configs compare eslint.config.js other.eslint.config.js
```

## Commands

Found by running `compare-eslint-configs --help`

  * **compare** - compares the provided eslint config file(s)
  * **diff** - prints what's changed between the second and the first file
  * **summary** - prints a summary of the specified configs
  * **inspect** - inspects the structure of a flat eslint.config.js file
  * **audit** - audits a config for deprecated rules and coverage stats

## Example

### Compare configs

```bash
# Compare your config against another config file
npx compare-eslint-configs compare eslint.config.js path/to/other-eslint.config.js

# Specify which file to compute rules for
npx compare-eslint-configs compare eslint.config.js other.eslint.config.js -f src/index.ts
```

### Diff two configs

```bash
# Show what changed between two configs (directional)
npx compare-eslint-configs diff old.eslint.config.js new.eslint.config.js

# Output as JSON for CI pipelines
npx compare-eslint-configs diff old.eslint.config.js new.eslint.config.js --json
```

### Summarize a config

```bash
# Show all rules in a config
npx compare-eslint-configs summary eslint.config.js

# Table format with markdown output
npx compare-eslint-configs summary eslint.config.js --table -m
```

### Inspect config structure

```bash
# Show the flat config array structure
npx compare-eslint-configs inspect eslint.config.js

# Include rule names in each config object
npx compare-eslint-configs inspect eslint.config.js --show-rules
```

### Audit a config

```bash
# Check for deprecated rules and coverage stats
npx compare-eslint-configs audit eslint.config.js

# Show all builtin ESLint rules not present in the config
npx compare-eslint-configs audit eslint.config.js --show-unconfigured

# Exit with code 1 if deprecated rules found (for CI)
npx compare-eslint-configs audit eslint.config.js --exit-code

# Output as JSON for scripting
npx compare-eslint-configs audit eslint.config.js --json
```

### CI integration

Use `--exit-code` / `-e` with `diff` or `audit` to fail CI pipelines on regressions or deprecated rules:

```bash
# Fail CI if the new config removed or changed any rules vs the old config
npx compare-eslint-configs diff old.eslint.config.js new.eslint.config.js --exit-code

# Fail CI if any deprecated rules are still configured
npx compare-eslint-configs audit eslint.config.js --exit-code
```

## Migration from v2

v3 requires ESLint 9+ flat config format (`eslint.config.js`). If you're still using `.eslintrc`, first migrate your configs using the [ESLint migration guide](https://eslint.org/docs/latest/use/configure/migration-guide), then use v3.

Key changes:
- `--target-file` / `-t` renamed to `--for-file` / `-f` (old flag still works with deprecation warning)
- Commands auto-detect `eslint.config.js` instead of `.eslintrc`

## See also

* [`@voxpelli/eslint-formatter-summary`](https://github.com/voxpelli/eslint-formatter-summary) – can summarize errors/warnings by ESLint rule + print that list as markdown
