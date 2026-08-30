EMTITHAL — AI AGENTS ARCHITECTURE v1

1. Purpose

This document defines the AI architecture for the Finalist version of Emtithal.

The AI layer must provide real LLM-based intelligence while preserving deterministic regulatory verification.

Core principle:

AI interprets, extracts, retrieves, explains, and recommends.

The Verification Engine remains the source of truth for compliance status.

⸻

2. AI System Goals

The AI system must support four main capabilities:

1. Regulatory Intelligence
2. Evidence Intelligence
3. Decision Intelligence
4. Research Knowledge Intelligence

All agents must operate under strict source, confidence, and verification controls.

⸻

3. Agent Architecture

The system contains four primary AI agents:

Regulatory Intelligence Agent

Evidence Intelligence Agent

Decision Intelligence Agent

Research Knowledge Agent

They are coordinated by an orchestration layer.

Architecture:

User Request
↓
AI Orchestrator
↓
Relevant Agent
↓
Approved Data Sources
↓
Structured AI Output
↓
Validation / Guardrails
↓
Deterministic Engine if required
↓
User Result

⸻

4. AI Orchestrator

The AI Orchestrator decides which agent or agents are required.

Responsibilities:

* classify the request
* route it to the correct agent
* provide company context
* provide regulatory context
* enforce source restrictions
* combine agent outputs
* prevent duplicate reasoning
* pass calculable values to deterministic engines

The orchestrator must never create regulatory facts itself.

⸻

5. Regulatory Intelligence Agent

Role

وكيل التنظيمات

Purpose:

Understand and retrieve regulatory requirements from the approved regulatory corpus.

Responsibilities:

* retrieve relevant requirements
* identify the authority
* identify the domain
* identify applicable requirements
* explain why a requirement may apply
* return official source references
* identify related regulatory requirements
* detect unresolved regulatory information

Allowed sources:

* REGULATORY_MATRIX_v1.md
* approved official regulatory corpus
* verified official sources stored in the system

The agent must not use open-ended model knowledge as regulatory truth.

⸻

Regulatory Agent Output

The output must be structured.

Example:

{
“requirementIds”: [“HAJ-NUSUK-01”],
“authority”: “وزارة الحج والعمرة”,
“reason”: “The decision affects an operational area linked to this requirement.”,
“sources”: [],
“confidence”: “HIGH”,
“unresolved”: []
}

⸻

Regulatory Agent Guardrails

The Regulatory Agent MUST NOT:

* invent a regulation
* invent an official weight
* invent a penalty
* invent an official target
* invent an API
* use research studies as regulatory requirements
* apply a requirement from another season without verification
* declare compliance

If no approved requirement exists:

UNRESOLVED_REQUIREMENT

⸻

6. Evidence Intelligence Agent

Role

وكيل الأدلة

Purpose:

Read company evidence and extract facts required for verification.

Supported MVP inputs:

* PDF
* Excel
* text content
* structured imported data

Future support may include:

* Word
* CSV
* images

⸻

Evidence Agent Responsibilities

The agent may extract:

* document type
* dates
* names
* counts
* entities
* service providers
* contract information
* operational facts
* evidence references
* missing information
* conflicting information

Example:

{
“facts”: [
{
“field”: “busCount”,
“value”: 45,
“evidenceReference”: “page 3”
}
],
“missingFields”: [],
“contradictions”: [],
“confidence”: “HIGH”
}

⸻

Evidence Agent Boundary

The Evidence Agent may say:

“Evidence contains a documented count of 45 buses.”

It must NOT say:

“The company is compliant.”

Compliance is decided only after the extracted facts pass through the Verification Engine.

⸻

7. Evidence Confidence

Every extracted fact must include:

confidence
source
evidenceReference

Confidence levels:

HIGH
MEDIUM
LOW

Low-confidence extraction may require:

PENDING_VERIFICATION

or:

humanReviewRequired = true

⸻

8. Decision Intelligence Agent

Role

وكيل ذكاء القرار

This is the primary differentiating AI capability in Emtithal.

Purpose:

Understand an operational decision and analyze how it may affect the company’s regulatory and operational position before execution.

Example input:

“زيادة عدد الحافلات بنسبة 15%”

⸻

9. Decision Understanding

The agent must convert natural-language decisions into structured decision objects.

Example:

{
“decisionType”: “TRANSPORT_CAPACITY_CHANGE”,
“action”: “INCREASE”,
“value”: 15,
“unit”: “PERCENT”,
“domain”: “TRANSPORT”,
“confidence”: “HIGH”
}

If important information is missing, it must identify assumptions or ask for required data.

It must not silently invent critical values.

⸻

10. Decision Analysis Flow

