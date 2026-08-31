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

### Phase 1 — Data model + multi-authority regulatory matrix + adapters — IMPLEMENTATION COMPLETE (regulatory-source corrections applied), AWAITING APPROVAL
Not committed. No dependency installed. `AGENTS.md` / `CLAUDE.md` untouched.

New (canonical model): `src/lib/model/{compliance,regulatory,verification,company,readiness,ai,index}.ts`.
New (regulatory data, transcribed from `REGULATORY_MATRIX_v1.md` §5–§7 + §3A):
`src/lib/data/regulatory/{authorities,hajjExperience,hajjOperational,health,civilDefense,officialSources,notes,index}.ts`
— 3 authorities, **15 requirements** (5 Hajj Experience + 4 Hajj Operational + 1
Ministry of Health + 5 Civil Defense), canonical matrix IDs, `officialWeight`
non-null only for HAJ-EXP-01…05 (`{ trackWeightPercent: 3, withinTrackWeightPercent: 20 }`).

**Verified official sources populated (matrix §3A).** Every one of the 15 records
now carries a structured `officialSource { authorityId, reference, urls[],
locatorNote }`, distinct from `matrixSourceRef` (which only traces to our
implementation matrix). `getRequirementsMissingOfficialSource()` → `[]`.
3 records lack a precise page/section locator (the Service-Companies Guide has no
established page number) — `HAJ-CATERING-01`, `HAJ-CAMP-01`, `HAJ-PROVIDERS-01` —
tracked via `getRequirementsMissingSourceLocator()` + an `unresolved[]` note; no
page number invented.

**Qualitative/field Target Source fixed (matrix §3A).** New `verificationTarget`
field. `CIV-01…CIV-05` now have Target Source = company operational profile → all
applicable camps/sites, verification target = each site satisfies the official
safety condition — so they are **`SPECIFIED`**, no longer `UNRESOLVED_REQUIREMENT`.
`HAJ-PROVIDERS-01` Target Source = company operational profile → contracted
providers under the company's supervision/verification responsibility.

**`UNRESOLVED_REQUIREMENT` = 2 records** (down from 6):
- `HAJ-PROVIDERS-01` — unresolved company-vs-provider responsibility mapping
  (matrix verification rule); NOT "missing Target Source".
- `MOH-01` — current-season continuity to 1447H not verified (the MoH source is
  not a 1447-specific company-worker notice).

**`internalCriticality` assigned (INTERNAL prioritisation, not an official
weight):** HAJ-EXP-01…05 = REQUIRED; HAJ-NUSUK-01 = REQUIRED; HAJ-CATERING-01 =
REQUIRED; HAJ-CAMP-01 = CRITICAL; CIV-01/03/04/05 = CRITICAL; CIV-02 = REQUIRED;
MOH-01 = null; HAJ-PROVIDERS-01 = null. Legacy `criticalGate` not carried
(HAJ-EXP-03 = REQUIRED).

**MOH-01 applicability** narrowed to the supported rule: workers whose work
requires **direct contact** with pilgrims / Umrah performers — NOT all company
workers.

**Experience-track applicability** is `DECLARED_SCOPE` (`scopeKey:
"MOHU_EXPERIENCE_TRACK"`) — the `ALWAYS_FOR_COMPANY` kind was removed from the
model. Scope membership is declared by the company and evaluated in Phase 2.

