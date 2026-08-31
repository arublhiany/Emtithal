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
(Phases 5–9). Nothing wires `getAIClient()` into the app yet, so neither
provider SDK is in any client or server bundle.

Live AI connectivity test: **NOT_RUN_MISSING_CREDENTIALS** — `AI_PROVIDER`,
`AI_PROVIDER_API_KEY`, and `AI_MODEL` are not configured in this environment.

### Phase 4 (extension) — Google Gemini as a second provider — IMPLEMENTATION COMPLETE, AWAITING APPROVAL
Not committed. `AGENTS.md` / `CLAUDE.md` untouched. No UI/Figma or regulatory-fact
change. The two uncommitted Anthropic compatibility fixes are preserved
(`anthropicTransport.ts` sends no `temperature`; `liveConnectivity.ts` no
`maxTokens: 64`).

Dependency installed (approved only): `@google/genai@2.19.0` (`^2.19.0`).
Transitive: `ws`, `p-retry`, `protobufjs`, `google-auth-library` (+ sub-deps).
No other runtime dependency.

Provider model:
- New env var **`AI_PROVIDER=anthropic | gemini`**. `AI_PROVIDER_API_KEY` and
  `AI_MODEL` stay shared — no provider-specific secret names.
- `readAIConfig` now validates all three: missing/unknown provider, or missing
  key/model → `{ present: false }` → `getAIClient()` returns `UnavailableAIClient`
  → every call yields a controlled `AI_UNAVAILABLE` (never a fake fallback).
- `getAIClient()` selects `createGeminiTransport` or `createAnthropicTransport`;
  both build a shared `StructuredAIClient` — the retry / guardrail / Zod /
  logging / requestId / controlled-failure pipeline is identical per provider.

New / changed:
- `src/lib/ai/client/geminiTransport.ts` — the ONLY file importing
  `@google/genai`; server-only browser guard; implements the same `AITransport`
  seam (`complete({system,user,maxTokens,responseFormat}) → {text}`); no
  sampling params. `responseFormat: "json"` → native `responseMimeType:
  "application/json"` (see structured-output fix below).
- `src/lib/ai/client/config.ts` — added `AIProvider`, `KNOWN_AI_PROVIDERS`,
  `AI_PROVIDER` parsing, `unknownProvider` reporting.
- `src/lib/ai/client/index.ts` — provider dispatch in `buildAIClient()`.
- `src/lib/ai/client/aiClient.ts` — `providerName` getter on both client classes
  (diagnostics/tests).
- `.env.example` — now exactly `AI_PROVIDER=` / `AI_PROVIDER_API_KEY=` /
  `AI_MODEL=`, all blank.
- `src/lib/ai/scripts/liveConnectivity.ts` — provider-aware (`AI_PROVIDER`);
  reports `provider=` in the result line; handles unknown provider.
- Tests: `client/__tests__/gemini.test.ts` (new — provider selection, shared
  pipeline for Gemini, guardrails identical); `client/__tests__/aiClient.test.ts`
  + `client/__tests__/serverOnly.test.ts` extended for `AI_PROVIDER` and the
  second SDK.

Schemas & guardrails: **unchanged and reused** — one Zod schema system, one
`sharedGuardrails` scanner, applied to both providers. Gemini may not set/invent
`complianceStatus` / `officialWeight` / penalty / `internalCriticality` /
regulatory target / integration state / out-of-corpus requirement — enforced by
the same code-level scan.

#### Gemini structured-output fix (after live connectivity test)

Live connectivity test with `AI_PROVIDER=gemini` reached the provider
successfully (key/connectivity confirmed) but the call ended in a controlled
`SCHEMA_VALIDATION_FAILED` after 2 attempts / ~143s.

