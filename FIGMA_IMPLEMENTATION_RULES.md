EMTITHAL — FIGMA IMPLEMENTATION RULES

1. Purpose

This document defines the visual implementation rules for the Finalist version of Emtithal.

The approved Figma redesign is the visual source of truth.

Claude must implement the approved design inside the existing Emtithal Next.js application while preserving the product logic defined in:

REGULATORY_MATRIX_v1.md
FINALIST_PRODUCT_SPEC_v0.4.md
AI_AGENTS_ARCHITECTURE_v1.md

⸻

2. Core Design Principle

The product must remain visually simple, calm, and focused.

Primary rule:

Show more. Explain less.

The interface should communicate primarily through:

* numbers
* status
* cards
* progress
* comparisons
* charts
* short labels
* source badges
* concise actions

Avoid:

* long paragraphs
* excessive explanatory text
* dense dashboards
* unnecessary feature descriptions
* repeating the same information
* adding elements only to make a page look fuller

Empty space is intentional.

Do not fill it with unnecessary content.

⸻

3. Figma Is the Visual Source of Truth

The approved Figma frames define:

* layout
* spacing
* typography
* visual hierarchy
* cards
* inputs
* buttons
* tables
* navigation
* colors
* borders
* radius
* icon treatment
* content density

Claude must follow the approved Figma design rather than redesigning screens based on personal preference.

⸻

4. Do Not Rebuild the Product from Scratch

The current Next.js application remains the implementation base.

The correct flow is:

Approved Figma
↓
Existing Next.js Application
↓
Reusable React Components

Do not:

* replace the application with exported Figma HTML
* rebuild working product logic unnecessarily
* replace working routes without a product reason
* remove deterministic engines that remain valid
* redesign screens that already have approved Figma frames

⸻

5. Figma MCP Usage

When implementing approved screens, Claude should inspect the relevant Figma frames through the connected Figma MCP server.

Claude should use the Figma frames as visual references and implement them as clean reusable React components.

Figma-generated code or exported HTML must not become the main application architecture.

⸻

6. Landing Page

The approved landing page is intentionally minimal.

Its visual simplicity must be preserved.

The main elements are:

* Emtithal logo
* language control
* main headline
* short supporting description
* login card
* government login button
* company login button
* minimal footer information

Do not add:

* feature cards
* AI Agent descriptions
* regulatory authority lists
* research sections
* dashboards
* statistics
* product walkthrough sections
* testimonials
* long marketing content
* additional CTAs

unless explicitly approved.

The landing page is not a product brochure.

⸻

7. Landing Page Message

The product message should remain focused on the core value:

امتثال يكشف مخاطر عدم الامتثال مبكرًا ويحاكي أثر القرارات قبل تنفيذها.

Supporting copy may explain briefly that Emtithal connects relevant government requirements with company data and evidence to identify gaps and analyze operational decisions.

Keep supporting copy short.

Do not introduce detailed architecture or regulatory explanations on the landing page.

⸻

8. Login Experience

The landing page contains only two primary entry points:

دخول الجهات الحكومية

دخول الشركات

Do not restore old role-specific login choices.

⸻

9. Company Authentication UI

The company has one visible user type in the Finalist MVP:

ممثل الشركة

Do not show separate login options such as:

* مسؤول امتثال
* مصدر قرار
* مسؤول تشغيل
* مدير أدلة

Internal permissions may exist later, but they must not complicate the current login experience.

⸻

10. Government Authentication UI

Use:

دخول الجهات الحكومية

Do not require the user to choose a job title on the landing page.

The system may associate the authenticated user with a specific government authority internally.

Do not add unnecessary role selection unless a later implementation requirement explicitly needs it.

⸻

11. Internal Screens

Internal screens should preserve the same visual language as the landing page:

* generous spacing
* restrained use of text
* clear hierarchy
* simple cards
* focused actions
* minimal visual noise

The system may contain complex regulatory logic.

The interface should not feel complex.

⸻

12. Dashboard Rule

Dashboards should answer the most important questions immediately.

For a company, prioritize:

* readiness
* critical risks
* top gaps
* pending verification
* relevant authorities
* recommended action
* decision simulation

Do not place every available metric on the dashboard.

Secondary information belongs in deeper screens.

⸻

13. Government Dashboard Rule

Government views should remain similarly concise.

Possible high-level information:

* companies
* relevant requirements
* risk signals
* verification status
* evidence status
* pending reviews

Do not turn the government dashboard into a dense control panel unless supported by the approved Figma.

⸻

14. Requirement Detail Screen

Requirement details should prioritize:

Status

Target

Actual

Gap

Authority

Source

Verification

Evidence

Last Updated

Confidence when AI is involved

Use cards, labels, badges, and compact sections.

Long source or explanation text should be expandable.

⸻

15. Decision Intelligence Screens

Decision simulation is a primary product experience.

It should visually emphasize:

