## Feature Requests

- **Public API for rule schema default injection** (2026-03-29) — ESLint's internal AJV setup with `useDefaults: true` is the only way to compute schema-default values for rule options. This is not exposed publicly, forcing tools like compare-eslint-configs to copy `lib/shared/ajv.js` as `ajv.cjs`. A public `getRuleDefaults(ruleId)` or schema-with-defaults API would eliminate the need for the copied file.
  Ownership: upstream · Workaround: full — copy of ESLint's internal ajv.js (lib/ajv.cjs)

- **`engine.getRulesMeta(ruleIds, { filePath })` API** (2026-03-29) — Currently `getRulesMetaForResults` requires constructing fake `LintResult` objects with fabricated messages just to look up rule metadata. A cleaner API that takes rule IDs directly would eliminate the synthetic result hack. Related: ESLint issue [#18619](https://github.com/eslint/eslint/issues/18619) by @voxpelli requests `calculateConfigArray` and `findFiles` exports.
  Ownership: upstream · Workaround: full — synthetic LintResult with real filePath

## Bugs

- **`getRulesMetaForResults` throws on empty filePath in flat config** (2026-03-29) [minor] — Passing `filePath: ''` in a synthetic `LintResult` object causes `TypeError: Results object was not created from this ESLint instance` because the empty string doesn't match any config. The error message is misleading. Should either accept empty string or throw a descriptive error.
  Severity: minor · Ownership: upstream · Workaround: full — pass a real file path from `calculateConfigForFile`

## Upstream Opportunities

- **Programmatic config introspection documentation** (2026-03-29) — The `overrideConfigFile → calculateConfigForFile → getRulesMetaForResults` pipeline for programmatic config loading is undocumented in ESLint's "Programmatic Usage" guide. A single code example covering this pipeline (including the empty-filePath gotcha and undefined-return guard) would prevent repeated reinvention by ESLint tooling authors.
  Source: lib/flags/input.js + lib/compare.js · Merge readiness: direct — documentation PR only
  Ownership: us · Workaround: full — documented in project CLAUDE.md

- **Core comparison engine as `eslint-config-diff` library** (2026-03-29) — The engine (496 LOC: `summarizeConfigs`/`compareConfigs`/`diffConfigs` + AJV helpers + deep diff) is cleanly bounded with zero CLI dependencies. No competing programmatic ESLint config comparison library exists on npm. Extracting would enable CI bots, IDE extensions, and migration tools to compare configs without spawning the CLI.
  Source: lib/compare.js, lib/ajv.cjs, lib/ajv-helper.js, lib/utils/diff.js · Merge readiness: needs-redesign — boundary exists but needs package scaffolding and API docs
  Ownership: us · Workaround: full — CLI tool works, but no programmatic API for consumers

- **Migrate `findDefaultConfig` to `ESLint.findConfigFile()`** (2026-03-29) — ESLint v9+ provides `ESLint.findConfigFile()` which does the same flat config discovery. Our manual `FLAT_CONFIG_NAMES` list is a maintenance liability. Should migrate to the official API.
  Source: lib/flags/input.js (findDefaultConfig) · Merge readiness: direct — replace local code with ESLint API call
  Ownership: us · Workaround: full — current implementation works