New (adapters): `src/lib/legacy/compat.ts` (legacy↔canonical status + ID resolution).
New (i18n): `src/lib/i18n/glossary.ts` — the APPROVED Arabic glossary as data
(imported by nothing; not rendered until Phase 10/11).
New (store): `src/lib/store/persistence.ts` — versioned envelope (`SCHEMA_VERSION = 2`,
key `emtithal-demo-state-v2`), guarded `deserialize` that rejects missing /
unparseable / unversioned / wrong-version / wrong-shape payloads.
New (tests): `src/lib/data/regulatory/__tests__/regulatoryMatrix.test.ts`,
`src/lib/store/__tests__/persistence.test.ts`.
Edited (minimum compat only): `src/lib/types.ts` (legacy `ComplianceStatus` →
`LegacyComplianceStatus`; canonical `ComplianceStatus` re-exported from
`@/lib/model`; `CompanyRole` marked `@deprecated`), `src/lib/labels.ts`,
`src/components/ui/Badge.tsx`, `src/lib/engine/scoringEngine.ts` (type reference
rename only — no runtime change), `src/lib/store/demoStore.tsx` (use
`persistence.ts`).

Changes to `REGULATORY_MATRIX_v1.md`: added **§3A "Official Sources and Verified
Locators"** — the verified issuing-authority sources (groups A–E, exact strings /
URLs), the MOH-01 season-continuity caveat, and the qualitative/field Target
Source clarification for CIV-01…05 and HAJ-PROVIDERS-01. No existing matrix
content changed.

Not done (deferred by instruction): Phase 3 verification/readiness migration;
wiring the canonical model into any screen; confidence-casing unification
(`ConfidenceLevel` legacy lowercase left intact; canonical `AIConfidence` added
for new code only); canonical-ID routing on `/company/compliance/[id]` (still
legacy CR-00x end to end).

### Phase 2 — Company profile + data sources + applicability engine — IMPLEMENTATION COMPLETE, AWAITING APPROVAL
Not committed. No dependency installed. `AGENTS.md` / `CLAUDE.md` untouched. No UI change.

New:
- `src/lib/engine/applicabilityEngine.ts` — pure, deterministic. Per requirement
  returns exactly one `APPLICABLE | NOT_APPLICABLE | INSUFFICIENT_DATA` plus
  `reason`, `ruleEvaluated`, `companyFieldsUsed[]`, `regulatoryResolution`
  (carried through unchanged), `regulatoryUnresolvedNote`, `targetPopulationBasis`
  (declared-source description or `null` — never a manufactured number).
  Selectors: `getApplicable/NotApplicable/InsufficientDataRequirementIds`,
  `summariseApplicability`.
- `src/lib/onboarding/companyProfile.ts` — `buildCompanyProfile(draft)` (no
  inference; omitted → `null`/`[]`/undeclared count) + `getMissingApplicabilityInputs`.
- `src/lib/data/demo/companyProfile.ts` — the approved DRAFT-C fixture as
  `DEMO_COMPANY_PROFILE` (id `demo-company-01`, `DATA_SOURCE = DEMO_DATA`, no
  assessment outcomes). Separate from the legacy `@/lib/data/company`.
- Tests: `src/lib/engine/__tests__/applicabilityEngine.test.ts`,
  `src/lib/onboarding/__tests__/companyProfile.test.ts`.

Edited: `src/lib/model/company.ts` — added Phase-2 applicability fields to
`CanonicalCompanyProfile` (`SourcedCount` for pilgrims / workforce /
directContactWorkers / nusukApplicablePersons; `experienceTrackScopeDeclared`
in `DeclaredCompanyFacts`; `origin: DEMO_DATA|REAL_DATA` on `CompanyDataSource`).
Nothing consumed the canonical company shape before, so no runtime effect.

Deferred by instruction: assessment / verification / compliance outcomes
(Phase 3 owns them); the onboarding UI (Phase 10 — no screen exists yet, all
capture fields are UI-pending).

### Phase 3 — Verification Engine + Readiness Index + Coverage + Critical Blockers — IMPLEMENTATION COMPLETE, AWAITING APPROVAL
Not committed. No dependency installed. `AGENTS.md` / `CLAUDE.md` untouched. No AI. No visual redesign.