Decision Input
↓
Interpret Decision
↓
Identify Operational Domain
↓
Retrieve Company Context
↓
Retrieve Applicable Requirements
↓
Identify Affected Requirements
↓
Retrieve Research Insight if useful
↓
Generate Scenarios
↓
Generate Assumptions
↓
Calculate deterministic effects where possible
↓
Explain risks and changes
↓
Recommend lower-risk option

⸻

11. Scenario Generation

The agent may generate multiple realistic scenarios.

Example:

Current State

Scenario A:
Increase buses by 10%

Scenario B:
Increase buses by 15%

Scenario C:
Redistribute existing buses

The agent must not generate unrealistic scenarios simply to create variety.

⸻

12. Scenario Structure

Each scenario must contain:

scenarioId
title
description
changes[]
assumptions[]
affectedRequirements[]
operationalEffects[]
regulatoryEffects[]
researchInsights[]
confidence
dataUsed[]
sources[]
unresolved[]

⸻

13. Deterministic Calculation Boundary

The AI may identify what should be calculated.

The AI must not fabricate calculation results.

Example:

If:

required = 1000
actual = 960

The deterministic engine calculates:

gap = 40

The LLM may explain the result.

It must not replace the calculation.

⸻

14. Scenario Result

A scenario result may contain:

Readiness Impact
Affected Requirements
Risk Level
Critical Blockers
Operational Impact
Research Insight
Confidence
Assumptions
Source Lineage

Any unavailable metric must be shown as unavailable rather than estimated without a defined rule.

⸻

15. Recommendation Logic

The Decision Agent may recommend a scenario based on:

* lower compliance risk
* fewer critical blockers
* greater verified readiness
* available operational data
* research-supported operational insight
* fewer unresolved assumptions

The recommendation must explain:

Why this option?
What data was used?
What assumptions were made?
What risks remain?

⸻

16. Explainability

Every AI decision result must contain:

reason
requirementsUsed[]
dataUsed[]
assumptions[]
sources[]
confidence

The interface must support:

لماذا تغيرت النتيجة؟

Example:

تحسن:
جاهزية النقل

لم يتغير:
متطلب آخر لعدم وجود بيانات كافية

يتطلب مراجعة:
تأثير تشغيلي واحد بثقة منخفضة

⸻

17. Research Knowledge Agent

Role

وكيل المعرفة البحثية

Primary V1 corpus:

معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة — جامعة أم القرى

The agent uses approved official studies and research publications from the institute.

⸻

18. Research Agent Responsibilities

The agent may:

* search the approved research corpus
* identify relevant studies
* summarize findings
* extract operational insights
* show publication year
* show original source
* provide research-supported suggestions

⸻

19. Research Search Output

Example:

{
“query”: “تقليل زمن انتظار الحافلات”,
“studies”: [
{
“title”: “…”,
“year”: “…”,
“source”: “…”,
“summary”: “…”,
“operationalInsight”: “…”
}
],
“confidence”: “HIGH”
}

⸻

20. Research Guardrail

Research knowledge is advisory.

Strict rule:

Research Insight ≠ Regulatory Requirement

Research must never:

* change Official Score
* become a regulatory obligation
* create a violation
* create an official weight
* override an official regulation

Unless an official regulator explicitly adopts the requirement through an approved official source.

⸻

21. Research Inside Decision Intelligence

The Decision Intelligence Agent may invoke the Research Knowledge Agent.

Example:

Decision:
Increase shuttle buses

Regulatory Agent:
Identifies affected requirements.

Research Agent:
Finds relevant research about transport flow or capacity.

Decision Agent:
Uses both sources to explain the scenario.

The UI must clearly separate:

Regulatory Impact

from:

Research Insight

⸻

22. Approved Source Principle

Each agent operates only on approved source categories.

Regulatory

Official regulatory corpus only.

Evidence

Company-provided or connected evidence.

Research

Approved institute research corpus.

Company Context

Verified operational profile and trusted data sources.

The LLM’s pretrained knowledge must not be treated as an authoritative source.

⸻

23. Source Lineage

Every important result must maintain:

Result
→ Agent
→ Requirement / Research Item
→ Source
→ Company Data
→ Evidence

No important regulatory result should appear without traceability.

⸻

24. Confidence Model

All AI outputs use:

HIGH
MEDIUM
LOW

Example internal interpretation:

HIGH:
Strong source match and sufficient data.

MEDIUM:
Relevant evidence exists but interpretation contains uncertainty.

LOW:
Insufficient, ambiguous, or conflicting information.

Confidence is not a regulatory score.

⸻

25. Human Review Rules

Human review should be triggered when:

confidence = LOW

or when:

