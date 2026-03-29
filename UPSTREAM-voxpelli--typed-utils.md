## Feature Requests

_No entries yet._

## Bugs

_No entries yet._

## Upstream Opportunities

- **`getDeepDifference` — one-directional structural diff** (2026-03-29) — Generic utility (89 LOC) that returns only the portions of valueB that differ from valueA, recursing into plain objects and arrays. Uses `DeepPartial<T>` return type. No equivalent exists on npm — `deep-object-diff`, `microdiff`, and `just-diff` all return operation lists, not a filtered partial. Already has a full test suite (12 cases). Uses `fast-deep-equal` and `is-plain-obj` which would become new deps for typed-utils.
  Source: lib/utils/diff.js + lib/advanced-types.d.ts · Merge readiness: direct — self-contained, well-typed, full test suite
  Ownership: us · Workaround: full — works as local utility
