# EMTITHAL — Finalist Implementation Log

Working record for the phased Finalist implementation. One phase at a time; no
phase starts without explicit approval. This file restates decisions already
approved by the product owner — it does not introduce regulatory facts,
weights, sources, or demo claims.

Regulatory source of truth: `REGULATORY_MATRIX_v1.md`
Product source of truth: `FINALIST_PRODUCT_SPEC_v0.4.md`
AI source of truth: `AI_AGENTS_ARCHITECTURE_v1.md`
Visual source of truth: approved Figma file "EMTITHAL — UI Capture (Copy)"

---

## Locked decisions

### B1 — Official Score
- Do **not** compute or display an Official Score number in the Finalist.
- Display only officially published weights where verified (the Hajj experience
  track: 3% track weight, 20% per criterion within the track) as display-only
  metadata — never fed into any computed score.
- The **Emtithal Readiness Index** is the shown metric, clearly labelled as an
  internal product indicator, not a Ministry score.

### B2 — Document precedence
- The four Finalist documents (`REGULATORY_MATRIX_v1.md`,
  `FINALIST_PRODUCT_SPEC_v0.4.md`, `AI_AGENTS_ARCHITECTURE_v1.md`,
  `FIGMA_IMPLEMENTATION_RULES.md`) are the current implementation source of
  truth.
- Older files (`EMTITHAL_MASTER_SPEC.md`, `MVP_REQUIREMENTS.md`) remain on disk,
  untouched, as historical reference. They must not override the Finalist
  documents. Stale code comments that cite them are corrected as each file is
  edited in later phases.

### B3 — Season scope
- Finalist regulatory scope is **1447H only**.
- 1446H requirements are never carried into 1447H automatically.

### B4 — Persistence (with clarification)
- No persistent database and no production authentication backend for the
  Finalist MVP.
- Demo state uses the versioned `localStorage` store.
- Next.js server routes / server actions **are** used — required for real AI
  calls and for secure server-side file parsing.
- API keys and AI calls are never exposed to the browser.

---

## Corrections applied to the plan

### Correction 1 — `AGENTS.md` / `CLAUDE.md`
- Do not add, edit, delete, stage, or commit `AGENTS.md` or `CLAUDE.md`.
- They are currently untracked and stay untouched unless the product owner
  explicitly approves otherwise.
- The earlier cross-phase instruction to commit regenerated `AGENTS.md` blocks
  is removed. If a tool regenerates that block in the working tree, the change
  is left unstaged and excluded from every commit. Commits are scoped to
  explicitly named paths under `src/**` plus named config files.
- `node_modules/next/dist/docs/` is still read for framework API behaviour — a
  read, not an edit.

### Correction 2 — Requirement IDs
- Canonical stored identity is the Regulatory Matrix ID.
- The five experience requirements:

  | Canonical `id` | `legacyIds` |
  | -------------- | ----------- |
  | `HAJ-EXP-01`   | `["CR-001"]` |
  | `HAJ-EXP-02`   | `["CR-002"]` |
  | `HAJ-EXP-03`   | `["CR-003"]` |
  | `HAJ-EXP-04`   | `["CR-004"]` |
  | `HAJ-EXP-05`   | `["CR-005"]` |

- Other authorities use their matrix IDs directly (`HAJ-NUSUK-01`,
  `HAJ-CATERING-01`, `HAJ-CAMP-01`, `HAJ-PROVIDERS-01`, `MOH-01`,
  `CIV-01`…`CIV-05`).
- Legacy IDs are resolved only at the route boundary (backwards-compatible
  redirects). Every stored record, lineage trail, and API payload uses the
  canonical matrix ID.

### Correction 3 — Emtithal Readiness Index (V1 formula, locked)
Requirement-level readiness:
- Quantitative requirement with a verified target **and** verified actual:
  `min(actual / target, 1) * 100`
- Qualitative requirement:
  `(verified-satisfied required sub-requirements / total required sub-requirements) * 100`
- If required data is insufficient: no readiness score; the requirement stays
  `INSUFFICIENT_DATA`.

Overall Emtithal Readiness Index:
- Simple unweighted average of the readiness values of **assessable, APPLICABLE**
  requirements.
- No official weights used (published or not).
- `NOT_APPLICABLE` requirements excluded.
- `INSUFFICIENT_DATA` requirements excluded from the average — never counted as
  0 or 100.
- If no applicable requirement is assessable: **Readiness = `null`**, not 0.

Verification Coverage (calculated separately):
- `(assessable applicable requirements / all applicable requirements) * 100`

UI can therefore show: Readiness + Verification Coverage + Critical Blockers.

Internal criticality:
- `CRITICAL` / `REQUIRED` / `ADVISORY` assignments are **not** inferred and the
  existing `criticalGate` flag does not auto-carry.
- The full mapping is drafted for product-owner approval in Phase 1 and is not
  applied anywhere until approved.

### Correction 4 — Research corpus gate
- Research Agent plumbing may be built against an empty approved corpus.
- The research feature is **not Finalist-complete** while the corpus is empty.
- No fabricated studies, titles, findings, dates, or citations at any point.
- **RESEARCH_CORPUS_GATE:** at least one approved real publication from
  معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة — جامعة أم القرى must be loaded,
  or the feature stays `CORPUS_PENDING` and renders an explicit empty state —
  never a fabricated Research Insight.

---

## Environment variables

Server-side only. Referenced from Phase 4 onward; not read by any code yet.