* evidence conflicts
* regulatory applicability is ambiguous
* critical requirement interpretation is uncertain
* user reports an AI result
* evidence extraction is incomplete
* source data is outdated

Output:

humanReviewRequired = true

⸻

26. Report Result Workflow

Users may report an inaccurate AI result.

Statuses:

OPEN
UNDER_REVIEW
WAITING_FOR_USER
RESOLVED
CLOSED

Stored data:

resultId
agent
model
resultVersion
userReport
reviewStatus
reviewNotes
resolution
createdAt
resolvedAt

⸻

27. AI Result Versioning

AI results must support version tracking.

Example:

resultVersion = 1

If evidence changes or the AI result is regenerated:

resultVersion = 2

Previous versions remain available in the audit trail.

⸻

28. Prompt Architecture

Prompts must be separated by agent.

Do not use one giant prompt for all AI functions.

Suggested structure:

src/lib/ai/prompts/
regulatory.ts
evidence.ts
decision.ts
research.ts
sharedGuardrails.ts

Shared guardrails are injected into every relevant request.

⸻

29. Structured Outputs

Agents must prefer structured JSON outputs validated by schemas.

Do not depend on parsing free-form prose for core system logic.

Suggested validation:

Zod schema
or equivalent runtime schema validation

If model output fails schema validation:

1. retry once if safe
2. otherwise return controlled failure
3. do not fabricate missing fields

⸻

30. AI Service Layer

Suggested architecture:

src/lib/ai/
client/
agents/
prompts/
schemas/
orchestration/
guardrails/

Agents should not directly mutate application state.

They return structured results.

The application layer decides what to persist.

⸻

31. Provider Abstraction

The AI implementation should not tightly couple the entire product to one provider.

Use a small internal abstraction.

Example:

AIClient

* generateStructured()
* generateText()

The initial implementation may use one real supported LLM provider.

Changing providers later should not require rewriting business logic.

⸻

32. Real AI Requirement

The Finalist implementation must distinguish clearly between:

REAL_AI
DETERMINISTIC_FALLBACK
DEMO_DATA

The current rule-based Decision Agent must not be presented as the final real AI architecture.

A real LLM call must power the Finalist AI capabilities where the UI claims AI analysis.

⸻

33. Fallback Strategy

If the external AI service fails:

The platform must not crash.

Return:

AI_UNAVAILABLE

and preserve deterministic capabilities.

Where appropriate, the UI may still show:

* compliance data
* verified requirements
* deterministic status
* existing evidence
* saved scenario results

The fallback must not impersonate a successful AI result.

⸻

34. Demo Reliability

For finalist presentation, demo reliability is essential.

The system may include stable demo inputs and known scenarios.

However:

DEMO_DATA

must be clearly separated in code from:

REAL_DATA

If real AI is available during the demo, use it.

If it fails, the system must fail gracefully without presenting fake live AI analysis.

⸻

35. Security

AI requests should use the minimum required data.

Do not send unnecessary sensitive company information to the model.

Future production architecture should support:

* tenant isolation
* access control
* encrypted secrets
* audit logging
* data minimization

API keys must never be stored in frontend code.

⸻

36. Server-Side AI Calls

All real AI calls must run server-side.

Never expose provider API keys to the browser.

Recommended flow:

Browser
↓
Next.js Server Route / Server Action
↓
AI Service Layer
↓
LLM Provider

⸻

37. Environment Variables

AI provider credentials must be stored in environment variables.

Example conceptual configuration:

AI_PROVIDER_API_KEY
AI_MODEL

Do not hardcode keys in source files.

Do not commit secrets to GitHub.

⸻

38. Logging

Log enough metadata for debugging without leaking unnecessary sensitive content.

Suggested fields:

requestId
agent
model
duration
success
schemaValid
confidence
timestamp

Do not log API keys.

⸻

39. Testing

Each agent requires tests.

Minimum categories:

Regulatory Agent

* finds approved requirement
* rejects unsupported regulation
* returns unresolved when no source exists

Evidence Agent

* extracts expected facts
* detects missing fields
* returns confidence
* does not declare compliance

Decision Agent

* understands known decision
* identifies affected requirements
* produces multiple scenarios
* exposes assumptions
* does not invent regulatory facts

Research Agent

* retrieves approved research
* keeps research separate from regulation

⸻

40. Guardrail Tests

Required tests must verify:

AI cannot invent officialWeight

AI cannot invent penalties

AI cannot turn missing data into COMPLIANT

AI cannot use research as regulation

AI cannot claim unavailable integration is connected

AI result exposes source and confidence

⸻

41. Decision Agent Example

Input:

زيادة عدد الحافلات بنسبة 15%

Expected architecture:

Decision Agent
↓
Transport domain detected
↓
Company transport data loaded
↓
Regulatory Agent called
↓
Relevant requirements retrieved
↓
Research Agent optionally called
↓
Scenarios generated
↓
Deterministic values calculated
↓
Comparison returned

The UI receives a structured result rather than raw model prose.

⸻

42. Evidence Agent Example

Input:

Uploaded operational report.

Expected flow:

File
↓
Evidence Agent
↓
Structured Facts
↓
Confidence
↓
Verification Engine
↓
Compliance Status

The AI extraction and the compliance decision remain separate.

⸻

43. Regulatory Agent Example

Question:

“هل هذا المتطلب ينطبق على شركتي؟”

Expected flow:

Company Profile
+
Approved Regulatory Matrix
↓
Regulatory Agent
↓
Relevant Requirement
↓
Applicability Information
↓
Verification Engine / Applicability Rule

If applicability cannot be determined:

INSUFFICIENT_DATA

or:

UNRESOLVED_REQUIREMENT

⸻

44. Research Agent Example

Question:

“وش أفضل طريقة نقلل فيها انتظار الحافلات؟”

Expected result:

Relevant official institute research
+
Concise summary
+
Operational insight
+
Original source

No regulatory status is changed.

⸻

45. UI Output Principle

AI output should not appear as large paragraphs.

Prefer:

Summary
Affected Requirements
Risk
Confidence
Source
Assumptions
Recommended Action

Use expandable details for longer reasoning.

This follows the approved Figma philosophy:

Show more. Explain less.

⸻

46. AI Loading States

The UI should distinguish:

ANALYZING
COMPLETED
FAILED
NEEDS_REVIEW

Do not leave users with an indefinite loading state.

⸻

47. Failure States

Examples:

AI_UNAVAILABLE
SOURCE_NOT_FOUND
INSUFFICIENT_DATA
SCHEMA_VALIDATION_FAILED
UNRESOLVED_REQUIREMENT
HUMAN_REVIEW_REQUIRED

Failures must be explicit and controlled.

⸻

48. No Hallucination Rule

If the model does not have sufficient verified information:

It must not generate a plausible answer as fact.

It must return:

INSUFFICIENT_DATA

or:

UNRESOLVED_REQUIREMENT

with a short explanation of what is missing.

⸻

49. Existing Decision Agent Migration

The existing rule-based Decision Agent V1 may be preserved temporarily as:

* deterministic fallback
* compatibility layer
* test reference

But it must not be presented as the Finalist real AI Decision Agent.

The migration should preserve existing working functionality while adding the real AI layer.

⸻

50. Implementation Order

Recommended AI implementation sequence:

Phase A

AI client abstraction + environment setup

Phase B

Schemas + shared guardrails

Phase C

Regulatory Intelligence Agent

Phase D

Evidence Intelligence Agent

Phase E

Decision Intelligence Agent

Phase F

Research Knowledge Agent

Phase G

Agent orchestration

Phase H

UI integration

Phase I

Tests + fallback + demo verification

⸻

51. Claude Implementation Rule

Claude must not begin implementing this architecture until it has reviewed:

REGULATORY_MATRIX_v1.md

FINALIST_PRODUCT_SPEC_v0.4.md

AI_AGENTS_ARCHITECTURE_v1.md

FIGMA_IMPLEMENTATION_RULES.md

Before coding, Claude must identify:

* current AI implementation
* reusable deterministic logic
* files that need modification
* new files required
* external AI dependency
* environment variables
* unresolved decisions
* implementation risks

Then wait for approval.

⸻

52. No-Assumption Rule

Claude must not choose or invent:

* regulatory facts
* official weights
* government integrations
* unsupported data sources
* hidden business rules

If a technical implementation choice does not change product truth, Claude may recommend an option.

If it affects product behavior or claims, it must be reviewed first.

⸻

53. Definition of Done

The AI architecture is considered implemented when:

* at least one real LLM powers the AI layer
* regulatory retrieval is source constrained
* evidence extraction returns structured data
* decision input supports natural language
* at least two scenarios can be compared
* assumptions are visible
* affected requirements are visible
* confidence is visible
* source lineage is visible
* research insight can appear in decision analysis
* research remains separate from regulation
* deterministic verification remains authoritative
* failures are handled safely
* guardrail tests pass

⸻

Document Status

Version: 1.0

Stage: Finalist AI Architecture

Product Reference:

FINALIST_PRODUCT_SPEC_v0.4.md

Regulatory Reference:

REGULATORY_MATRIX_v1.md

Visual Reference:

Approved Finalist Figma Design

Implementation Status:

Not authorized until all implementation documents are reviewed.