**Cause (no secrets logged):** the transport made a plain `generateContent`
call with no structured-output mode, so Gemini returned free-form / reasoning-
wrapped prose instead of a bare JSON object. `extractJson` + the Zod
`safeParse` failed on both the first attempt and the single retry → the
pipeline's designed `SCHEMA_VALIDATION_FAILED`. The ~143s is two full
model turns (Gemini's default thinking) with no JSON constraint. No fake
result was ever produced.

**Fix (smallest clean change — no pipeline duplication, no new dependency):**
- New `AIResponseFormat = "json" | "text"` flag on the `AITransport.complete`
  seam (`src/lib/ai/client/types.ts`). `StructuredAIClient.generateStructured`
  passes `"json"`; `generateText` passes `"text"`.
- `geminiTransport.ts` — new pure `buildGeminiGenerateParams(...)` that sets
  `config.responseMimeType = "application/json"` **only** when
  `responseFormat === "json"`. `generateText` calls stay plain text. No
  `responseSchema` is sent — the existing Zod schema remains the single source
  of truth after `JSON.parse`, so no Zod→schema-conversion dependency was added.
- `anthropicTransport.ts` — ignores `responseFormat` (Messages API has no JSON-
  mode switch); comment added. Anthropic behaviour is unchanged.
- `sharedGuardrails.ts` — the JSON-only instruction moved out of the shared
  system prompt; `withSharedGuardrails(prompt, format)` now appends a JSON-only
  or plain-text instruction per call.

**Tests added / updated:** `client/__tests__/geminiTransport.test.ts` (new) —
`buildGeminiGenerateParams` sets JSON mode for `"json"` and not for `"text"`;
a spy transport proves `generateStructured` → `"json"` (incl. on retry) and
`generateText` → `"text"`; JSON mode still runs the Zod + guardrail pipeline
(forbidden field still `GUARDRAIL_REJECTED` after parsing, malformed still
retries at most once); static check that only `geminiTransport.ts` sets a JSON-
mode param. `guardrails/__tests__/sharedGuardrails.test.ts` updated for the
2-arg `withSharedGuardrails` signature (json + text cases).

**Checks:** `typecheck` ✓ · `lint` ✓ · `npm test` 175 pass / 0 fail ·
`build` ✓. Not committed. Model unchanged. Safe to rerun the harmless live
connectivity test.

---

### Phase 5 — Regulatory Intelligence Agent — IMPLEMENTATION COMPLETE, AWAITING APPROVAL
Not committed. `AGENTS.md` / `CLAUDE.md` untouched. No UI/Figma change. No new
dependency. No regulatory fact / weight / target / penalty added. The Phase 4
Anthropic compatibility fixes remain preserved.

**Role.** `src/lib/ai/agents/regulatoryAgent.ts` retrieves the correct approved
requirement(s) and asks the LLM ONLY to interpret / explain them. It never
determines compliance, applicability outcome, readiness, coverage, blockers,
weights, targets or integration state — the deterministic engines stay
authoritative; the agent may explain a deterministic result, never replace one.

**API (server-side).**
- `answerRegulatoryQuestion(query, opts?)` — free-text / id question.
- `explainRequirement(idOrAlias, opts?)` — one approved requirement.
- `explainApplicability({ requirementIdOrAlias, profile }, opts?)` — runs the
  deterministic applicability engine FIRST, hands its outcome to the LLM as
  immutable context, asks only for an explanation.
- `opts.client` injects an `AIClient` for tests; default is the shared
  `getAIClient()`. One shared pipeline — no duplicate provider logic.

**Deterministic retrieval before generation** (`regulatoryRetrieval.ts`, no LLM):
resolves a query over canonical fields only — canonical id, legacy alias
(`resolveRequirementId`), verbatim canonical title / long source alias, then
token overlap on title + aliases + domain + track + verification areas, with an
optional authority filter. Outcomes: `MATCH` (exactly one → LLM is called),
`AMBIGUOUS` (≥2 comparable → **no LLM**, candidates + lineage returned for
clarification, never a silent pick), `NONE` (→ agent returns `OUT_OF_CORPUS`,
**no LLM**), `SEASON_MISMATCH` (→ **no LLM**).

**Closed world / season lock.** Corpus = `src/lib/data/regulatory/**` +
canonical model only. No web, no invented regulation. `NONE` →
`regulatoryState = OUT_OF_CORPUS`, `failureCode = OUT_OF_CORPUS`, `answerAr =
null`, `needsHumanReview = true`. A query naming any season ≠ `1447H` →
`SEASON_MISMATCH` (a 1446H requirement is never carried into 1447H).

**UNRESOLVED_REQUIREMENT.** `regulatoryState` is derived from the canonical
record's `resolution`, never from the LLM. For `HAJ-PROVIDERS-01` / `MOH-01` it
stays `UNRESOLVED_REQUIREMENT`; the deterministic confidence is `LOW`,
`needsHumanReview = true`, and the answer explains WHY it is unresolved — it
cannot resolve it (no schema field could).

**Source lineage.** `sources[]` is built deterministically from canonical data —
`requirementId`, `titleAr` (verbatim), `authorityId` + name, `officialSource`
`reference` / `urls` / `locatorNote`, `matrixSourceRef`, `resolution`, `season`.
The LLM never supplies a source string.

**Explicit locator status (correctness fix).** `OfficialSource` now carries an
explicit canonical field `locatorStatus: "VERIFIED_COMPLETE" | "INCOMPLETE"`,
populated in `officialSources.ts` from Phase 1 truth (the `INCOMPLETE` sources
are exactly those carrying `OFFICIAL_SOURCE_LOCATOR_UNRESOLVED`). Nothing is
inferred from `locatorNote` any more — the agent's `SourceLineage.locatorComplete`
is `src.locatorStatus === "VERIFIED_COMPLETE"`, and `getRequirementsMissingSourceLocator()`
reads the explicit field too. Results: `HAJ-EXP-05` → `VERIFIED_COMPLETE` /
`locatorComplete = true`; `HAJ-CATERING-01`, `HAJ-CAMP-01`, `HAJ-PROVIDERS-01`
→ `INCOMPLETE` / `locatorComplete = false`. No page number invented.

**Confidence is fully deterministic (correctness fix).** The LLM has **no
confidence field** — a body carrying one fails `.strict()` schema validation and
is never honoured. The canonical confidence is computed by code from
retrieval / regulatory-state / source-lineage conditions only, with no numeric
score and no invented threshold (the earlier 0.67 / 0.34 / 0–100 mapping is
removed):
- `HIGH` — one clear `SPECIFIED` requirement, complete official-source locator,
  an answer was produced, no material ambiguity.
- `MEDIUM` — `SPECIFIED`, identity clear, but the official-source locator/detail
  is incomplete.
- `LOW` — `UNRESOLVED_REQUIREMENT`; unresolved ambiguity; no answer produced;
  `OUT_OF_CORPUS` / `SEASON_MISMATCH` (there `LOW` explicitly means *low ability
  to answer from the approved corpus*, documented in `confidenceReasonAr`, not
  low confidence in a regulation).
`confidenceReasonAr` is a deterministic string built from the same conditions.
`needsHumanReview = confidence !== "HIGH"` (so every non-`HIGH` result is
flagged). The LLM can neither raise nor lower any of this.

**Applicability contradiction protection (correctness fix).** For
`explainApplicability`, the engine outcome is turned into a deterministic
canonical statement:
- `APPLICABLE` → "المتطلب منطبق على ملف الشركة وفق قاعدة الانطباق الحتمية."
- `NOT_APPLICABLE` → "المتطلب غير منطبق على ملف الشركة وفق قاعدة الانطباق الحتمية."
- `INSUFFICIENT_DATA` → "لا تتوفر بيانات كافية لتحديد الانطباق حتميًا."
The model's `applicabilityExplanationAr` (and its free-text `answerAr`) is
surfaced only when a deterministic check finds no contradictory applicability
claim; a contradictory claim is **replaced** with the canonical statement and a
note is added to `confidenceReasonAr`. Contradictory prose is never shown.
Consistent explanatory detail is appended under the canonical statement.

**Missing information stays truthful (correctness fix).** `ApplicabilityResult`
now carries `missingCompanyFields: string[]`, populated **inside**
`applicabilityEngine.ts` — the EXACT absent required inputs, distinct from
`companyFieldsUsed` (which also lists inputs that are present). `APPLICABLE` /
`NOT_APPLICABLE` → `[]`; `INSUFFICIENT_DATA` → only the undeclared inputs that
block the decision (a conflict yields `[]`; an empty `serviceProviders[]` is a
declared state, not an absence, so HAJ-PROVIDERS-01's not-declared branch
returns only `declaredFacts.contractsExternalServiceProviders`). The agent seeds
canonical `missingInformation` **only** from
`deterministicApplicability.missingCompanyFields`; those entries always survive
and the model's list is concatenated afterwards as additive detail only. A model
returning `[]` / `null` / unrelated text cannot remove or replace them. A field
the rule merely *consulted* but which is present is never surfaced as missing.

**Output schema.** `regulatoryAgentAnswerSchema` (`.strict()`, registered as
`regulatoryAgentAnswer`, canonical type `RegulatoryAgentAnswer`): `answerAr`,
`requirementIds`, `authorityId`, `missingInformation`,
`applicabilityExplanationAr` — **no `confidence` / `confidenceReasonAr`**. No
field can carry a compliance status / official weight / penalty / criticality /
numeric target / integration state — and the shared guardrail
(`approvedRequirementIds` = the retrieval candidates, `approvedAuthorityIds` =
the 3 authorities) rejects any such attempt AFTER JSON parsing, before Zod.
`confidence` / `confidenceReasonAr` / `regulatoryState` / `needsHumanReview` /
`sources` / `deterministicApplicability` are all attached by the orchestrator,
not parsed from the model.

**Shape tolerance kept minimal.** `lenientStringArray` (in `schemas/common.ts`)
still normalises a lone string → `[string]` and `null` → `[]` for the
non-authoritative `missingInformation` / `requirementIds` lists; a number is not
coerced and still fails. The numeric-confidence coercion is gone entirely. The
agent prompt carries an explicit JSON skeleton + per-field type rules;
`maxTokens: 2048` for Arabic-answer + reasoning headroom.

**Files.**
- new: `src/lib/ai/agents/regulatoryRetrieval.ts`, `regulatoryAgent.ts`,
  `index.ts`; `src/lib/ai/agents/__tests__/regulatoryRetrieval.test.ts` (13),
  `regulatoryAgent.test.ts` (39); `src/lib/ai/scripts/liveRegulatoryAgent.ts`.
- changed: `src/lib/model/regulatory.ts` (`LocatorStatus`,
  `OfficialSource.locatorStatus`), `src/lib/data/regulatory/officialSources.ts`
  (explicit `locatorStatus` on all 5 sources), `src/lib/data/regulatory/index.ts`
  (`getRequirementsMissingSourceLocator` reads the explicit field),
  `src/lib/engine/applicabilityEngine.ts` (`ApplicabilityResult.missingCompanyFields`,
  populated per branch), `src/lib/ai/schemas/common.ts` (`lenientStringArray`
  only — numeric confidence coercion removed), `schemas/regulatory.ts`
  (`regulatoryAgentAnswerSchema`, no `confidence`), `schemas/index.ts` (registry),
  `schemas/__tests__/schemas.test.ts`, `src/lib/model/ai.ts`
  (`RegulatoryAgentAnswer` without `confidence`, `RegulatoryState`),
  `src/lib/data/regulatory/__tests__/regulatoryMatrix.test.ts` (+locatorStatus),
  `src/lib/engine/__tests__/applicabilityEngine.test.ts` (+missingCompanyFields),
  `src/lib/engine/__tests__/verificationEngine.test.ts` (fixture field).

**Checks:** `typecheck` ✓ · `lint` ✓ · `npm test` 230 pass / 0 fail (was 175,
+55) · `build` ✓. Not committed, not pushed. Phase 6 not started.

**`LIVE_REGULATORY_AGENT_TEST = PASSED`** (re-run after these two fixes) —
provider `gemini`, model `gemini-3.6-flash`, ~48 s, requirement `HAJ-EXP-05`,
canonical title "توثيق فعاليات ومبادرات فريق السعادة" (unchanged),
regulatoryState `SPECIFIED`, confidence `HIGH` (deterministic — `VERIFIED_COMPLETE`
locator + `SPECIFIED`), `needsHumanReview` false, `locatorComplete` true, stored
official source returned verbatim, no compliance calc, no invented penalty /
requirement, structured output passed Zod + guardrails, no secret content. (The
first attempt of this re-run returned a controlled `PROVIDER_ERROR` — a
transient transport-level throw; the failure model behaved as designed
— `ok:false`, `answerAr:null`, deterministic lineage still attached, nothing
fabricated — and the immediate retry passed.)

The correctness fixes only *narrow* what the LLM is asked for: `confidence` /
`confidenceReasonAr` are removed from the schema and the prompt (with an updated
skeleton), and all authoritative values are now derived in code. The live path
(retrieval → JSON-mode structured call → guardrails → Zod) is otherwise
unchanged, and the deterministic outputs are fully covered by the 220 offline
tests. Residual live risk is only "does Gemini return the 5 remaining keys
cleanly" — strictly easier than before, and a stray `confidence` key would
degrade to a one-retry `SCHEMA_VALIDATION_FAILED`, never a bad answer. Per the
instruction the live call was **not** re-run; a quick re-run is recommended
before final sign-off but is low-risk.

---

### Phase 6 — Evidence Intelligence Agent + PDF/XLSX ingestion — IMPLEMENTATION COMPLETE, AWAITING APPROVAL
Not committed. `AGENTS.md` / `CLAUDE.md` untouched. No UI/Figma change. No
regulatory fact / weight / target / penalty added. Evidence is NOT compliance —
the deterministic verification engine stays authoritative.

**Dependencies added (Phase 6 install gate — approved):** `unpdf@1.8.1` (PDF
text extraction; bundles a serverless PDF.js build, no worker/native deps) and
`read-excel-file@9.3.10` (XLSX; SAX XML reader, no macro/formula/URL
evaluation). Both are the *primary* choices from the gate and both are
compatible (ESM, Node ≥18/≥22, no native modules). No fallback installed. No LLM
SDK added — the existing `AIClient` is reused. `+7` transitive packages, 0
vulnerabilities.

**Supported types:** PDF and .xlsx only. No Word / CSV / images / OCR.

**Ingestion layer (`src/lib/evidence/`, server-only):**
- `validate.ts` — deterministic pre-parse checks: supported extension / MIME,
  `EMPTY_FILE`, `FILE_TOO_LARGE` (configurable; `DEFAULT_MAX_EVIDENCE_BYTES` =
  10 MB), and a magic-byte signature check (`%PDF-` / `PK\x03\x04`). A mismatch
  → controlled `PARSE_FAILED`.
- `parsePdf.ts` — the ONLY importer of `unpdf`. `extractText(bytes,
  { mergePages: false })` → one text segment per page; `page` is the parser's
  1-based number. Browser guard.
- `parseXlsx.ts` — the ONLY importer of `read-excel-file`. Reads every non-empty
  cell with `sheet` + 1-based `row` + column letters + A1 `cellRef`; numbers
  keep their type. Browser guard. Cell cap `MAX_XLSX_CELLS`.
- `ingestEvidence.ts` — orchestrates validate → parse → `ExtractedEvidenceFact[]`.
  Raw parser throws are caught and returned as `PARSE_FAILED` — never surfaced.
  Output `state` is `UPLOADED` (any failure) or `EXTRACTED` (success), **never
  `VERIFIED`** (the type does not even allow it). Failure codes:
  `UNSUPPORTED_FILE_TYPE` / `EMPTY_FILE` / `FILE_TOO_LARGE` / `PARSE_FAILED`.

**Evidence fact / provenance model (`types.ts`):** `ExtractedEvidenceFact` =
`factId` (deterministic `${evidenceId}#p<page>` or `#<sheet>!<cellRef>`), `text`,
`value`, `evidenceId`, `fileName`, `sourceLocator`
(`PDF_PAGE{page}` | `XLSX_CELL{sheet,row,column,cellRef}`), `extractionMethod`
(`PDF_TEXT` | `XLSX_CELL`). Provenance is produced by the parser, never the LLM,
never fabricated.

**Deterministic retrieval before AI:** the agent restricts the model to an
APPROVED candidate requirement set — either an explicit `candidateRequirementIds`
list (validated against the corpus) or Phase 5's `retrieveCandidates` run over
the joined extracted text. No credible candidate → `NO_RELEVANT_REQUIREMENT`
(`outOfScope: true`), **no LLM call, no requirement invented**.

**Evidence Intelligence Agent (`src/lib/ai/agents/evidenceAgent.ts`):**
`analyzeEvidence(input, opts?)` (alias `mapEvidenceToRequirements`). Uses the
existing `AIClient` / provider abstraction, `evidenceAgentAnalysisSchema`
(`.strict()`, registered as `evidenceAgentAnalysis`), shared guardrails
(`approvedRequirementIds` = candidate set, `approvedAuthorityIds` = the 3
authorities), safe logging, one-retry maximum. The LLM output carries
`summaryAr`, `mappings[]` (`requirementId`, `evidenceFactIds`,
`appearsToSupportAr`, `stillMissingAr`, `relatedVerificationTargetAr`,
`interpretationConfidence`), `conflicts[]`, `unmappedFactIds`, `needsHumanReview`.
It has NO compliance / weight / target / penalty / integration field — the
shared guardrail rejects any such attempt AFTER JSON parsing, before Zod.

**Assembly (deterministic on top):** every mapping's `requirementId` is
re-checked against the candidate set and enriched with the canonical `titleAr`
(verbatim) and `regulatoryResolution`; each mapping carries
`note: "EVIDENCE_ONLY_NOT_A_COMPLIANCE_DECISION"`. The result exposes
`complianceAsserted: false` (always). `needsHumanReview` is the OR of the model's
flag and deterministic conditions: any conflict, ambiguous retrieval, a mapped
`UNRESOLVED_REQUIREMENT`, a `LOW`-confidence mapping, zero mappings, or any
reference/target integrity problem below.

**Evidence-truth safeguards (correctness fixes):**

1. **Prose compliance-verdict guard.** `scanEvidenceProseForVerdict` (in
   `sharedGuardrails.ts`) deterministically scans every user-facing text field
   (`summaryAr`, each mapping's `appearsToSupportAr` / `relatedVerificationTargetAr`
   / `stillMissingAr[]`, each conflict's `descriptionAr`) for a compliance /
   satisfaction / verification verdict — **BOTH affirmative and negative** —
   Arabic (normalised) + English:
   - affirmative — "يثبت الامتثال", "المتطلب متحقق", "الشركة ملتزمة",
     "the company is compliant", "proves compliance", "requirement is satisfied";
   - negative — "الشركة غير ملتزمة", "الشركة غير ممتثلة", "المتطلب غير متحقق",
     "المتطلب غير مستوفى", "لم تستوف الشركة المتطلب", "لم يتحقق المتطلب",
     "يوجد عدم امتثال", "هذا يثبت عدم الامتثال", "the company is not compliant",
     "the company is non-compliant", "the requirement is not met/satisfied",
     "the requirement has not been fulfilled", "this proves non-compliance",
     "evidence of non-compliance".
   Uncertainty wording that merely mentions compliance stays allowed —
   "لا يكفي هذا الدليل وحده للحكم على الامتثال",
   "يحتاج الأمر إلى تحقق إضافي قبل تحديد حالة الامتثال",
   "لا يمكن تحديد حالة الامتثال من هذا المستند وحده",
   "insufficient evidence to determine compliance" — a phrase is not rejected
   merely for containing "امتثال" / "compliance". A hit → the whole
   interpretation is returned as `GUARDRAIL_REJECTED`; the offending prose is
   **never surfaced** (only the field path is recorded), `mappings` / `summaryAr`
   are cleared, `state` stays `EXTRACTED`, extracted `facts` stay available,
   `complianceAsserted` stays `false`, nothing is fabricated.

2. **Closed-world evidence-fact references.** Every model-supplied fact reference
   (`mapping.evidenceFactIds[]`, `conflicts[].factIdA/B`, `unmappedFactIds[]`) is
   validated against the EXACT extracted `factId` set. A mapping with **any**
   unknown reference is discarded **whole** (recorded in `droppedMappings` with
   `UNKNOWN_EVIDENCE_FACT_REFERENCE`) — never silently reduced to the valid ids;
   a mapping with zero fact ids is dropped (`NO_VALID_EVIDENCE_FACT`) so it can
   never surface as supportive evidence. A conflict with an unknown id is not
   accepted as a conflict. `unmappedFactIds` is recomputed deterministically
   (real facts not backing a surviving mapping); model-invented entries are
   ignored. Any such problem forces `needsHumanReview` and adds an
   `integrityNotes` entry.

3. **Closed-world verification target.** The prompt gives the model the allowed
   target set for each candidate — its canonical `verificationAreasAr` plus its
   single `verificationTarget` (existing canonical representation, no parallel
   truth). `resolveVerificationTarget` accepts **only an EXACT equality of the
   normalised forms** (`normalizeText` handles whitespace / punctuation / casing
   / Arabic folding — nothing more): no substring, prefix, suffix, or fuzzy
   matching. On a match the **canonical text is reattached verbatim**; on a
   non-null miss (`"توثيق"`, `"المبادرات"`, `"توثيق المبادرات والسجل التجاري"`,
   `"التحقق من السجل التجاري"` …) it is set to `null`, `needsHumanReview` is
   forced, and an `integrityNotes` entry is added. A requirement with no usable
   target → always `null`. An `UNRESOLVED_REQUIREMENT` stays unresolved
   regardless of any target suggestion.

**Evidence state:** `UPLOADED` → `EXTRACTED` → `AI_INTERPRETED`. Phase 6 never
reaches `VERIFIED`; a successfully parsed or interpreted document is not
compliance and not verified.

**UNRESOLVED_REQUIREMENT:** a mapping to `HAJ-PROVIDERS-01` / `MOH-01` keeps
`regulatoryResolution: "UNRESOLVED_REQUIREMENT"` from canonical data (the agent
never flips it) and forces human review.

**Conflicting evidence:** the model's `conflicts[]` are preserved verbatim, both
fact IDs stay available in `facts[]`, `needsHumanReview` is forced true, and no
fact is silently chosen. Newest upload is not treated as truth; interpretation
confidence never resolves a factual conflict.

**Failure model:** `AI_UNAVAILABLE` / `PROVIDER_ERROR` / `SCHEMA_VALIDATION_FAILED`
(one retry) / `GUARDRAIL_REJECTED`, plus `EXTRACTION_UNAVAILABLE` when the
extraction was not successful. On any failure `mappings` is `[]`, `summaryAr`
is `null`, and the extracted `facts` are still echoed — no fabricated mapping.

**Test fixtures (`src/lib/evidence/__tests__/fixtures.ts`):** synthetic only, no
real documents — a hand-built 1-page Helvetica (Latin) PDF, a hand-built 1-page
**Arabic** PDF, and a hand-built inline-string .xlsx (one 4-row sheet). The
Arabic PDF uses an inline `/uniXXXX` `Encoding` so pdf.js derives the text from
glyph names — **no embedded font program, no committed font file, no OCR**.
Each fixture is self-checked against the real parsers at generation time and
stored as base64. Plus malformed / empty variants.

**Arabic PDF smoke test:** `parsePdf(SAMPLE_ARABIC_PDF_BYTES())` on the real
`unpdf` path returns `pageCount 1`, `page 1`, Arabic script present, and the
extracted character multiset equals the phrase
"توثيق فعاليات ومبادرات فريق السعادة" (order-independent — the synthetic PDF has
no font shaping / bidi, so words come out reversed, but every character is
extracted, none fabricated). Provenance preserved. The parser is unchanged — no
OCR.

**Files (new):** `src/lib/evidence/{types,validate,parsePdf,parseXlsx,ingestEvidence,index}.ts`;
`src/lib/evidence/__tests__/{fixtures.ts,parsePdf.test.ts,parseXlsx.test.ts,ingestEvidence.test.ts}`;
`src/lib/ai/agents/evidenceAgent.ts`;
`src/lib/ai/agents/__tests__/evidenceAgent.test.ts`;
`src/lib/ai/scripts/liveEvidenceAgent.ts`.
**Files (changed):** `src/lib/ai/guardrails/sharedGuardrails.ts`
(+`scanEvidenceProseForVerdict`), `src/lib/ai/guardrails/__tests__/sharedGuardrails.test.ts`,
`src/lib/ai/schemas/evidence.ts` (+Phase 6 analysis schema),
`src/lib/ai/schemas/index.ts` (registry), `src/lib/ai/schemas/__tests__/schemas.test.ts`,
`src/lib/ai/agents/index.ts` (exports), `src/lib/model/ai.ts` (+evidence analysis
types), `src/lib/ai/client/__tests__/serverOnly.test.ts` (parser-lib containment
scan), `package.json` / `package-lock.json` (the two parsers).

**Checks:** `typecheck` ✓ · `lint` ✓ · `npm test` 295 pass / 0 fail (was 230,
+65) · `build` ✓. Not committed, not pushed. Phase 7 not started.

**`LIVE_EVIDENCE_AGENT_TEST = PASSED`** (re-run after the negative-verdict +
exact-target fixes) — provider `gemini`, model `gemini-3.6-flash`, ~13 s,
synthetic Arabic extracted text only (no real file sent), candidates restricted
to `HAJ-EXP-05`. Result: `state = AI_INTERPRETED`, mapped **only** to
`HAJ-EXP-05`, canonical title "توثيق فعاليات ومبادرات فريق السعادة" unchanged;
`appearsToSupportAr` = "يبدو أن الدليل يوثق تنفيذ ثلاث فعاليات لفريق السعادة…"
— **no compliance verdict in any prose** (`complianceAsserted = false`); all
`evidenceFactIds` are real supplied fact IDs; the verification target is
canonical or `null`; no invented penalty / weight / requirement; structured
output passed Zod + guardrails. No secret content.

---

### Phase 7 — Decision Intelligence + deterministic scenario simulation — IMPLEMENTATION COMPLETE, AWAITING APPROVAL
Not committed. `AGENTS.md` / `CLAUDE.md` untouched. No UI/Figma change. **No new
dependency.** No regulatory fact / weight / target / penalty added. No Official
Score — `officialScoreComputed: false` is threaded through every scenario. The
legacy `simulateDecision` (`decisionEngine.ts`, weighted `computeOverallScore`,
wired to `/company/decision-simulation`) is **untouched** and remains the
explicitly-labelled fallback.

**Authority split.** AI does INTERPRETATION and RECOMMENDATION prose only. All
numbers come from the existing Phase 2 applicability engine and Phase 3
verification/readiness engine, run on **cloned** profiles. The AI never
computes a status / readiness / coverage, never invents a requirement / weight /
penalty / integration, never resolves an `UNRESOLVED_REQUIREMENT`, never marks
evidence verified.

**Closed operational-variable catalog** (`decisionScenarioEngine.ts` —
`MUTABLE_DECISION_FIELDS`): exactly eight EXACT canonical `CanonicalCompanyProfile`
field paths — `pilgrims.count`, `workforce.count`, `directContactWorkers.count`,
`nusukApplicablePersons.count`, and the four `declaredFacts.*` booleans
(`experienceTrackScopeDeclared`, `companyResponsibleForCamp`,
`contractsExternalServiceProviders`, `providesOrEnsuresCatering`). `validateMutation`
returns `UNSUPPORTED_DECISION_VARIABLE` for any other path and `INVALID_VALUE`
for a bad type / negative / non-integer / implausible value. Every mutation
carries `fieldPath`, `currentValue`, `scenarioValue`, and `source`
(`USER_STATED` | `CURRENT_PROFILE` | `SCENARIO_ASSUMPTION`).

**Change vs. constraint (correctness fix).** The interpretation schema now
carries `constraints[]` alongside `requestedChanges[]`. A user "keep/same" value
(e.g. "مع بقاء عدد القوى العاملة 180") is a `ValidatedConstraint`
(`fieldPath` + `expectedValue` + `source: "USER_STATED"` + `intentAr`), validated
against the SAME closed catalog + type rules. A `requestedChange` whose value
already equals the current value is **not** a change — it is folded into
`constraints` (never kept as a no-op mutation, never reclassified as
`SCENARIO_ASSUMPTION`). An explicit change on a field overrides any "keep" on the
same field (and flags review). Scenario B/C generation **respects constraints**:
a candidate scenario whose mutation would move a constrained field is **not
emitted** (e.g. capacity-adjusted C is dropped when `workforce.count` is
constrained); a mutation equal to the constrained value is stripped as a no-op.
`interpretation.constraints` is visible on the final result.

**Decision Agent API** (`src/lib/ai/agents/decisionAgent.ts`, server-only):
- `interpretDecision({ textAr, profile? }, opts?)` → `DecisionInterpretationView`
  — natural language → `requestedChanges` (each post-validated against the
  catalog; rejected ones surfaced in `rejectedChanges`, never renamed) +
  `constraints`, `assumptionsAr` / `ambiguitiesAr` / `missingInfoAr`,
  `interpretationConfidence`, `needsHumanReview`. No valid change ⇒
  `UNSUPPORTED_DECISION` (all rejected as out-of-catalog) or
  `INSUFFICIENT_DECISION_DATA`.
- `simulateDecisionScenarios({ textAr, profile? }, opts?)` →
  `DecisionSimulationOutput` — interpret → build CURRENT + up to 3 scenarios →
  run the engines on clones → deterministic diff → one AI recommendation call.
- `opts.client` injects an `AIClient` for tests. Shared `AIClient` / provider
  abstraction, `decisionInterpretationSchema` / `decisionRecommendationSchema`
  (`.strict()`, registered), shared guardrails (`approvedRequirementIds` = whole
  corpus, `approvedAuthorityIds` = the 3), safe logging, one-retry maximum.

**CURRENT baseline** = `runDeterministicState("CURRENT", profile, [], DEMO_VERIFICATION_INPUTS)`
— a no-op clone through `verifyAll`; a test asserts its KPIs deep-equal
`kpisFromRun(getDemoVerificationRun())` (Readiness Index, Verification Coverage,
status counts, critical blockers, verification gaps, `regulatoryPendingIds`,
`applicabilityPendingIds`). Never AI-generated.

**Scenario A / B / C.** A = the user's validated changes (`USER_PROPOSED`,
`USER_STATED` mutations). B = *phased* — numeric deltas halved and tagged
`SCENARIO_ASSUMPTION`; boolean flips deferred to current (dropped from B). C =
*capacity-adjusted* — A's changes plus, when a served-volume field rises and
`workforce.count` is declared and not user-changed, a proportional
`workforce.count` bump tagged `SCENARIO_ASSUMPTION`. B / C are emitted only when
they differ from A and each other — otherwise fewer scenarios are returned
rather than inventing operational facts. An AI-proposed number is never
presented as company data.

**Deterministic simulation pipeline** (per scenario, `runDeterministicState`):
`structuredClone` the profile → apply validated mutations to the clone ONLY →
`verifyAll(requirements, clone, DEMO_VERIFICATION_INPUTS)` → snapshot KPIs +
operational metrics. The stored `DEMO_COMPANY_PROFILE` is never mutated (asserted).

**Internal operational indicator (correctness fix).** `operationalMetrics(profile)`
computes `pilgrimsPerWorkforceMember = pilgrims.count / workforce.count` (`raw`,
2-decimal `display`, `provenanceFieldPaths: ["pilgrims.count","workforce.count"]`,
`classification: "INTERNAL_OPERATIONAL_INDICATOR"`, `null` when a value is missing
or `workforce = 0`). It is explicitly **not** an official requirement / compliance
measure / readiness component / risk tier / government threshold — no "safe" or
"required" ratio is invented — and it **never** feeds readiness, coverage,
blockers, or any score. It is on `DeterministicScenarioState.operationalMetrics`
and its deterministic move is in `ScenarioDiff.operationalMetricChanges`
(`direction: INCREASED | DECREASED | UNCHANGED | UNDETERMINED`). A pure
pilgrim-volume change now shows a real deterministic operational effect
(4200/180 ≈ 23.33 → 5200/180 ≈ 28.89) even though it has no verified regulatory
or readiness effect.

**Scenario diff / "why changed"** (`diffAgainst`, deterministic, before any AI):
`fieldsChanged`, `applicabilityChanges` (from Phase 2 outcomes),
`verificationStatusChanges` (from Phase 3), `readinessDelta` / `coverageDelta`
(RAW − RAW), `blockersAdded` / `blockersRemoved`, `verificationGapsAdded` /
`Removed`, `regulatoryPendingDelta`, `applicabilityPendingDelta`,
`operationalMetricChanges`, deduped `sourceLineage`, and `unresolvedRequirementIds`.

**Deterministic "why did the result change?" (correctness fix).**
`buildWhyChangedAr(diff)` produces the authoritative user-facing explanation as a
list of Arabic lines built ONLY from the diff fields (changed fields, operational
metric move, applicability changed/not, readiness changed/not, coverage
changed/not, blockers/gaps added/removed, uncertainty deltas, unresolved IDs).
When there is an operational change but no verified regulatory/readiness effect
it states this explicitly and safely — "تغيّر المؤشر التشغيلي الداخلي … بينما لم
ينتج عن هذا التغيير وحده أثر تنظيمي أو تغيّر في مؤشر الجاهزية … لا يعني هذا أنه لا
يمكن أن ينطبق أي متطلب مستقبلًا." It is on `DecisionScenarioView.whyChangedAr`.
The AI may add an optional per-scenario `aiNoteAr` (prose-guarded) but never
replaces the deterministic list. The recommendation prompt is fed ONLY the diff;
`scenarioExplanations` are filtered to real scenario IDs.

**Readiness / Coverage / blockers — locked.** All KPIs are read straight off the
Phase 3 `VerificationRun`: unweighted RAW-mean readiness over assessable
eligible (`APPLICABLE` + `SPECIFIED`); coverage = assessable eligible / all
eligible; critical blocker = `SPECIFIED` + `CRITICAL` + `NON_COMPLIANT` only.
No recomputation, no Official Score.

**Recommendation logic.** `recommendedScenarioId` is post-validated against the
computed IDs (a fabricated ID → `null`); it is not "highest readiness wins" —
the prompt is told a scenario that adds a critical blocker or leans on
unconfirmed assumptions may be worse.

**AI prose grounding / rejection (correctness fix).** After the recommendation
call, `recommendationAr` + every `tradeoffsAr` / `assumptionsAr` /
`scenarioExplanations[].whyChangedAr` is scanned by the Phase 6
`scanEvidenceProseForVerdict` (rejects BOTH affirmative and negative compliance
verdicts — "الشركة ملتزمة" / "غير ملتزمة" / "compliant" / "non-compliant" …) and
by a `proseClaimsKpiNumber` check (any readiness/coverage number or bare `%`).
Any hit → the **whole AI recommendation is discarded** (`available: false`,
`failureCode: "GUARDRAIL_REJECTED"`, all prose nulled, `needsHumanReview: true`);
the deterministic `CURRENT` / scenarios / diffs / `whyChangedAr` are retained.
The recommendation system prompt now also forbids stating any KPI number and any
positive-or-negative compliance verdict.

**needsHumanReview follows the RECOMMENDED scenario (correctness fix).** It is
forced when the ACTUAL recommended scenario contains a `SCENARIO_ASSUMPTION`
mutation, adds a critical blocker, or touches a material
`UNRESOLVED_REQUIREMENT`; or when `recommendedScenarioId` is `null`, the
interpretation itself needs review, or the model set its own flag. It is **not**
forced merely because an *unselected* alternative (B/C) contains assumptions.

Recommendation-only AI failure keeps the deterministic scenarios + diffs and
returns `recommendation.available = false` (no fabricated prose).

**Source lineage (§12).** `requirementLineage(id)` returns `requirementId`,
canonical `titleAr`, `authorityId`, `regulatoryResolution`,
`officialSourceReference` / `urls` / `locatorNote`, `locatorStatus`,
`matrixSourceRef`, `season` — no invented page/URL. `UNRESOLVED_REQUIREMENT`
stays visibly unresolved in `unresolvedRequirementIds`.

**Failure model.** Interpretation AI failure (`AI_UNAVAILABLE` /
`PROVIDER_ERROR` / `SCHEMA_VALIDATION_FAILED`, one retry) → `ok:false` with that
code, but `current` is still computed deterministically. Interpretation OK but
no valid change → `UNSUPPORTED_DECISION` / `INSUFFICIENT_DECISION_DATA`, `current`
returned. Recommendation-only failure → deterministic scenarios + diffs retained.

**Files (new):** `src/lib/engine/decisionScenarioEngine.ts`,
`src/lib/engine/__tests__/decisionScenarioEngine.test.ts`;
`src/lib/ai/agents/decisionAgent.ts`,
`src/lib/ai/agents/__tests__/decisionAgent.test.ts`;
`src/lib/ai/scripts/liveDecisionAgent.ts`.
**Files (changed):** `src/lib/ai/schemas/decision.ts`
(+`decisionInterpretationSchema` with `constraints`, +`decisionConstraintSchema`,
+`decisionRecommendationSchema`), `src/lib/ai/schemas/index.ts` (registry),
`src/lib/ai/schemas/__tests__/schemas.test.ts`, `src/lib/ai/agents/index.ts`
(exports), `src/lib/model/ai.ts` (Phase 7 types incl. `DecisionConstraint`).

**Checks:** `typecheck` ✓ · `lint` ✓ · `npm test` 350 pass / 0 fail (was 295,
+55) · `build` ✓. Not committed, not pushed. Phase 8 not started.

**`LIVE_DECISION_AGENT_TEST`** — see the report; run with `AI_PROVIDER=gemini`,
`AI_MODEL=gemini-3.6-flash`, synthetic demo data only, decision "زيادة عدد
الحجاج المخدومين من 4200 إلى 5200 مع بقاء عدد القوى العاملة 180".

---

### Phase 8 — Research Knowledge Agent + approved research corpus — IMPLEMENTATION COMPLETE, CORPUS LOADED (official-web snapshot), AWAITING APPROVAL
Not committed. `AGENTS.md` / `CLAUDE.md` untouched. No UI/Figma change. **No new
dependency** — the Phase 6 PDF parser, `node:crypto`, and the existing `AIClient`
are reused.

**Corpus state: `CORPUS_LOADED`.** Provenance is no longer PDF-only. Two REAL
official Umm Al-Qura University web pages are captured verbatim in a local,
provenance-preserving snapshot (`research_sources/uqu_research_web_sources.md`),
SHA-256 hashed locally and baked into the corpus. Because ≥1 real approved source
now has verified local provenance **and** non-empty grounded passages, the
production corpus is `CORPUS_LOADED`. The web is never fetched at runtime; the
snapshot markdown is a capture container, **not** the publisher (canonical
publisher stays UQU / the Institute).

**The Nawwariyah PDF seed stays PENDING.** `SEED_RESEARCH_ENTRY`
(`sourceKind: "PDF_REPORT"`) is unchanged: `publicationStatus: "INTERIM_REPORT"`,
`sourceVerificationStatus: "PENDING_LOCAL_INGESTION"`, `officialUrl: null`,
`documentHash: null`, `snapshotHash: null`, `ingestedAt: null`, `passages: []`.
The `drive.uqu.edu.sa` PDF still fails TLS certificate validation — **never
bypassed** (no `curl -k`), no substitute PDF invented. It remains a future PDF
source; `isEntryLoaded(seed) === false`.

**Source-kind / locator architecture (`src/lib/research/types.ts`).**
`ResearchSourceKind = "PDF_REPORT" | "OFFICIAL_WEB_PAGE" | "OFFICIAL_STUDY_PAGE"`.
`ResearchLocator = { type: "PDF_PAGE"; page: number; section: string | null } |
{ type: "WEB_SECTION"; section: string }` — the single source of truth for a
passage's origin. A `WEB_SECTION` passage has **no page field** and no invented
page/section. `ResearchPassage` now carries `locator` + `extractionMethod:
"PDF_TEXT" | "WEB_SNAPSHOT_TEXT"`. `ResearchSourceVerificationStatus` adds
`OFFICIAL_WEB_SNAPSHOT_VERIFIED_LOCAL` (distinct from the PDF-download status so
provenance is never ambiguous). `ResearchCorpusEntry` adds `sourceKind` +
`snapshotHash` + `snapshotVerifiedAt`; `researchSeason` and `publicationYear`
are now `string | null` ("when applicable" / no explicit publish date).
`ingestedAt` is reserved for actual PDF ingestion; `snapshotVerifiedAt` is the
distinct "verified locally in this repo" time for a web snapshot (never a UQU
publication date, never a page last-modified date, never file mtime). Existing
PDF ingestion (`ingestResearchPdf`) is unchanged except it emits
`locator: { type: "PDF_PAGE", … }`. `publicationYear` is only ever an explicit
literal or `null` — no runtime code derives it from a "last modified" date (a
test asserts this).

**The two real official UQU web sources (`src/lib/research/corpus.ts`):**
- **SOURCE A** `UQU-HAJJ-INSTITUTE-SIMULATION-UNIT` — "وحدة النمذجة والمحاكاة",
  publisher "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة — جامعة أم القرى",
  `officialUrl: "https://uqu.edu.sa/hajj/70777"`, `sourceKind: "OFFICIAL_WEB_PAGE"`,
  `publicationStatus: "OTHER_APPROVED"`, `researchSeason: null`,
  **`publicationYear: null`** (the page shows only a 2019-05-21 *last modified*
  date — not a publication year, so it is deliberately not stored), one
  `WEB_SECTION` passage (section "main body / unit description") with the exact
  snapshot excerpt.
  Safe use: supports the general institutional role of modelling/simulation for
  evaluating proposals/solutions, suggesting alternatives, deriving
  indicators/readings, and supporting decision-making — it does **not** validate
  any specific Emtithal scenario or numeric output.
- **SOURCE B** `UQU-HAJJ-1447-BRT-SIMULATION-STUDY` — the BRT operational-efficiency
  study/project page, publisher "جامعة أم القرى / معهد خادم الحرمين الشريفين
  لأبحاث الحج والعمرة", `officialUrl: "https://uqu.edu.sa/App/News/178082"`,
  `sourceKind: "OFFICIAL_STUDY_PAGE"`, `publicationStatus: "OTHER_APPROVED"`,
  `researchSeason: "1447H"`, **`publicationYear: "2026"`** (the snapshot states
  "Published by UQU: 2026-03-15"), two `WEB_SECTION` passages (section "article
  body") with the exact snapshot excerpts. It is an **official study/project page, NOT a
  final research report** — its limitations say so and it is never promoted to
  `FINAL_REPORT`; an `OFFICIAL_STUDY_PAGE` also forces `needsHumanReview`. No study
  results, sample sizes, or percentages are stored or invented.

**Local web-snapshot verification (`src/lib/research/verifyWebSnapshot.ts`,
server-only, browser-guarded).** `hashSnapshotBytes(bytes)` and
`verifyWebSnapshot(rootDir)` re-hash `WEB_SNAPSHOT_SOURCE_FILE` and compare to
`WEB_SNAPSHOT_SHA256`
(`32dca19615c7b9d83418fa87e160de7e522b8025edd2d73ae98696c4f6a22ff2`).
`WEB_SNAPSHOT_VERIFIED_AT` = `2026-08-31T16:47:51Z` — a real UTC timestamp
captured once from the machine clock (`date -u +"%Y-%m-%dT%H:%M:%SZ"`), stored as
each web source's `snapshotVerifiedAt` (their `ingestedAt` stays `null`). A test
(`webSnapshot.test.ts`) recomputes the hash on disk and asserts the match,
asserts `snapshotVerifiedAt` is a real `…Z` timestamp (not a placeholder
midnight value), and that both web sources share the same `snapshotHash` +
`snapshotVerifiedAt`.

**Research authority (locked).** One approved publisher only —
معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة، جامعة أم القرى. Research is
DECISION SUPPORT only: it can never create a regulatory requirement, change
applicability / compliance status / readiness / Verification Coverage /
blockers, create an official weight / penalty / integration, resolve an
`UNRESOLVED_REQUIREMENT`, mark evidence VERIFIED, or be presented as Ministry
regulation. Research findings and regulatory truth stay completely separate.

**Seeded publication (`src/lib/research/corpus.ts` — `SEED_RESEARCH_ENTRY`):**
- `titleAr` "تحسين كفاءة المرور بمحطة استقبال حافلات الحجاج والمعتمرين
  بالنوارية باستخدام النمذجة والمحاكاة"
- `publisherAr` "معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة",
  `institutionAr` "جامعة أم القرى"
- `researchSeason` `1447H`, `publicationYear` `"2026"` (established separately as
  bibliographic metadata — kept)
- `publicationStatus` `INTERIM_REPORT` — **stored explicitly, never derived from
  the title at runtime; there is no code path that promotes it to
  `FINAL_REPORT`**
- `theme` `OPERATIONAL_SIMULATION_AND_DECISION_SUPPORT`, curated `topicTags`
- `sourceVerificationStatus` `PENDING_LOCAL_INGESTION`, `passages: []`,
  `documentHash: null`, `snapshotHash: null`, `ingestedAt: null`,
  `snapshotVerifiedAt: null`, `officialUrl: null` (to be set to the exact
  uqu.edu.sa / drive.uqu.edu.sa locator on local ingestion)
- `limitationsAr` includes "المصدر تقرير مرحلي، وتبقى النتائج أو التوصيات قابلة
  للتحديث في التقرير النهائي." and "لا يمثل هذا المصدر متطلبًا تنظيميًا …"

**Research corpus model (`src/lib/research/types.ts`).** `ResearchCorpusEntry`
carries `researchId`, `titleAr`, `publisherAr`, `institutionAr`,
`researchSeason` (`string | null`), `publicationYear` (`string | null`),
explicit `publicationStatus`
(`INTERIM_REPORT | FINAL_REPORT | EXECUTIVE_SUMMARY | OTHER_APPROVED`),
`sourceKind`, `theme`, `topicTags`, `officialSourceReference`, `officialUrl`,
`approvedSourceLocator`, `documentHash`, `snapshotHash`, `ingestedAt`,
`snapshotVerifiedAt`, `sourceVerificationStatus`, `scopeAr`, `limitationsAr`,
and `passages[]`
(`ResearchPassage` = `passageId` + `locator` (`PDF_PAGE` real 1-based page /
`WEB_SECTION` section, no page) + verbatim `textAr` + `extractionMethod:
"PDF_TEXT" | "WEB_SNAPSHOT_TEXT"`), plus `sourceKind` + `snapshotHash`.

**Ingestion (`ingestResearchPdf`).** Reuses the Phase 6 `parsePdf` (via
`@/lib/evidence`, so `unpdf` stays imported by exactly one file) +
`validateEvidenceFile`. Requires an official URL matching
`OFFICIAL_RESEARCH_URL_PREFIXES` (`https://uqu.edu.sa/` / `https://drive.uqu.edu.sa/`
— `opts.allowedUrlPrefixes` is a test-only seam), computes `sha256`
(`node:crypto`), populates real `passages` with page provenance, sets
`sourceVerificationStatus: "OFFICIAL_SOURCE_VERIFIED_LOCAL"` — and **carries
`publicationStatus` through unchanged**. Failure codes: `UNSUPPORTED_FILE_TYPE` /
`EMPTY_FILE` / `FILE_TOO_LARGE` / `PARSE_FAILED` / `NO_EXTRACTABLE_TEXT`. Emits
`locator: { type: "PDF_PAGE", … }`. Tested against the synthetic Phase 6 Arabic
PDF fixture + a clearly synthetic base entry (`TEST-RESEARCH-INGEST-FIXTURE`) and
an `https://example.invalid/…` URL to prove the
validate→parse→hash→page-provenance plumbing; **no real page, statistic,
finding, or the real publication identity is used**. The PDF-report path is
independent of the web-snapshot path; the Nawwariyah PDF seed stays pending.

**Research-truth cleanup.** All **synthetic** loaded-corpus test fixtures use
unmistakably synthetic content: `example.invalid` URLs, bracketed
`[نص اختباري تركيبي]` placeholder passage text, and a `PLACEHOLDER_NUMBER`
(`"12"`) explicitly labelled as *not a research finding* for the numeric-grounding
tests. Synthetic `OFFICIAL_SOURCE_VERIFIED_LOCAL` corpora exist ONLY inside
`*.test.ts`. The only production loaded entries are the two REAL UQU web sources,
whose passage text is the byte-exact snapshot excerpt (a test asserts
`snapshot.includes(passage.textAr)`) and contains **no digit at all** — no `20٪`
/ waiting-time result / sample size / measured improvement / capacity finding /
real page claim exists anywhere in the Phase 8 code, tests, or log.

**Deterministic retrieval (`retrieval.ts`, NO LLM).** `retrieveResearch`
short-circuits to `CORPUS_PENDING` only while **no** entry is locally
ingested/snapshot-verified — with the two web sources loaded it now runs
`matchResearch` over `corpus.filter(isEntryLoaded)` (the still-pending PDF seed is
excluded). `matchResearch` resolves over `researchId`, verbatim canonical title,
and `topicTags` / `scopeAr` token overlap: `MATCH` (one), `AMBIGUOUS` (≥2 — never
a silent pick), `NO_RELEVANT_RESEARCH` (none — no manufactured study, no LLM).
`restrictToResearchIds` narrows the pool.

**Research Agent API (`src/lib/ai/agents/researchAgent.ts`, server-only):**
- `answerResearchQuestion({ questionAr, restrictToResearchIds?, scenarioDiff? }, opts?)`
- `getResearchInsightsForDecision({ scenarioDiff, questionAr? }, opts?)` — wraps
  the above; the `ScenarioDiff` is **read-only** context, never mutated, and the
  result has NO scenario/KPI/recommendation field.
- `opts.client` injects an `AIClient`; `opts.corpus` overrides the corpus
  (tests). Shared `AIClient`, `researchAgentAnswerSchema` (`.strict()`,
  registered), shared guardrails, safe logging, one-retry maximum. The model
  receives only the matched record's metadata + its real passages + provenance
  (+ optional scenario diff) — never the open web.

**Claim grounding.** `claimAr` = `SOURCE_DIRECT`; `relevanceAr` = a separate
`AI_INTERPRETATION` (`provenanceKind: "SOURCE_DIRECT_PLUS_AI_INTERPRETATION"`) —
the two are never merged. Every insight's `researchId` must be the matched
candidate; `citedPassageIds` are filtered to real `passageId`s and an insight
with **zero** real cited passages is dropped (recorded in `droppedInsights`).
Canonical lineage — `sourceTitleAr`, `publisherAr`, `institutionAr`,
`sourceKind`, `officialSourceReference`, `officialUrl`, `publicationStatus`,
`researchSeason`, **`snapshotHash`**, `limitationsAr` — plus each cited passage's
`locator` are **reattached by code from the corpus (`ResearchInsightView`), never
from the model**. `snapshotHash` = `WEB_SNAPSHOT_SHA256` for both web sources,
`null` for the pending PDF; it is **not** in the LLM response schema. A test
proves that a model insight carrying any of `officialUrl` / `sourceTitleAr` /
`publisherAr` / `sourceKind` / `publicationStatus` / `publicationYear` /
`snapshotHash` / `locator` is rejected by the strict schema. For a `WEB_SECTION`
source the surfaced provenance is the section label only — **no page number**,
ever. The model returns claim / relevance / cited-passage-id text only.

**Numeric-claim grounding.** Every numeric token in `claimAr` (percent /
integer / decimal, Arabic-Indic digits folded) must appear verbatim in the
concatenated text of that insight's cited passages; otherwise the whole insight
is dropped (`UNGROUNDED_NUMERIC_CLAIM`). Gemini cannot invent a research
statistic.

**Regulation / research firewall.** `scanEvidenceProseForVerdict` (compliance
verdicts, both directions) + new `scanResearchProseForRegulatoryClaim`
("هذا متطلب رسمي", "وزارة الحج تشترط…", "الوزن الرسمي…", "الغرامة…",
"official/regulatory requirement", "the ministry requires…") run on `summaryAr`
+ every `claimAr` / `relevanceAr`. A NEGATED disclaimer ("لا يمثل ذلك متطلبًا
تنظيميًا", "does not constitute a … requirement") is allowed. Any real hit →
the **whole research answer is discarded** (`failureCode: "GUARDRAIL_REJECTED"`,
`insights: []`, `summaryAr: null`); the approved source + retrieval stay
available. `ResearchAgentResult.containsRegulatoryClaim` is the literal `false`.
The system prompt mandates "تشير الدراسة…" / "يقدم التقرير دعمًا بحثيًا لفكرة…" /
"قد يكون ذا صلة عند تقييم…" / "لا يمثل ذلك متطلبًا تنظيميًا".

**Interim-report / study-page guard.** A **provisional** source
(`publicationStatus === "INTERIM_REPORT"` OR `sourceKind ===
"OFFICIAL_STUDY_PAGE"` — e.g. the Nawwariyah PDF seed and the BRT study page)
forces `needsHumanReview = true` on every surfaced insight and the top-level
result, and keeps its limitations visible. Nothing is ever promoted to
`FINAL_REPORT` (no schema field; lineage is code-reattached). SOURCE A
(`OFFICIAL_WEB_PAGE`, `OTHER_APPROVED`, stable descriptive page) is not forced to
review unless interpretation confidence is `LOW`.

**Phase 7 integration separation.** "لماذا تغيرت النتيجة؟" stays Phase 7
deterministic truth; "دعم بحثي" is a separate Phase 8 section. A test asserts
`getResearchInsightsForDecision` neither reads back nor mutates the passed
`ScenarioDiff` (JSON snapshot unchanged) and the result carries no
`readiness` / `recommendedScenarioId` / `whyChangedAr`.

**Failure model.** `AI_UNAVAILABLE` / `PROVIDER_ERROR` / `SCHEMA_VALIDATION_FAILED`
(one retry) / `GUARDRAIL_REJECTED`, plus retrieval-level `CORPUS_PENDING` /
`NO_RELEVANT_RESEARCH` / `AMBIGUOUS_RESEARCH` (all pre-LLM). On any failure the
approved source + retrieval outcome stay reported, `insights: []`, nothing
fabricated.

**Files (new):** `src/lib/research/{types,corpus,retrieval,ingestResearch,verifyWebSnapshot,index}.ts`;
`src/lib/research/__tests__/{corpus,retrieval,ingestResearch,webSnapshot}.test.ts`;
`src/lib/ai/agents/researchAgent.ts`,
`src/lib/ai/agents/__tests__/researchAgent.test.ts`;
`src/lib/ai/scripts/liveResearchAgent.ts`;
`research_sources/uqu_research_web_sources.md` (verified local official-web snapshot).
**Files (changed):** `src/lib/ai/guardrails/sharedGuardrails.ts`
(+`scanResearchProseForRegulatoryClaim`),
`src/lib/ai/guardrails/__tests__/sharedGuardrails.test.ts`,
`src/lib/ai/schemas/research.ts` (+`researchInsightSchema`,
`researchAgentAnswerSchema`), `src/lib/ai/schemas/index.ts` (registry),
`src/lib/ai/schemas/__tests__/schemas.test.ts`, `src/lib/ai/agents/index.ts`
(exports), `src/lib/model/ai.ts` (Phase 8 types),
`src/lib/ai/client/__tests__/serverOnly.test.ts` (research-layer containment +
web-snapshot browser guard).
Also added: `FINALIST_UI_UX_LOCK.md` (design contract for later UI phases — **no
UI implemented**).

**Provenance-correctness pass.** `publicationYear` → `string | null`; SOURCE A
= `null` (a page "last modified 2019-05-21" is not a publication year — "2019"
is not used anywhere), SOURCE B = `"2026"` (snapshot: "Published by UQU:
2026-03-15"), seed = `"2026"` (kept). `WEB_SNAPSHOT_INGESTED_AT` (placeholder
midnight) → `WEB_SNAPSHOT_VERIFIED_AT` = `2026-08-31T16:47:51Z` (real
`date -u` output), stored as `snapshotVerifiedAt`; web `ingestedAt` = `null`
(reserved for PDF). `snapshotHash` surfaced on `ResearchInsightView`,
code-reattached from the corpus, absent from the LLM schema.

**Checks:** `typecheck` ✓ · `lint` ✓ · `npm test` 403 pass / 0 fail (was 387,
+16) · `build` ✓. Not committed, not pushed. Phase 9 not started.

**`LIVE_RESEARCH_AGENT_TEST = PASSED`** — one real Gemini call
(`provider=gemini`, `model=gemini-3.6-flash`), retrieval restricted to SOURCE A
(`UQU-HAJJ-INSTITUTE-SIMULATION-UNIT`): `corpusState=CORPUS_LOADED`,
`retrieval=MATCH`, `sourceKind=OFFICIAL_WEB_PAGE`, locator
`WEB_SECTION "main body / unit description"` (no page), `officialUrl`
reconstructed by code = `https://uqu.edu.sa/hajj/70777`, Zod + guardrails pass,
`containsRegulatoryClaim=false`, no invented statistic. No company data used.
This live PASS **remains valid after the provenance-correctness pass** — the LLM
output schema (`researchAgentAnswerSchema`), the provider path, and the system
prompt are unchanged; only code-reattached provenance (`snapshotHash`), corpus
metadata (`publicationYear`, `snapshotVerifiedAt`), and one null-safe label in
`buildContext` (`سنة النشر: غير محددة` instead of a literal year for SOURCE A)
changed, none of which alter the live AI contract. Gemini was **not** rerun.
The Nawwariyah PDF stays `PENDING_LOCAL_INGESTION` — its only remaining blocker is
secure local ingestion of the real official PDF over a valid TLS certificate.

---

### Phase 9 — Emtithal AI Orchestrator — IMPLEMENTATION COMPLETE, AWAITING APPROVAL
Not committed. `AGENTS.md` / `CLAUDE.md` untouched. No UI / Figma change. **No new
dependency** — only `node:crypto` (`randomUUID`) is added; every capability is an
existing approved Phase 2–8 engine / agent. Built on the approved Phase 8
checkpoint `eeaf3a2`.

**Purpose.** A server-only Orchestrator that *coordinates* the deterministic
applicability + verification/readiness engines and the Regulatory / Evidence /
Decision / Research intelligence agents. It is **not a new source of regulatory
truth** and creates no authority beyond any child layer. It is not an autonomous
agent loop: no recursive planning, no multi-agent conversation, no background
actions, no browsing, no tools beyond the approved local capabilities.

**Authority order (locked, enforced structurally).** 1) canonical regulatory
model / Matrix → 2) deterministic applicability engine → 3) deterministic
verification/readiness engine → 4) canonical company/evidence data → 5) AI
interpretation layers → 6) research decision-support. AI never overrides
deterministic truth; research never overrides regulation and is **always run
last** (its result never feeds steps 1–5); evidence interpretation never marks
evidence VERIFIED (`EvidenceAgentResult.state` is only `EXTRACTED` /
`AI_INTERPRETED`).