New:
- `src/lib/engine/verificationEngine.ts` — the authoritative deterministic engine.
  Per requirement: (A) `UNRESOLVED_REQUIREMENT` → not scored, surfaced as
  `regulatoryPending`, company not penalised; (B) applicability from Phase 2
  (`NOT_APPLICABLE` / `INSUFFICIENT_DATA` → no score); (C) verification — only
  VERIFIED target+actual (quantitative) or VERIFIED sub-requirements (qualitative)
  yield COMPLIANT/PARTIALLY_COMPLIANT/NON_COMPLIANT; else PENDING_VERIFICATION /
  INSUFFICIENT_DATA. Verified zero/negative target → controlled non-assessable
  (`zeroTargetRequirements`). `verifyAll` also returns the Emtithal Readiness
  Index V1 (unweighted mean of assessable eligible readiness; `null` when none),
  Verification Coverage (assessable eligible / all eligible), `criticalBlockers`
  (SPECIFIED + CRITICAL + NON_COMPLIANT only), `pending/insufficientDataWarnings`,
  `regulatoryPendingCount/Ids`, `statusCounts`, `officialWeightsDisplayOnly`,
  and `officialScoreComputed: false` (enforced — no Official Score ever).
- `src/lib/data/demo/verificationInputs.ts` — minimum `DEMO_DATA` inputs to
  exercise every status incl. one Critical Blocker (`CIV-03`). Qualitative
  sub-requirement labels are verbatim from each requirement's matrix
  "Verification Areas".
- `src/lib/engine/complianceView.ts` — `getDemoVerificationRun()` /
  `getDemoReadinessValue()`: the single place the app reads the canonical engine.
- Tests: `src/lib/engine/__tests__/verificationEngine.test.ts`.

Migrated to the canonical engine (data layer; no visual redesign):
- `src/lib/hooks/useCompanyCompliance.ts` — **stopped calling `computeOverallScore`**;
  `overallScore` is now the canonical Readiness Index; the 5 legacy experience
  cards take status/score from the engine via legacy-ID alias; exposes
  `readinessValue`, `verificationCoverage`, `criticalBlockers`, `statusCounts`,
  `regulatoryPendingCount`.
- `src/lib/engine/capabilityEngine.ts` — `compliance_readiness` indicator now
  takes the canonical Readiness as a parameter (no `computeOverallScore`).
- `src/lib/data/company.ts` — passes `getDemoReadinessValue()` to the capability engine.
- `src/lib/data/ministryCompanies.ts` — demo portfolio row derives `overallScore`
  / `status` / `criticalGaps` / `pendingVerification` from the canonical run
  (no `computeOverallScore` / `computeComplianceStatus`).

Copy corrections (minimal, no redesign):
- Compliance page + dashboard: the "20% per criterion weighted average" text →
  "unweighted Readiness Index V1; official weights are display-only; no Official Score".
- Dashboard critical banner generalised (no longer names `CR-003`).
- Requirement detail: weight row relabelled "الوزن الرسمي داخل المسار (بيانات تعريفية)".
- Ministry Standards: disclaimer rewritten — official weights read-only,
  display-only, not used in Readiness, no Official Score. (The screen already had
  no weight-editing control.)
- `src/lib/data/requirements.ts` — legacy seed `CR-003.criticalGate` flipped to
  `false` (Phase 1: legacy criticalGate not carried; canonical HAJ-EXP-03 = REQUIRED).

Legacy scoring removed from the compliance surfaces: the weighted
`computeOverallScore` is no longer the compliance engine — it is retained only
as the decision-simulation baseline (`decisionEngine.ts`, Phase 5/7), with a
clarifying comment on both.

Phase 3 correctness fixes (applied before checkpoint):
- **Readiness precision** — `readinessRaw` per requirement (exact), aggregate is
  the mean of RAW values, rounded only for `AggregateMetric.value`
  (`rawValue` also exposed). A test proves intermediate rounding cannot change
  the index (0.5/0.5/0.5/2.5 → 1, not 2).