| Variable | Purpose | Notes |
| -------- | ------- | ----- |
| `AI_PROVIDER_API_KEY` | Anthropic API key | Used only inside server routes / server actions. Never imported by client components. Real value in `.env.local` (dev) and Vercel project settings (deploy). |
| `AI_MODEL` | Anthropic model id | Supplied via env, never hardcoded. Confirmed value set in Phase 4. |

`.env.example` is a secret-free template and is tracked (`.gitignore` has
`.env*` followed by `!.env.example`). All real `.env` files — `.env`,
`.env.local`, etc. — remain ignored.

---

## Dependencies

Approved additions (installed at their gates, not in Phase 0):
- Official Anthropic SDK — installed in Phase 4.
- Zod — installed in Phase 4.
- One server-side PDF parser — installed in Phase 6, after the compatibility
  review gate.
- One XLSX/Excel parser — installed in Phase 6, after the compatibility review
  gate.

No other runtime dependency is added without explicit approval.

### Phase 0 candidate selection (pre-install analysis only)

Environment: Node `v24.19.0`, Next.js `16.3.2`, TypeScript `5.9.3`, tsx
`4.23.12`. Parsers will be used only inside Node-runtime server routes /
server actions, deployed as Vercel serverless functions.

**PDF parser — selected candidate: `unpdf`** (fallback: `pdfjs-dist` directly)
- Actively maintained (unjs collective); frequent releases.
- ESM-native, ships TypeScript types.
- No native / binary dependencies.
- Ships a serverless-optimised build of Mozilla PDF.js plus an `extractText`
  helper — matches the Vercel + Route Handler target with no worker/canvas
  setup.
- Smallest suitable footprint for plain text extraction.
- Avoids the known `pdf-parse` breakage: `pdf-parse@1.1.1` (last published 2021)
  contains `let isDebugMode = !module.parent;` and a top-level file read that
  fail under ESM / bundlers and have repeatedly broken in Next.js.
- `pdf2json` rejected: verbose positional-JSON output needs heavier
  post-processing for simple text.

**XLSX parser — selected candidate: `read-excel-file`** (fallback: `exceljs`)
- Actively maintained; read-only parser (xlsx → rows / objects), which matches
  the extraction-only need.
- Dedicated Node entry (`read-excel-file/node`), TypeScript types, no native
  dependencies, small footprint.
- Avoids the `xlsx` (SheetJS) line: the npm-registry `xlsx` is stale
  (`0.18.5`, 2022) — maintained builds moved to the SheetJS CDN — and has prior
  advisories (CVE-2023-30533 prototype pollution; ReDoS). `node-xlsx` wraps the
  same package and inherits those concerns.
- `exceljs` kept as fallback for richer parsing if row/cell reading proves
  insufficient in Phase 6; larger surface and slower maintenance cadence.

### Compatibility findings (Phase 0 — reasoning only)
- Node `v24.19.0`: both candidates support current Node; neither uses native
  addons.
- Next.js `16.3.2`: consumed only in Node-runtime server code (not Edge); no
  Next-specific integration or bundler shims required. `unpdf` explicitly
  targets this environment; `read-excel-file/node` is plain Node.
- Module format: project is ESM-oriented (`tsconfig` `module: esnext`, Next
  bundling). `unpdf` is ESM-native; `read-excel-file` ships both. Neither has a
  `module.parent`-style hazard.
- Vercel serverless: `unpdf` is serverless-optimised (no filesystem / worker
  assumptions); `read-excel-file` reads from a buffer / stream.
- **Not verified until the Phase 6 install gate:** exact transitive dependency
  count and installed size, tree-shaking behaviour inside the Next build, and
  behaviour against real sample PDF / XLSX files.

---

## Phase log

### Phase 0 — Decision lock + scaffolding — COMPLETE (checkpoint: "Phase 0 finalist scaffolding")
Scope (only these):
1. Record confirmations B1–B4 and Corrections 1–4 — this file.
2. Document the `AI_PROVIDER_API_KEY` / `AI_MODEL` env contract — this file +
   `.env.example`.
3. `package.json`: add `typecheck` script; broaden the `test` glob to cover
   `src/lib/**/__tests__/*.test.ts` (now includes `src/lib/agent`, and
   `src/lib/ai` once it exists); keep `lint`.
4. Add unused `MODE` / `DATA_SOURCE` constants — `src/lib/mode.ts`.
5. PDF / XLSX candidate selection + compatibility reasoning — this file. No
   install.
6. Housekeeping: `.gitignore` — track `.env.example` (`!.env.example`) while all
   real `.env` files stay ignored.

Committed files: `package.json`, `.gitignore`, `.env.example`,
`FINALIST_IMPLEMENTATION_LOG.md`, `src/lib/mode.ts`.

No product behaviour change. No dependency installed. No UI, regulatory data,
Figma, `AGENTS.md`, or `CLAUDE.md` touched.

---

## Outstanding approval gates

- Phase 1 review gates: Arabic glossary; `internalCriticality` mapping;
  canonical `DEMO_DATA` fixture.
- Phase 4 gate: install Anthropic SDK + Zod.
- Phase 6 gate: install PDF + XLSX libraries after final compatibility review.
- Phase 10 / Phase 11 gates: Figma frame inspection before visual work.
- `RESEARCH_CORPUS_GATE` before Finalist completion.

## Unresolved issues
- None open from Phase 0. (The `.env.example` tracking question was resolved by
  the `!.env.example` rule in `.gitignore`.)
