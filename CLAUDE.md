# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLI tool that compares ESLint configurations. Three commands: `compare` (multi-config comparison), `diff` (directional two-config diff), `summary` (single-config summary). Built on `peowly-commands` for routing and `peowly` for argument parsing.

## Commands

```bash
npm test                  # Full suite: lint + typecheck + knip + installed-check + type-coverage + mocha
npm run check             # Lint + typecheck + knip + installed-check + type-coverage (no tests)
npm run check:tsc         # Type check only
npm run check:lint        # ESLint only
npm run test:mocha        # Mocha tests with c8 coverage
npm run build             # Clean + generate .d.ts declarations
```

Run a single test: `npx mocha 'test/compare.spec.js'`

Try the CLI locally: `node cli.js compare new.eslintrc -t cli.js`

## Architecture

**Data flow**: `cli.js` (error boundary + peowlyCommands router) → `lib/commands/*.js` (parse flags, load configs) → `lib/compare.js` (core logic) → `lib/print-*.js` (format output)

### Core modules

- **`lib/compare.js`** — Three main functions: `summarizeConfigs()` aggregates rules across configs using ESLint's engine + AJV schema validation; `compareConfigs()` categorizes differences (onlyActiveIn, mixedSeverity, mixedConfigs); `diffConfigs()` does directional comparison (added, removed, changed)
- **`lib/commands/`** — Each command is `{ description, run(argv, meta, ctx) }`. Commands compose flags via spread from `lib/flags/` modules, then call `resolveInputContext()` to load ESLint configs and `resolveOutputFlags()` to validate output options
- **`lib/flags/`** — Modular flag definitions (`input.js`, `output.js`, `misc.js`) with paired `resolve*()` functions that validate and normalize
- **`lib/print-*.js`** — Output formatting via `markdown-or-chalk` for dual CLI/Markdown rendering. Uses MDAST internally for structured content
- **`lib/ajv.cjs`** — Copied from ESLint source (CommonJS required). Configures AJV with Draft-04 meta schema for rule option validation

### Error handling

Two domain error classes in `lib/utils/errors.js`:
- `InputError` → exit code 1 (bad user input)
- `ResultError` → exit code 2 (processing succeeded but result is notable, e.g. diff found differences)

Both caught in `cli.js` error boundary. Uses `pony-cause` for error cause chains.

## Code Conventions

- **ESM only** — `"type": "module"` in package.json
- **Types in JS** — JSDoc annotations checked by `tsc`, never compiled. 95% type-coverage enforced
- **Generated declarations** — `npm run build` creates `.d.ts` files via `declaration.tsconfig.json`. Hand-authored type files: `advanced-types.d.ts`, `flag-types.d.ts`, `command-types.d.ts`
- **One CJS exception** — `lib/ajv.cjs` must be CommonJS (AJV requirement in ESM context)
- **Style** — `@voxpelli/eslint-config` (neostandard-based), `func-style` set to warn with arrow functions allowed
- **Test style** — Mocha + Chai `should()` assertions