- **No company-wide compliance status from Readiness** — `ministryCompanies.ts`
  no longer maps Readiness through `COMPLIANT_THRESHOLD`/`PARTIAL_THRESHOLD`;
  `MinistryCompanySummary.status` is a neutral `"not_assessed"` (compat-only) and
  the row exposes `readiness` / `verificationCoverage` / `criticalBlockerCount` /
  `regulatoryPendingCount` / `applicabilityPendingCount`.
- **Canonical KPIs no longer read legacy gap/risk data** — `getGaps()`/`getRisks()`
  + their types are marked `legacyDemoOnly` / `@deprecated LEGACY_DEMO_ONLY`;
  the dashboard KPIs now use `run.criticalBlockers` and `run.verificationGaps`
  (new: eligible requirements verified PARTIALLY_COMPLIANT / NON_COMPLIANT, with
  numeric gap or exact unsatisfied sub-requirements — no invented HIGH/MEDIUM
  severity). Fixes the "blockers = 1 but critical-gaps KPI = 0" mismatch.
- **Null readiness never shown as 0** — `ScoreRing` accepts `number | null` and
  renders "—"; `Requirement.canonicalReadiness` + `RequirementCard` render "—"
  for `null`; the hook label is "بيانات غير كافية لحساب مؤشر الجاهزية" when null.
- **Applicability uncertainty is visible** — `VerificationRun.applicabilityPendingCount`
  / `applicabilityPendingIds` (Phase 2 applicability `INSUFFICIENT_DATA`, not
  regulatory-pending), distinct from `regulatoryPendingCount`. Coverage is not
  penalised for it. Demo: `["HAJ-NUSUK-01"]`.

### Phase 4 — Real server-side AI service layer + guardrails — IMPLEMENTATION COMPLETE, AWAITING APPROVAL
Not committed. `AGENTS.md` / `CLAUDE.md` untouched. No UI/Figma change. No
regulatory-fact change. The deterministic Verification Engine stays authoritative.

Dependencies installed (approved only): `@anthropic-ai/sdk@0.122.0`,
`zod@3.25.76`. Transitive (deps of the Anthropic SDK): `standardwebhooks`,
`json-schema-to-ts` (+ their sub-deps; 7 packages total). No other runtime dep.

New — `src/lib/ai/`:
- `client/types.ts` — `AIClient` (`generateStructured` / `generateText`),
  `AICallResult<T>` (discriminated; failure carries no `data`), `AIFailureCode`
  (`AI_UNAVAILABLE` / `SCHEMA_VALIDATION_FAILED` / `GUARDRAIL_REJECTED` /
  `PROVIDER_ERROR`), `AICallMeta`, `AITransport`.
- `client/config.ts` — `readAIConfig(env)` reads exactly `AI_PROVIDER_API_KEY` +
  `AI_MODEL`; missing → `{ present: false, missing: [...] }` (never throws).
- `client/aiClient.ts` — `StructuredAIClient` (retry-once → guardrail scan (no
  retry) → schema validate → log; never fabricates) + `UnavailableAIClient`
  (every call → `AI_UNAVAILABLE`).
- `client/anthropicTransport.ts` — the ONLY file importing `@anthropic-ai/sdk`;
  runtime `typeof window` browser guard.
- `client/index.ts` — `getAIClient()` (server-only guard); returns
  `UnavailableAIClient` when unconfigured, else Anthropic-backed.
- `client/logging.ts` — `logAICall(meta)`: requestId / purpose / provider /
  model / durationMs / success / schemaValid / failureCode / confidence /
  attempts. Never logs keys, prompts, or evidence content.
- `guardrails/sharedGuardrails.ts` — `SHARED_GUARDRAIL_SYSTEM_PROMPT`,
  `withSharedGuardrails()`, and CODE-level `scanForForbiddenContent()` /
  `scanTextForForbiddenContent()`. Rejects (never strips) output attempting a
  compliance-status judgment, official/track weight, penalty/fine/sanction,
  internal criticality / critical gate, numeric target-as-truth, integration
  state (`CONNECTED` / `true`), or an out-of-corpus requirement/authority when an
  approved set is supplied.