* current state
* Scenario A
* Scenario B
* Scenario C when applicable
* affected requirements
* risk
* readiness impact
* confidence
* assumptions
* research insight
* recommended scenario

Scenario comparison must be visual and easy to scan.

Do not present scenario analysis as a long AI-generated essay.

⸻

16. AI Output UI

AI results should appear as structured product output.

Prefer:

* summary card
* risk indicator
* affected requirements
* confidence badge
* source
* assumptions
* recommended action

Avoid displaying raw model output.

Detailed reasoning should appear only through an expandable element such as:

لماذا تغيرت النتيجة؟

⸻

17. Research Knowledge UI

Research content should be visually distinct from regulatory content.

Use a clear label such as:

معرفة بحثية

or:

Research Insight

The user must be able to distinguish:

Regulatory Requirement

from:

Research Insight

Research content must never visually imply that it is a government obligation.

⸻

18. Source Visibility

Sources are important, but they should not overwhelm the interface.

Use compact source labels or badges.

Example:

وزارة الحج والعمرة
وزارة الصحة
الدفاع المدني
معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة

Detailed source information may open in a drawer, modal, or expandable section.

⸻

19. Status System

Status must be immediately understandable visually.

Supported compliance states:

COMPLIANT
PARTIALLY_COMPLIANT
NON_COMPLIANT
PENDING_VERIFICATION
INSUFFICIENT_DATA
NOT_APPLICABLE

The interface must clearly distinguish:

* verified compliance
* partial compliance
* non-compliance
* missing information
* pending verification

Missing information must not visually look like a confirmed violation.

⸻

20. Confidence UI

AI confidence states:

HIGH
MEDIUM
LOW

Confidence should be shown as a compact badge or indicator.

Do not make confidence appear to be an official compliance score.

⸻

21. Critical Risks

Critical issues must remain prominent even if overall readiness is high.

Example:

Readiness 92%

must not visually hide:

Critical Blocker

Critical blockers should receive stronger visual emphasis than ordinary informational gaps.

⸻

22. Progressive Disclosure

Use progressive disclosure for complexity.

Primary screen:

short and visual.

Secondary detail:

available when requested.

Preferred patterns:

* drawer
* modal
* accordion
* expandable details
* tooltip

Do not put every detail on the first screen.

⸻

23. Missing Figma Screens

Not every required product screen needs a dedicated Figma frame.

When a screen is missing, Claude may create it only by reusing the established design system.

Claude must reuse:

* typography
* spacing
* card style
* buttons
* inputs
* navigation
* tables
* badges
* border radius
* colors
* page width
* visual hierarchy

Do not introduce a new visual style.

⸻

24. Reusable Components

Implementation should favor reusable components.

Examples:

StatusBadge

SourceBadge

ConfidenceBadge

MetricCard

RequirementCard

AuthorityCard

ScenarioCard

RiskCard

EvidenceItem

ProgressIndicator

ActionCard

Use existing components where suitable before creating duplicates.

⸻

25. Navigation

Navigation should remain simple.

Do not add unnecessary navigation items simply because new backend capabilities exist.

A capability does not need its own menu item unless the user genuinely needs to access it independently.

Navigation should reflect the user journey, not the architecture.

⸻

26. Company Navigation

The company experience should focus on major tasks such as:

* overview
* compliance
* evidence
* decision intelligence
* research knowledge when appropriate

Exact navigation structure should follow the approved Figma and existing application patterns.

Do not expose technical architecture terms such as:

AI Orchestrator

Verification Engine

Regulatory Agent

as normal navigation labels.

⸻

27. Government Navigation

Government navigation should be based on user tasks.

Avoid exposing internal implementation terminology.

Possible concepts include:

* overview
* companies
* requirements
* reviews

Only include what the Finalist MVP actually needs.

⸻

28. Language

The product should support Arabic as the primary Finalist experience.

Arabic interfaces use RTL correctly.

English mode uses LTR correctly.

Do not simply reverse individual elements without considering the full layout.

⸻

29. Arabic Copy

Arabic UI copy should be:

* short
* natural
* professional
* understandable without technical knowledge

Avoid overly formal regulatory prose where a shorter label works.

Avoid translating technical implementation terminology directly into user-facing copy.

⸻

30. User-Facing Terminology

Prefer user concepts such as:

جاهزية

فجوة

متطلب

مصدر

بانتظار التحقق

قرار

سيناريو

مخاطر

إجراء مقترح

معرفة بحثية

Avoid showing internal terms such as:

targetSource

actualSource

deterministic engine

schema validation

orchestration

unless in a technical/admin context.

⸻

31. Visual Density

Do not overcrowd screens.

A page should have a clear primary purpose.

If a page starts requiring many paragraphs, reconsider the information architecture before adding more copy.

⸻

32. Tables

Use tables only where comparison or structured data genuinely benefits from them.

Do not use large tables for everything.

For high-level summaries, cards or visual indicators may be more appropriate.

