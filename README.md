# Compare ESLint configs

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/voxpelli/eslint-config)
[![ES Module Ready Badge](https://img.shields.io/badge/es%20module%20ready-yes-success.svg)](https://esmodules.dev/)
[![Types in JS](https://img.shields.io/badge/types_in_js-yes-brightgreen)](https://github.com/voxpelli/types-in-js)

## Usage

```bash
npm install -g compare-eslint-configs
```

```bash
compare-eslint-configs .eslintrc new.eslintrc
```

Or simply:

```bash
npx compare-eslint-configs .eslintrc new.eslintrc
```

## Syntax

```bash
compare-eslint <eslint config files, separated by spaces>
```

If a single config file is given, then it will be assumed to be compared with `.eslintrc`.

More than two config files can be compafred at once.

### Flags

* `-r` / `--group-rules` – when set the comparison output will group by rules rather than config
* `-t <file>` / `--target-file <file>` – defaults to `index.js` – the file for which the config will be compared. Especially important when there's eg. different configs for `.js` and `.ts` files. Then point this to the one you want to do a comparison on.

## See also

* [`@voxpelli/eslint-formatter-summary`](https://github.com/voxpelli/eslint-formatter-summary) – can summarize errors/warnings by ESLint rule + print that list as markdown