- `schemas/` — Zod schemas (`.strict()`) for the Phase 1 canonical agent outputs:
  `regulatoryAgentOutput`, `evidenceAgentOutput` (+ fact), `decisionObject`,
  `scenario`, `scenarioComparisonResult`, `researchQueryResult` (+ study;
  refine: `CORPUS_PENDING` ⇒ no studies), `agentResult` envelope. `AI_OUTPUT_SCHEMAS`
  registry. Type-parity tests assert each `z.infer` matches its Phase 1 type.
  Note: `scenarioComparisonResultSchema` OMITS `affectedStatuses` (AI must not
  set a compliance status — guardrail-forbidden); the deterministic engine fills
  it. The Phase 1 `ScenarioComparisonResult` type is revisited in Phase 7.
- `scripts/liveConnectivity.ts` — one-off real Claude probe (non-regulatory);
  prints `NOT_RUN_MISSING_CREDENTIALS` when unconfigured.
- Tests: `client/__tests__/aiClient.test.ts`, `client/__tests__/serverOnly.test.ts`,
  `guardrails/__tests__/sharedGuardrails.test.ts`, `schemas/__tests__/schemas.test.ts`.

Not done (Phase 4 owns infra only): agent behaviour / prompts / orchestration
(Phases 5–9). Nothing wires `getAIClient()` into the app yet, so the Anthropic
SDK is in no client or server bundle.

Live AI connectivity test: **NOT_RUN_MISSING_CREDENTIALS** — `AI_PROVIDER_API_KEY`
and `AI_MODEL` are not configured in this environment.

---

## Phase 1 approval-gated items

### A — Arabic glossary — APPROVED (Phase 1)
Approved by the product owner with label corrections. Recorded as data in
`src/lib/i18n/glossary.ts`. NOT rendered anywhere yet (UI is Phase 10/11,
Figma-gated). Existing labels `ملتزم` / `ملتزم جزئيًا` / `غير ملتزم` unchanged.

| Concept | Approved Arabic label |
| --- | --- |
| Emtithal Readiness Index | مؤشر جاهزية امتثال |
| Verification Coverage | نسبة التحقق |
| PENDING_VERIFICATION | بانتظار التحقق |
| INSUFFICIENT_DATA | بيانات غير كافية |
| NOT_APPLICABLE | لا ينطبق |
| UNRESOLVED_REQUIREMENT | متطلب قيد الاستكمال |
| sub-requirement | متطلب فرعي |
| Critical Blocker | عائق حرج |
| data source: CONNECTED | متصل |
| data source: NOT_CONNECTED | غير متصل |
| data source: IMPORTED | بيانات مستوردة |
| data source: PENDING_LINK | بانتظار الربط |

### B — internalCriticality mapping — APPROVED (Phase 1), stored in code
INTERNAL product prioritisation only (matrix §12) — **not an official regulatory
weight**. Legacy `criticalGate` NOT carried (HAJ-EXP-03 = REQUIRED).
`UNRESOLVED_REQUIREMENT` records carry **no** criticality (`null`).