⸻

33. Charts

Charts should only be used when they communicate something faster than text or a number.

Do not add decorative charts.

Charts must have a clear product purpose.

⸻

34. Responsive Behavior

The Finalist MVP should work correctly on standard desktop screens.

Responsive behavior should also avoid obvious layout breakage on smaller screens.

When adapting Figma layouts:

* preserve hierarchy
* avoid horizontal overflow
* keep buttons usable
* keep cards readable
* stack content logically when required

Do not redesign the desktop Figma unnecessarily in the name of responsiveness.

⸻

35. Loading States

Any asynchronous action should have a clear state.

Examples:

Analyzing

Uploading

Verifying

Loading

Do not leave an empty area with no feedback.

AI analysis specifically supports:

ANALYZING
COMPLETED
FAILED
NEEDS_REVIEW

⸻

36. Empty States

Empty states should be short and actionable.

Example:

لا توجد أدلة مرفوعة بعد

Action:

رفع دليل

Do not use long explanatory paragraphs.

⸻

37. Error States

Errors should tell the user:

* what happened
* whether their data is safe
* what they can do next

Example:

تعذر تحليل القرار الآن. بيانات الامتثال المحفوظة لم تتأثر.

Avoid exposing technical stack traces to the user.

⸻

38. Demo Data

Demo content should look realistic and coherent.

Do not use obvious placeholders such as:

Lorem ipsum

Company 1

Test Requirement

123456

Use realistic but clearly non-production demonstration data.

Demo data must not be presented as live government data.

⸻

39. Government Integrations UI

Do not show a government source as:

Connected

unless the integration actually exists.

If a connection is planned, use wording that does not imply a live API.

Examples:

غير متصل

بيانات مستوردة

بانتظار الربط

Do not fake integrations for visual effect.

⸻

40. Preserve Approved Screens

If a Figma screen is already approved:

Claude should implement it as closely as reasonably possible.

Do not improve, modernize, expand, or reinterpret it without explicit approval.

⸻

41. Existing Logic Preservation During UI Work

When implementing Figma UI, Claude must not casually modify:

* scoring logic
* compliance rules
* decision calculations
* data models
* regulatory data
* AI guardrails

unless the implementation phase explicitly requires those changes.

Visual implementation and business-logic changes should remain distinguishable.

⸻

42. One Screen at a Time

Figma implementation should be incremental.

Recommended flow:

1. inspect approved frame
2. identify existing route/components
3. implement one screen
4. compare with Figma
5. test functionality
6. continue to next screen

Do not redesign the entire application in one uncontrolled change.

⸻

43. No Unrelated Changes

Claude must not modify unrelated files while implementing a screen.

If an unrelated change appears necessary, it should be explained before implementation.

⸻

44. Figma Conflict Rule

If Figma conflicts with the approved Product Spec:

Do not silently choose one.

Report the conflict.

Product behavior is governed by:

FINALIST_PRODUCT_SPEC_v0.4.md

Regulatory truth is governed by:

REGULATORY_MATRIX_v1.md

AI behavior is governed by:

AI_AGENTS_ARCHITECTURE_v1.md

Figma governs visual presentation.

⸻

45. Product Truth vs Visual Mock Data

Text or numbers shown in a Figma mockup do not automatically become regulatory truth.

If a Figma frame includes:

* a score
* a weight
* a regulation
* an integration status
* a company number

that conflicts with approved product/regulatory documents, Claude must use the approved source of truth or mark the conflict.

⸻

46. Landing Page Protection Rule

The landing page must remain visually close to the approved Finalist Figma.

Claude must NOT automatically add:

* navigation menus
* feature sections
* animated AI demos
* authority logos
* large statistics
* research cards
* pricing
* product tours

The intentional simplicity is part of the approved design.

⸻

47. Final Visual Review

Before considering a screen complete, verify:

* matches Figma hierarchy
* correct Arabic RTL
* correct spacing
* correct typography
* no unnecessary text
* no accidental extra components
* working interactions
* working navigation
* no broken responsive layout
* no changed business behavior

⸻

48. Implementation Completion Rule

Figma implementation is complete when:

* approved frames are represented in the application
* missing required screens use the same visual language
* landing page remains minimal
* company login uses the simplified company representative model
* government login remains simple
* dashboards remain concise
* AI results are structured visually
* research is visually separated from regulation
* sources and confidence are visible where relevant
* no unsupported integrations are presented as live
* existing product behavior remains functional
* production build passes

⸻

Document Status

Version: 1.0

Stage: Finalist UI Implementation Rules

Visual Source of Truth:

Approved Finalist Figma Design

Product Reference:

FINALIST_PRODUCT_SPEC_v0.4.md

Regulatory Reference:

REGULATORY_MATRIX_v1.md

AI Reference:

AI_AGENTS_ARCHITECTURE_v1.md

Implementation Status:

Not authorized until all Finalist implementation documents are reviewed.