**Deterministic routing first (`src/lib/orchestrator/routing.ts`, NO LLM).**
`classifyIntent(textAr, { evidenceAvailable })` scans normalised Arabic/English
signal dictionaries + a canonical requirement-id regex. 0 categories fire →
`UNSUPPORTED` (invokes nothing). 1 → that single intent. ≥2 → `COMBINED_ANALYSIS`
with capabilities ordered `REGULATORY → EVIDENCE → DECISION → RESEARCH`. An
attached evidence extraction alone makes EVIDENCE live. `extractRequirementId`
lets an explicit id (e.g. `HAJ-EXP-05`) drive retrieval directly.
`routingForForcedIntent(intent, withVerification?)` supports a caller-forced
intent. Result is fully explainable: `matchedSignals`, `method`, `reasonAr`.

**Request-scoped execution plan (correction, pre-checkpoint).** The plan runs
the MINIMUM engines the actual request needs. A separate `VERIFICATION_SIGNALS`
dictionary decides whether `DETERMINISTIC_VERIFICATION` (the company-wide
`verifyAll(...)` snapshot) is in the plan **at all**. It is deliberately
**context-specific**: the bare word `التحقق` / bare `verification` / `coverage` /
`gaps` are NOT signals (ambiguous — "تحقق من هذا الملف" is an evidence request).
A company-wide snapshot needs a readiness / company-status phrase:
`مؤشر الجاهزية` / `مؤشر جاهزية` / `جاهزية الشركة` / `جاهزية امتثال` /
`نسبة التحقق` / `تغطية التحقق` / `فجوات التحقق` / `العوائق الحرجة` /
`وضع الشركة كامل` / `حالة الشركة` / `حالة الامتثال العامة` / `readiness` /
`verification coverage` / `company verification` / `verification gaps` /
`critical blocker` / `blockers`.
- regulatory explanation / applicability only → `DETERMINISTIC_APPLICABILITY` +
  `REGULATORY_INTELLIGENCE`, **no** company-wide verification snapshot
