# Compare ESLint configs

[![npm version](https://img.shields.io/npm/v/compare-eslint-configs.svg?style=flat)](https://www.npmjs.com/package/compare-eslint-configs)
[![npm downloads](https://img.shields.io/npm/dm/compare-eslint-configs.svg?style=flat)](https://www.npmjs.com/package/compare-eslint-configs)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/voxpelli/eslint-config)
[![ES Module Ready Badge](https://img.shields.io/badge/es%20module%20ready-yes-success.svg)](https://esmodules.dev/)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)

## Requirements

- Node.js `^20.15.0 || >=22.2.0`
- ESLint 9+ (flat config format — `eslint.config.js`)

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

## Options

Found by running `compare-eslint-configs <command> --help`, eg: `compare-eslint-configs compare --help`

## Example

### CLI output

```bash
npx compare-eslint-configs compare other.eslint.config.js -f cli.js
```

### Markdown output

```bash
npx compare-eslint-configs compare other.eslint.config.js -f cli.js -m
```

### Inspect a config

```bash
npx compare-eslint-configs inspect eslint.config.js --show-rules
```

## Migration from v2

v3 requires ESLint 9+ flat config format (`eslint.config.js`). If you're still using `.eslintrc`, first migrate your configs using the [ESLint migration guide](https://eslint.org/docs/latest/use/configure/migration-guide), then use v3.

Key changes:
- `--target-file` / `-t` renamed to `--for-file` / `-f` (old flag still works with deprecation warning)
- Commands auto-detect `eslint.config.js` instead of `.eslintrc`

## See also

* [`@voxpelli/eslint-formatter-summary`](https://github.com/voxpelli/eslint-formatter-summary) – can summarize errors/warnings by ESLint rule + print that list as markdown