| Requirement | Class | Basis |
| --- | --- | --- |
| HAJ-EXP-01…05 | REQUIRED | Officially assessed Experience-Track criteria. |
| HAJ-NUSUK-01 بطاقة نُسك | REQUIRED | Mandatory operational prerequisite. |
| HAJ-CATERING-01 جاهزية وتغطية الإعاشة | REQUIRED | Service-coverage obligation. |
| HAJ-CAMP-01 جاهزية المخيمات والمواقع | CRITICAL *(internal safety/welfare, not an official weight)* | Direct safety/welfare relevance. |
| MOH-01 التحصين للعاملين | null | Until current-season applicability is resolved. |
| HAJ-PROVIDERS-01 متابعة مقدمي الخدمات | null | Until responsibility ambiguity is resolved. |
| CIV-01 وسائل وأنظمة الإطفاء | CRITICAL *(internal safety, not an official classification)* | Life-safety fire systems. |
| CIV-02 عمالة مدربة على الإطفاء | REQUIRED | Supporting safety capability. |
| CIV-03 مخارج الطوارئ | CRITICAL *(internal safety)* | Life-safety egress. |
| CIV-04 توصيلات كهربائية غير معتمدة | CRITICAL *(internal safety)* | Fire-ignition risk. |
| CIV-05 الطبخ داخل الخيام | CRITICAL *(internal safety)* | Fire-ignition risk. |

### C — canonical DEMO_DATA fixture — APPROVED (Phase 1)
Fictional; `DATA_SOURCE = DEMO_DATA`. Not created as a code file. Company profile +
declared facts + data-source states only (assessment outcomes are Phase 3).
Introduces NO regulatory fact absent from the matrix. Never shown as live
government data. Entity names visibly marked as demo.

- `companyId`: `demo-company-01`
- `legalNameAr`: «(عرض تجريبي) شركة نموذج امتثال للحج والعمرة»
- `season`: `1447H`
- `pilgrimsCount`: 4200 — source «ملف تشغيلي — بيانات عرض»
- `workforceCount`: 180
- `servicesAr`: [النقل، الإعاشة، التخييم، الإرشاد]
- `locationsAr`: [مكة المكرمة، مشعر منى، مشعر عرفات]
- `camps`: [ {`demo-camp-mina`, «(عرض) مخيم تجريبي — منى», companyResponsible: true}, {`demo-camp-arafat`, «(عرض) مخيم تجريبي — عرفات», companyResponsible: true} ]
- `serviceProviders`: [ {`demo-provider-transport-01`, «(عرض) مزوّد نقل تجريبي ١», النقل بين المشاعر, `SERVICE_PROVIDER`}, {`demo-provider-catering-01`, «(عرض) مزوّد إعاشة تجريبي ١», الإعاشة في منى, `SHARED`} ]
- `declaredFacts`: { companyResponsibleForCamp: true, contractsExternalServiceProviders: true, providesOrEnsuresCatering: true }
- `dataSources`:
  - NUSUK «نُسك» — `NOT_CONNECTED` — source: null — «لا يوجد ربط مفعّل في النسخة الحالية»
  - WORKERS «بيانات العاملين» — `IMPORTED` — «تقرير موارد بشرية مستورد — بيانات عرض» — «قبل ٥ أيام» — `PENDING_VERIFICATION`
  - OPERATIONAL «البيانات التشغيلية» — `IMPORTED` — «ملف تشغيلي داخلي — بيانات عرض» — «قبل يومين» — `UNVERIFIED`
  - EVIDENCE «الأدلة» — `IMPORTED` — «ملفات مرفوعة داخل امتثال — بيانات عرض» — «قبل يوم» — `PENDING_VERIFICATION`

Assessment / verification outcomes are NOT part of this fixture — Phase 3 adds them.

---

## Outstanding approval gates

- Phase 1 review gates: Arabic glossary — APPROVED; `internalCriticality`
  mapping — APPROVED (stored in code); canonical `DEMO_DATA` fixture —
  APPROVED (not yet a code file; assessment outcomes deferred to Phase 3).
- Phase 4 gate: install Anthropic SDK + Zod.
- Phase 6 gate: install PDF + XLSX libraries after final compatibility review.
- Phase 10 / Phase 11 gates: Figma frame inspection before visual work.
- `RESEARCH_CORPUS_GATE` before Finalist completion.

## Unresolved issues
- None open from Phase 0. (The `.env.example` tracking question was resolved by
  the `!.env.example` rule in `.gitignore`.)