- research only → `RESEARCH_INTELLIGENCE` only
- evidence mapping only → `EVIDENCE_INTELLIGENCE` only (the evidence agent uses
  its own deterministic candidate retrieval — it never forces a regulatory LLM
  call), **no** verification snapshot; `"تحقق من هذا الملف"` / `"هل تم التحقق من
  هذا الدليل؟"` with an attached extraction stay on the evidence path
- decision / what-if → `DECISION_INTELLIGENCE`; the Phase 7 scenario engine runs
  its own deterministic verification on cloned profiles internally — the
  Orchestrator adds no separate company-wide snapshot
- an **explicit** readiness / company-status ask → `["DETERMINISTIC_VERIFICATION"]`
  **only**. `verifyAll(...)` already runs the canonical applicability logic
  internally (`evaluateAllApplicability` inside the Phase 3 engine), so no
  separate `DETERMINISTIC_APPLICABILITY` capability is emitted for a pure
  readiness request — deterministic computation is not duplicated for capability
  bookkeeping. When readiness is asked **alongside** a regulatory requirement,
  `DETERMINISTIC_APPLICABILITY` is still emitted (that one requirement needs it).
- unsupported → nothing
`runOrchestration` computes the snapshot only when `DETERMINISTIC_VERIFICATION`
is in the routed plan. It never produces a company-wide compliance verdict.

