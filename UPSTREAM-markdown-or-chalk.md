## Feature Requests

- **Smart JSON rendering with verbose/inline/placeholder modes** (2026-03-29) — `formatJsonForMdast` in lib/format-json.js implements logic to render JSON as inline code (simple values), collapsible `<details>` blocks (complex values), or placeholder text (non-verbose mode). This pattern is useful for any tool rendering structured data with markdown-or-chalk. A `formatConditionalJson(data, { verbose, summary })` export would DRY up consumers.
  Ownership: upstream · Workaround: full — implemented locally in lib/format-json.js (54 lines)

- **Chalk-only column padding helper** (2026-03-29) — print-diff.js and print-summary.js both manually pad rule names for column alignment in terminal mode, skipping padding in markdown mode. A `format.padForChalk(width)` or similar method would reduce this repeated pattern.
  Ownership: upstream · Workaround: full — manual padding in each print module

## Bugs

_No entries yet._

## Upstream Opportunities

_No entries yet._
