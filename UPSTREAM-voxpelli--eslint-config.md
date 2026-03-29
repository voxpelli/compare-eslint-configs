## Feature Requests

- **`rules` pass-through in `voxpelli()` options** (2026-03-29) — `voxpelli({ rules: { 'func-style': ['warn', ...] } })` silently drops the `rules` option because neither `voxpelli()` nor `neostandard()` destructures it. Consumers must add rule overrides as separate config objects after the spread, which is non-obvious and not documented.
  Ownership: upstream · Workaround: full — add overrides as separate config objects in the flat config array

- **ESLint 10 peer dependency** (2026-03-29) — `peerDependencies.eslint: ^9.13.0` blocks ESLint 10 resolution in downstream projects. v25 is expected to widen this, but the timeline is unclear. Downstream tools declaring `eslint: ^9.13.0 || ^10.0.0` must use `--legacy-peer-deps` for dev workflows until this is resolved.
  Ownership: upstream · Workaround: partial — `--legacy-peer-deps` during install, restrict `check:lint` to ESLint 9

## Bugs

_No entries yet._

## Upstream Opportunities

- **Document `noMocha` option and `rules` limitation in README** (2026-03-29) — `voxpelli()` accepts `noMocha: true` to disable mocha rules, but this is not documented. The `rules` option being silently ignored is also undocumented. A "Configuration" section showing all options and the correct rule override pattern (separate config objects) would prevent the gotcha.
  Source: discovered during eslint.config.js migration · Merge readiness: direct — docs PR
  Ownership: us · Workaround: full — documented in CLAUDE.md and BM note