**Orchestrator (`src/lib/orchestrator/orchestrator.ts`, server-only,
browser-guarded).** `runOrchestration(request, opts?)`:
- `request`: `{ textAr, profile?, verificationInputs?, evidenceExtraction?, forceIntent? }`
  — `profile` / `verificationInputs` default to the canonical demo; **never mutated**.
- `opts.client` injects one `AIClient` passed to **every** child agent (tests).
- Runs only the routed capabilities, in the fixed sequence: deterministic
  verification snapshot (**only when the plan includes it**) → regulatory
  (deterministic applicability runs inside `explainApplicability` before the LLM)
  → evidence (only when an extraction is attached; candidate set = the regulatory
  requirement ids when present, else the evidence agent's own retrieval) →
  decision (`simulateDecisionScenarios` — deterministic CURRENT always) →
  research (`getResearchInsightsForDecision` when a scenario diff exists, else
  `answerResearchQuestion`).
- **Combines outputs without changing any canonical result.** The deterministic
  verification view (when present) is a deep-copied read-only snapshot of
  `verifyAll(...)`; `officialScoreComputed: false` is carried through.

**Output contract (`src/lib/orchestrator/types.ts`).** `OrchestratorResult`:
`requestId`, `intent`, `routing`, `capabilitiesUsed[]` (per-capability
`CapabilityStatus` = `SUCCESS | NOT_REQUIRED | NO_RELEVANT_DATA | UNAVAILABLE |
FAILED_SAFE`), `deterministicResults` (`applicability` | `verification` |
`scenario`), `aiInsights[]` / `researchInsights[]` / `evidenceInsights[]`
(flattened, provenance-tagged, **verbatim** from each child's already-guardrailed
field — no re-synthesis), `decisionResults`, full child results
(`regulatoryResult` / `evidenceResult` / `researchResult`), `warnings[]`,
`needsHumanReview` + `needsHumanReviewReasons[]`, `provenance`, `failureCode`
(`UNSUPPORTED_REQUEST` | `NO_CAPABILITY_PRODUCED_OUTPUT`), `meta` (`aiCallsMade`,
`llmMetas`, `durationMs`). Irrelevant fields are explicit `null` / `[]`.

**No LLM synthesis layer.** Per the phase rule, no synthesized-summary model call
is added — the flattened insight lists are deterministic composition of child
outputs, introducing no new fact, regulatory claim, or compliance verdict.

**Failure isolation.** Each child agent already returns a controlled result and
never throws; one failure never destroys the others. `AI_UNAVAILABLE` /
`PROVIDER_ERROR` → `UNAVAILABLE` and the deterministic applicability +
verification snapshot (and decision CURRENT) still return.
`SCHEMA_VALIDATION_FAILED` / `GUARDRAIL_REJECTED` / ambiguous retrieval →
`FAILED_SAFE`. Research `NO_RELEVANT_RESEARCH` / regulatory `OUT_OF_CORPUS` /
evidence out-of-scope → `NO_RELEVANT_DATA` with **no LLM call and nothing
fabricated**. A rejected decision recommendation keeps the deterministic
scenarios + diffs.

**Human review (deterministic aggregation, REQUEST-SCOPED).** `needsHumanReview =
needsHumanReviewReasons.length > 0`; reasons are a deterministic, de-duplicated,
sorted list — and **only** from results/capabilities actually surfaced for THIS
orchestration:
- company-wide reasons (`critical-blocker-present`, `pending-verification`,
  `regulatory-pending-requirement`, `ambiguous-applicability`) are added **only**
  when `DETERMINISTIC_VERIFICATION` is in the plan (i.e. the user explicitly
  asked for readiness / verification). A narrow HAJ-EXP-05 + research query
  therefore never inherits a blocker from CIV-03, an ambiguous applicability from
  HAJ-NUSUK-01, or a regulatory-pending from HAJ-PROVIDERS-01 / MOH-01.
- an `*-interpretation-review` reason (`regulatory-` / `evidence-` /
  `decision-` / `research-interpretation-review`) is added **only** when that
  capability produced a SUCCESSFUL, SURFACED AI interpretation **and** that
  interpretation itself legitimately needs review (regulatory / decision-interpret
  `ok && needsHumanReview`; evidence `ok && state === "AI_INTERPRETED" &&
  needsHumanReview`; decision-recommendation `available && needsHumanReview`;
  research a surfaced insight's own `interpretationConfidence === "LOW"`). If the
  capability failed before surfacing an interpretation, only
  `requested-{regulatory,evidence,research,decision}-capability-failed` is added —
  never a phantom interpretation-review. `decision-recommendation-guardrail-rejected`
  is kept for a rejected recommendation because the deterministic scenario output
  still exists.
- other requirement-scoped reasons (`unresolved-requirement`,
  `insufficient-applicability-data`, `ambiguous-regulatory-retrieval`) are
  deterministic / retrieval conditions about the specific requirement asked
  about, independent of the LLM call outcome.
- `provisional-research-source` is added **only** when an ACTUALLY SURFACED
  research insight has `publicationStatus === "INTERIM_REPORT"` OR
  `sourceKind === "OFFICIAL_STUDY_PAGE"`. `research-interpretation-review` is
  added **only** when a surfaced insight's own `interpretationConfidence` is
  `LOW`. Neither is ever added merely because Research Intelligence ran, and
  neither depends on the child's aggregate `needsHumanReview` flag. SOURCE A
  (`OFFICIAL_WEB_PAGE` / `OTHER_APPROVED`) with a grounded MEDIUM/HIGH insight
  produces **no** research review reason; SOURCE B (`OFFICIAL_STUDY_PAGE`)
  always produces `provisional-research-source`.
- `requested-{regulatory,evidence,research}-capability-failed` is added only when
  a capability the user explicitly requested returned a controlled failure.
It is never a model decision.

**Provenance (`OrchestratorProvenance`).** Reattached from child results, never
via an LLM: regulatory = canonical `SourceLineage[]`; evidence = deterministic
extraction locators (`PDF_PAGE` page / `XLSX_CELL` sheet!cell); decision =
scenario ids + deduped `RequirementLineage[]` from `ScenarioDiff.sourceLineage`;
research = canonical `researchId`s + `sourceKind`s + `publicationStatus`es +
`snapshotHash`es + `WEB_SECTION` locators (no page); `ai` = safe `AICallMeta[]`
only (no prompts, no raw content).

**Immutability.** The Orchestrator writes nothing back to the company profile,
verification inputs, regulatory matrix, research/regulatory corpora, evidence
verification status, applicability, readiness, blockers, data-source states, or a
scenario baseline. Tests JSON-snapshot every canonical input (and a
caller-supplied profile) before/after and assert byte-equality.

**Files (new):** `src/lib/orchestrator/{types,routing,orchestrator,index}.ts`;
`src/lib/orchestrator/__tests__/{routing,orchestrator}.test.ts` +
`__tests__/helpers.ts`; `src/lib/ai/scripts/liveOrchestrator.ts`.
**Files (changed):** `src/lib/ai/client/__tests__/serverOnly.test.ts`
(orchestrator server-only containment + browser guard).

**Checks:** `typecheck` ✓ · `lint` ✓ · `npm test` 449 pass / 0 fail (was 403,
+46 for Phase 9; the last +7 are the edge-case pass: interpretation-review
gating A–D, tightened verification-signal routing, and pure-readiness minimal
plan) · `build` ✓. Not committed, not pushed. Phase 10 not started.

**`LIVE_ORCHESTRATOR_TEST` — first run (pre-correction, historical): PASSED.**
One orchestration of the safe combined request against the canonical demo
company (`provider=gemini`, `model=gemini-3.6-flash`): `intent=COMBINED_ANALYSIS`,
regulatory → `HAJ-EXP-05` with exact title `"توثيق فعاليات ومبادرات فريق السعادة"`,
`applicability=APPLICABLE`, research → `UQU-HAJJ-INSTITUTE-SIMULATION-UNIT`
(`OFFICIAL_WEB_PAGE` / `OTHER_APPROVED` / `WEB_SECTION`, canonical `snapshotHash`,
`containsRegulatoryClaim=false`, no invented number), Zod + guardrails passed.
That run also exposed the request-scoping defect (it computed a full
company-wide verification snapshot and leaked unrelated review reasons), now
fixed above.

**`LIVE_ORCHESTRATOR_TEST` — fresh run after the edge-case pass: still BLOCKED
by a persistent Gemini `PROVIDER_ERROR` (not a Phase 9 regression).** One fresh
attempt (per the standing rule — not retried repeatedly): both child generations
returned `PROVIDER_ERROR` in ~200–650 ms; the tiny `liveConnectivity` probe still
`PASSED` and the **unchanged Phase 5** `explainRequirement("HAJ-EXP-05")` failed
identically → Gemini-side quota / outage. The deterministic portion confirmed
every corrected behaviour:
`intent=COMBINED_ANALYSIS`; **`ranDeterministicVerification=false`**;
caps `DETERMINISTIC_APPLICABILITY:SUCCESS`, `REGULATORY_INTELLIGENCE:UNAVAILABLE`,
`RESEARCH_INTELLIGENCE:UNAVAILABLE`; `regReq=HAJ-EXP-05`,
`regTitle="توثيق فعاليات ومبادرات فريق السعادة"`, `regState=SPECIFIED`,
`applicability=APPLICABLE`. And the interpretation-review gating fix is visible:
`needsHumanReviewReasons` = **`[requested-regulatory-capability-failed,
requested-research-capability-failed]`** — the phantom
`regulatory-interpretation-review` from the previous run is **gone**, and there is
no company-wide leakage. `liveOrchestrator.ts` is ready (its `ok` gate asserts
`ranDeterministicVerification === false`, exact title, SOURCE A id/kind/hash, no
leaked reasons); it will pass once the Gemini quota recovers.

---

### Phase 10 — Auth + Landing + Government Portal + Regulatory Management — IMPLEMENTATION IN PROGRESS, AWAITING APPROVAL
Not committed. `AGENTS.md` / `CLAUDE.md` untouched. `.env.local` untouched.
**No new dependency** (`package.json` unchanged). Gemini not retried. Built on
approved checkpoint `1df46d1`.

**Scope this phase (per the phase brief §0):** shared UI foundation / design
tokens · responsive app shell · approved minimal landing · auth entry role ·
government regulatory-management lifecycle (create / update / new version /
activate / deactivate) · version history + audit presentation · deterministic
applicability-scoped impact + regulatory-change notifications · finalist-ready
exportable report. Full company screen-by-screen UI and a full mission-control
redesign are **Phase 11** — the legacy `/company/*` and legacy `/ministry/*`
pages keep their current layout and inherit only the new brand tokens + Cairo +
the shared shell (icons, logo, mobile drawer).

**Design tokens (`src/app/globals.css`).** The three authoritative product-owner
colors are the palette root: `--brand-ink #081E0D`, `--brand-green #263F38`,
`--brand-neutral #DDDAD5`, plus carefully-derived steps
(`--brand-green-hover/-tint`, `--brand-neutral-strong`, `--brand-paper`). Every
pre-existing `--color-*` token is re-pointed onto the brand palette so all
existing pages inherit the correct brand with no breakage. Status / risk stay
**semantic** but tuned to sit with the green (no vivid pure hues); contrast
kept. Added spacing-rhythm tokens (`--space-gutter 24px`, `--space-grid-gap
16px`, `--radius-card`, `--radius-control`, `--sidebar-w 256px`,
`--content-max 1200px`) transcribed from the approved Figma capture, and a
`@media print` block.

**Cairo (`src/app/layout.tsx`).** `next/font/google` `Cairo` (ar + latin,
weights 300–800) bound to `--font-arabic` — one family across the product.

**Canonical logo.** The exact product-owner-supplied asset was copied verbatim
to `public/emtithal-logo.png` (1882×836). `src/components/ui/Logo.tsx` renders
it via `next/image`, aspect-ratio locked to the asset's intrinsic size — never
redrawn / recreated with text / recolored / distorted. The old placeholder "ام"
green box is removed from the landing and the sidebar.

**Responsive app shell.** `AppShell` + `Sidebar` reworked: 256px static sidebar
on desktop (`md+`), an off-canvas drawer + hamburger below `md`; `--content-max`
centered main; logical properties (`border-e`, `-start`, `end-0`) for RTL. Nav
icons are now a single inline-SVG **line-icon set** (`NavIcon.tsx`) — **no
emoji**; the header bell is an SVG. `navConfig` icon fields became stable keys.
Government nav: مركز التحكم · الشركات · المتطلبات والمعايير · التقارير · المخاطر ·
المراجعات · التنبيهات.

**Landing (`src/app/page.tsx`).** Rebuilt to the approved minimal structure —
canonical `<Logo>` · language control (ع/EN toggle, no i18n backend) · headline ·
short supporting text · **subtle AI-disclaimer pill** (approved) · «دخول الجهات
الحكومية» · «دخول الشركات» · minimal footer. **Removed:** self-registration
(«ليس لديك حساب؟ سجل الآن» — not approved), the role picker, the feature grid,
value-props, and the "how it works" pipeline. Locked content lives in
`src/lib/ui/landing.ts` and is source-scan-tested.

**Auth entry.** No new auth system — the existing client `demoStore` session
(`view` + `companyRole`) is preserved. Added the canonical single company role
`"company_representative"` («ممثل الشركة», `COMPANY_REPRESENTATIVE_ROLE`) to the
legacy `CompanyRole` union + label; the landing enters companies as that role
with **no role picker**. Government entry sets the ministry session (no
role/title picker). No external government SSO is implied.

**Government regulatory-management domain (`src/lib/regmgmt/`, pure, tested).**
A **management layer around** the canonical Phase-1 matrix — canonical
requirements are **never mutated**. Files:
- `types.ts` — `ReqLifecycleStatus` (`DRAFT|ACTIVE|SUPERSEDED|DEACTIVATED`),
  `RequirementVersionRecord` (append-only), `ManagedRequirement`, `AuditEntry`
  (8 actions), `RegChangeType` (6), `CompanyImpact` / `ImpactAnalysis` (with the
  literal `makesNonCompliant:false` / `autoNonComplianceApplied:false`),
  `RegChangeNotification`.
- `lifecycle.ts` — pure state machine + `LIFECYCLE_TRANSITIONS` /
  `canTransition`; `validateVersionInput`; `createNewRequirementDraft`,
  `issueNewVersionDraft`, `updateDraft`, `activateVersion` (supersedes the prior
  ACTIVE, sets its `effectiveUntil`, keeps it in history),
  `deactivateRequirement` (sets `effectiveUntil`, never deletes). Controlled
  `{ ok } | { ok:false, errorAr }` results — no throwing.
- `audit.ts` — append-only entries; `auditForRequirement` (newest first).
- `store.ts` — **separate** versioned localStorage store
  (`emtithal-regmgmt-v1`, schema v1, own envelope + shape guard — same pattern as
  the demo store, does NOT touch the demo store's shape/tests). `seedRegMgmtState`
  layers an ACTIVE v1 baseline (origin `CANONICAL_BASELINE`) over every canonical
  requirement, no audit. Pure reducers (`reduceCreateRequirement`,
  `reduceIssueVersion`, `reduceUpdateDraft`, `reduceActivateVersion`,
  `reduceDeactivate`, `reduceRecordNotifications`).
- `impact.ts` — `analyzeImpact(version, changeType, portfolio, canonicalReq)`
  runs the **approved deterministic `evaluateApplicability`** per company:
  `NOT_APPLICABLE → NO_IMPACT`; `INSUFFICIENT_DATA →
  APPLICABILITY_REEVALUATION_REQUIRED`; `APPLICABLE →` `NEW_EVIDENCE_REQUIRED`
  (or `PENDING_VERIFICATION` for an upcoming date, or re-evaluation for a
  deactivation). Never `NON_COMPLIANT`; scopes to affected companies only.
- `notifications.ts` — `buildRegChangeNotifications` → one per affected company
  (state ≠ NO_IMPACT), concise Arabic copy per type
  ("تم إصدار اشتراط جديد ينطبق على منشأتك", …), `actionRequired` flag, and a
  deep `targetHref` (`/company/compliance/<id>`). Unrelated companies get none.
- `report.ts` — `buildComplianceReport` → structured
  `ComplianceReport` (company, season, «مؤشر جاهزية امتثال», «نسبة التحقق»,
  requirement rows, gaps, critical blockers, unresolved / pending,
  official-source refs), `officialScoreIncluded:false`. `toReportCsv`
  (UTF-8 BOM, quoted) and `toReportHtml` (print-friendly). `displayValue(null)`
  → `"—"`, never `0`. **No dependency added.**

**Government UI.** `RegMgmtProvider` (client context, wraps the pure reducers +
the `emtithal-regmgmt-v1` key) in `src/app/ministry/layout.tsx`. Pages:
`/ministry/requirements` (managed list + status chips), `/ministry/requirements/new`
(draft editor — creates a `DRAFT`), `/ministry/requirements/[id]` (current-version
detail, **version history**, **audit trail**, "issue new version" form,
**activate**, **deactivate**, **impact analysis** table + **notification
preview** built + recorded), `/ministry/reports` (readiness report from the
canonical demo verification run — CSV download + print-friendly HTML/PDF).
Demo government portfolio for impact = `src/lib/data/demo/governmentPortfolio.ts`
(4 clearly-labelled `(تجريبي)` profiles derived from the one approved demo draft
with declared-fact variations). Trust-boundary chips (`BoundaryChip`:
REGULATION / VERIFICATION / AI / RESEARCH) added to the kit; the impact panel
carries a `VERIFICATION` marker.

**Product-truth in UI.** «مؤشر جاهزية امتثال» / «نسبة التحقق» used verbatim; no
Official Score anywhere (report enforces `officialScoreIncluded:false`);
canonical IDs (`HAJ-EXP-*`) are the primary identity, `CR-*` not surfaced;
null readiness renders `—`. Internal enums are mapped to Arabic labels
(`LIFECYCLE_LABEL_AR`, `IMPACT_STATE_LABEL_AR`, `AUDIT_ACTION_LABEL_AR`,
`REG_CHANGE_TYPE_LABEL_AR`, `APPLICABILITY_AR`).

**Roadmap boundaries respected** — no source crawler / live website watcher /
government API / auto-promotion of detected changes / trained predictive ML
model was implemented or claimed anywhere in code or copy.

**Tests (new).** `src/lib/regmgmt/__tests__/{lifecycle,impact,report}.test.ts`
(23) — seed baseline; transition table; create DRAFT (not active, not canonical
truth); canonical model never mutated; issue+activate preserves the old version
(SUPERSEDED, `effectiveUntil` set, `supersededByVersion`); activation needs an
effective date; invalid transitions fail safely; deactivation keeps history;
DRAFT_UPDATED / SOURCE_CHANGED / EFFECTIVE_DATE_CHANGED audit; versioned store
round-trip + rejection; impact scoping (APPLICABLE / NOT_APPLICABLE /
INSUFFICIENT_DATA); **no auto-NON_COMPLIANT** across all change types;
notifications only to affected companies (the unrelated one gets none) with the
right deep link + action flag; deterministic repeatability; report has no
Official Score, `—` not `0`, echoes only supplied canonical values, UTF-8 BOM.
`src/lib/ui/__tests__/landing.test.ts` (7) — exact government CTA; company entry
role = `company_representative` / «ممثل الشركة» + no role picker; **no
self-registration** affordance; AI-disclaimer pill present + concise; canonical
`<Logo>` asset used (old "ام" box gone); no stale Figma / MVP mock content; no
SSO implied.

**Emoji-removal correction (pre-approval).** No Unicode/color emoji anywhere in
active user-facing UI. Removed: KPI `icon="📊/⚠️/🔎/🧾/🎯/🚨/⏳/🗂️/🛠️/📋"` props
(dashboard, control-center); the standalone `🚨` on the dashboard critical-gate
banner → line-SVG warning; `AlertCard` per-type emoji map → one severity-tinted
`NavIcon name="warning"`; `EvidenceCard` file-type emoji map → one
`NavIcon name="document"` (file type kept as a text label/`title`);
`DecisionForm` category `🧭/👥/🛎️/🕋/🗂️/⚙️` + submit-button `🧭` removed, and
`icon` dropped from `decisionCatalog` data; `Card.EmptyState` default `icon="📋"`
→ optional `ReactNode`; `KPICard` trend `▲/▼` → inline-SVG chevron; four UI
`✓ …` confirmation prefixes stripped; `regmgmt/lifecycle.ts` comment diagram
`▶/◀` → ASCII. `NavIcon` gained `warning` + `document`. Retained (monochrome
typographic glyphs, not emoji, and matching the Figma): `←` / `→` as
"more/forward/from→to" text, and `→` inside `src/lib/**` diagnostic strings.

**Checks:** `typecheck` ✓ · `lint` ✓ · `npm test` **479 pass / 0 fail** (was
449, +30) · `npm run build` ✓ (20 routes, incl. the 4 new government routes).
Dev-server smoke: `/`, `/ministry/requirements`, `/ministry/requirements/new`,
`/ministry/reports`, `/ministry/control-center`, `/company/dashboard` all HTTP
200, no runtime-error markers. Not committed, not pushed. Phase 11 not started.

**Known limitations (Phase 11).** The legacy `/company/*` and legacy
`/ministry/*` (control-center, companies, standards, risks, reviews, alerts)
screens are not yet rebuilt to the Figma direction — they render with the new
tokens/font/shell but their internal layouts are the pre-Phase-10 MVP. A full
mission-control redesign, the full responsive re-layout of every legacy screen,
and the full company screen set are Phase 11. Visual QA at tablet/mobile widths
was done statically (breakpoints, logical properties, drawer, `overflow-x-auto`
tables, `max-w`); a live multi-viewport pass belongs with the Phase 11 UI build.

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
