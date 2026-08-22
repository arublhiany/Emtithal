# EMTITHAL — MVP REQUIREMENTS

Version: 0.1
Status: Hackathon MVP
Source of Truth: EMTITHAL_MASTER_SPEC.md

---

## Purpose

This file defines the five regulatory criteria used in the Emtithal hackathon MVP.

These criteria are used to demonstrate:

- Evidence ingestion
- AI-assisted evidence analysis
- Compliance evaluation
- Gap detection
- Risk analysis
- Evidence traceability
- Improvement recommendations
- Decision intelligence
- Ministry monitoring

The MVP must never invent official regulatory requirements, weights, or scoring rules.

Where an official numerical weight is not available in the provided regulatory source, the system must clearly mark the scoring configuration as:

DEMO CONFIGURATION — NOT AN OFFICIAL MINISTRY WEIGHT.

---

# MVP Criteria

## CR-001 — صناعة تجربة ضيف الرحمن

Arabic Name:
صناعة تجربة ضيف الرحمن

Purpose:
Evaluate whether the company has implemented and documented activities or initiatives designed to improve the pilgrim experience.

Expected Evidence:

- Initiative documentation
- Execution reports
- Photos or supporting files
- Beneficiary information
- Measurement indicators
- Final evaluation-ready documentation

Assessment Type:
Hybrid — Evidence + AI-assisted document analysis + structured rules

AI Role:

- Identify relevant evidence in uploaded documents.
- Extract initiative information.
- Identify measurement indicators.
- Explain missing evidence.
- Produce evidence trace references.

Compliance Engine Role:

- Calculate the configured score based on verified evidence fields.

---

## CR-002 — تبني المفاهيم الحديثة والترسيخ المعرفي

Arabic Name:
تبني المفاهيم الحديثة والترسيخ المعرفي

Purpose:
Evaluate evidence demonstrating adoption, implementation, and documentation of modern concepts and knowledge reinforcement within company operations.

Expected Evidence:

- Programs or initiatives
- Training or awareness activities
- Implementation documentation
- Supporting reports
- Measurement indicators
- Evidence of knowledge reinforcement

Assessment Type:
Hybrid

AI Role:

- Analyze uploaded documents.
- Detect relevant activities.
- Extract supporting evidence.
- Identify missing components.
- Explain the evaluation.

Compliance Engine Role:

- Apply deterministic scoring rules to extracted and verified evidence.

---

## CR-003 — ضمان حفظ حقوق ضيف الرحمن

Arabic Name:
ضمان حفظ حقوق ضيف الرحمن

Purpose:
Evaluate whether the company has implemented and documented mechanisms and activities supporting the protection and awareness of pilgrim rights.

Expected Evidence:

- Rights-awareness activities
- Supporting materials
- Execution records
- Beneficiary or activity counts where available
- Reports
- Measurement indicators

Assessment Type:
Hybrid

AI Role:

- Identify evidence related to pilgrim rights.
- Extract activities and indicators.
- Match evidence to the criterion.
- Identify missing evidence.
- Provide evidence traceability.

Compliance Engine Role:

- Evaluate configured measurable requirements.

---

## CR-004 — التعايش مع رحلة ضيف الرحمن ورصد التجربة

Arabic Name:
التعايش مع رحلة ضيف الرحمن ورصد التجربة

Purpose:
Evaluate whether the company actively observes, documents, and analyzes the pilgrim journey and experience.

Expected Evidence:

- Field observations
- Journey monitoring
- Experience reports
- Identified issues
- Improvement actions
- Measurement indicators
- Supporting documentation

Assessment Type:
Hybrid

AI Role:

- Analyze experience and journey documentation.
- Extract observations.
- Identify recurring issues.
- Connect findings to improvement actions.
- Explain gaps.

Compliance Engine Role:

- Evaluate structured evidence completeness and configured indicators.

---

## CR-005 — توثيق فعاليات ومبادرات فريق السعادة

Arabic Name:
توثيق فعاليات ومبادرات فريق السعادة

Purpose:
Evaluate the implementation, measurement, and documentation of Happiness Team activities and initiatives.

Expected Evidence:

- Happiness Team field rounds
- Interventions
- Cases or observations
- Beneficiary numbers
- Response or handling information where available
- Satisfaction or impact measurement
- Initiative documentation
- Supporting reports and evidence

Assessment Type:
Hybrid — Structured indicators + AI-assisted evidence analysis

Example Demo Evidence:

- Happiness rounds: 270
- Beneficiaries: 4,500
- Cases / observations: 120

These values are demo evidence derived from the provided project documentation and must remain traceable to their source.

AI Role:

- Detect Happiness Team activities.
- Extract rounds, beneficiaries, cases, and interventions.
- Analyze supporting narrative evidence.
- Identify missing documentation.
- Explain the result.

Compliance Engine Role:

- Validate structured values.
- Calculate configured scoring.
- Determine compliance status using predefined rules.

---

# Evidence Evaluation Model

Each criterion may contain the following evidence dimensions:

1. Execution
2. Documentation
3. Measurement
4. Supporting Evidence
5. Completeness

The system must distinguish between:

- Evidence Found
- Evidence Missing
- Evidence Unclear
- Pending Verification

---

# MVP Demo Scoring

Because official weights must not be invented, the hackathon prototype may use a configurable demo scoring model.

Example:

Each criterion = 20 demo points.

Total:

5 criteria × 20 = 100

IMPORTANT:

This is a DEMO CONFIGURATION.

It must NOT be presented as an official Ministry of Hajj and Umrah weighting model.

The architecture must allow authorized Ministry users to replace demo weights with official weights.

---

# Compliance Status

Possible statuses:

- Compliant
- Partially Compliant
- Non-Compliant
- Pending Verification
- Not Assessed

---

# Evidence Traceability Requirement

Every AI-assisted conclusion must preserve:

- Criterion ID
- Source file
- Extracted evidence
- Page / sheet reference where possible
- AI interpretation
- Confidence
- Deterministic evaluation result
- Verification status

---

# AI Confidence

Allowed MVP confidence values:

- High
- Medium
- Low

The AI must explain why confidence is reduced.

---

# Critical Rule

AI does not directly invent the numerical compliance score.

AI extracts, interprets, explains, and recommends.

The Compliance Engine calculates the score using configured rules.

---

# Ministry Control

Authorized Ministry users must be able to:

- View these criteria.
- Activate / deactivate a criterion.
- Modify configured assessment rules.
- Modify weights.
- Update requirements.
- Preserve previous versions.
- Review company results.

Any demo configuration must be visually distinguishable from official regulatory configuration.

---

# MVP Decision Intelligence Connection

The five criteria must also be available to the Decision Intelligence Engine.

When a company proposes an operational decision, Emtithal must:

1. Read current company state.
2. Identify potentially affected criteria.
3. Read available evidence.
4. Analyze company capabilities.
5. Identify potential compliance impact.
6. Identify risks.
7. Generate feasible alternatives.
8. Compare alternatives.
9. Recommend the best feasible compliant option.
10. Explain the recommendation and confidence.

---

# Development Constraint

For the hackathon MVP:

- Use only these five criteria.
- Do not expand scope.
- Do not invent additional Ministry requirements.
- Do not invent official weights.
- Prioritize a complete working demo.
