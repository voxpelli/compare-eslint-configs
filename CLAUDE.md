# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLI tool that compares ESLint configurations (ESLint 9+ flat config format). Four commands: `compare` (multi-config comparison), `diff` (directional two-config diff), `summary` (single-config summary), `inspect` (structure inspection of a flat config). Built on `peowly-commands` for routing and `peowly` for argument parsing.

## Commands

```bash
npm test                  # Full suite: lint + typecheck + knip + installed-check + type-coverage + node:test
npm run check             # Lint + typecheck + knip + installed-check + type-coverage (no tests)
npm run check:tsc         # Type check only
npm run check:lint        # ESLint only
npm run test:node         # node:test tests with c8 coverage
npm run build             # Clean + generate .d.ts declarations
```

Run a single test: `node --test 'test/compare.spec.js'`

Try the CLI locally: `node cli.js compare other.eslint.config.js -f cli.js`

## Architecture

**Data flow**: `cli.js` (error boundary + peowlyCommands router) → `lib/commands/*.js` (parse flags, load configs via `findDefaultConfig()`) → `lib/compare.js` (core logic) → `lib/print-*.js` (format output)

### Core modules

- **`lib/compare.js`** — Three main functions: `summarizeConfigs()` aggregates rules across configs using ESLint's engine + AJV schema validation; `compareConfigs()` categorizes differences (onlyActiveIn, mixedSeverity, mixedConfigs); `diffConfigs()` does directional comparison (added, removed, changed). Extracts deprecated rule metadata where available
- **`lib/commands/`** — Each command is `{ description, run(argv, meta, ctx) }`. Commands: `compare`, `diff`, `summary`, `inspect`. Commands compose flags via spread from `lib/flags/` modules, then call `resolveInputContext()` to load ESLint configs and `resolveOutputFlags()` to validate output options
- **`lib/flags/`** — Modular flag definitions (`input.js`, `output.js`, `misc.js`) with paired `resolve*()` functions that validate and normalize. `--for-file` / `-f` specifies the target file for config resolution (`--target-file` / `-t` still works with deprecation warning)
- **`lib/print-*.js`** — Output formatting via `markdown-or-chalk` for dual CLI/Markdown rendering. Uses MDAST internally for structured content
- **`lib/ajv.cjs`** — Copied from ESLint source (CommonJS required). Configures AJV with Draft-04 meta schema for rule option validation

### Error handling

Two domain error classes in `lib/utils/errors.js`:
- `InputError` → exit code 1 (bad user input)
- `ResultError` → exit code 2 (processing succeeded but result is notable, e.g. diff found differences)

Both caught in `cli.js` error boundary. Uses `pony-cause` for error cause chains.

## Code Conventions

- **ESM only** — `"type": "module"` in package.json
- **Types in JS** — JSDoc annotations checked by `tsc`, never compiled. 99% type-coverage enforced
- **Generated declarations** — `npm run build` creates `.d.ts` files via `declaration.tsconfig.json`. Hand-authored type files: `advanced-types.d.ts`, `flag-types.d.ts`, `command-types.d.ts`
- **One CJS exception** — `lib/ajv.cjs` must be CommonJS (AJV requirement in ESM context)
- **Style** — `@voxpelli/eslint-config` (neostandard-based), `func-style` set to warn with arrow functions allowed
- **exactOptionalPropertyTypes** is enabled — JSDoc optional fields need `string | undefined`, not just `string`
- **Test style** — `node:test` with `node:assert/strict`, c8 coverage

## Gotchas

- **peowly uses kebab-case keys** — `flags['for-file']` not `flags.forFile`. TypedFlags preserves original flag names
- **`stat().isFile()` needs parentheses** — it's a method, not a property. `isFile` without `()` is always truthy
- **`voxpelli()` in eslint.config.js ignores `rules`** — add rule overrides as separate config objects after the spread
- **`getRulesMetaForResults` needs real filePath** — empty string throws in flat config mode. Thread `targetFile` through
- **`calculateConfigForFile` returns `undefined`** when no flat config `files` patterns match (does not throw)
- **ESLint v9 type renames** — `Linter.RuleLevel` → `Linter.RuleSeverity`
- **`ajv.cjs` must stay as CJS** — AJV v6 needs CommonJS; the `useDefaults: true` default-injection is not exposed by ESLint's public API
