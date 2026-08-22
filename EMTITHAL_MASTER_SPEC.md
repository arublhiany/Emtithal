EMTITHAL — MASTER PRODUCT SPECIFICATION
Version: 0.3
Status: Product Definition — Pre-Development
Project: Emtithal | امتثال


⸻


1. Product Vision
Emtithal (امتثال) is an AI-powered compliance and decision-intelligence platform designed for Hajj service companies and the Ministry of Hajj and Umrah.
The platform connects:
Official regulatory requirements and standards.
Company operational data.
Company capabilities and available resources.
Supporting evidence and documents.
Current compliance status.
Operational decisions under consideration.
to provide continuous compliance measurement, gap and risk detection, AI-assisted evidence analysis, personalized improvement planning, and intelligent analysis of the expected consequences of operational decisions before implementation.
Emtithal enables:
Hajj service companies to:
Understand and monitor their compliance requirements.
Measure their compliance numerically.
Identify gaps before regulatory inspections.
Upload supporting evidence.
Understand risks and priorities.
Receive improvement recommendations tailored to their actual capabilities.
Analyze proposed operational decisions before implementation.
Compare alternative solutions and identify the most suitable option.
The Ministry to:
Monitor companies and their compliance levels.
View risk indicators and recurring gaps.
Manage and govern regulatory standards.
Create, approve, update, deactivate, and version standards.
Define assessment methods and official weights.
Monitor evidence and corrective actions.
Prioritize regulatory attention based on risk and readiness.
The core objective is to shift compliance management from:
Reactive compliance after problems occur
to:
Continuous, proactive, predictive, data-driven compliance management.


⸻


2. Core Product Positioning
Emtithal is NOT:
A chatbot that answers questions about Ministry requirements.
Emtithal IS:
An AI-powered compliance and decision-intelligence platform that connects regulations with the real capabilities and operational conditions of each Hajj company to measure compliance, understand risk, forecast decision impact, compare alternatives, and recommend the most suitable course of action.


⸻


3. Problem Statement
Hajj service companies operate within a highly regulated and operationally complex environment.
Companies must simultaneously manage:
Regulatory requirements.
Workforce.
Transportation.
Accommodation.
Service locations.
Suppliers.
Operational capacity.
Supporting evidence.
Corrective actions.
Seasonal demand.
Thousands of operational decisions.
Current compliance processes may involve extensive manual monitoring and document review.
This creates several challenges:
Compliance gaps may be discovered late.
Large quantities of evidence must be manually reviewed.
Compliance officers spend significant time on repetitive follow-up.
Operational decisions may unintentionally affect compliance.
Different companies require different solutions because their capabilities differ.
Regulators need to monitor many companies simultaneously.
High-risk cases may require greater priority than low-risk cases.
Regulations and assessment standards may change over time.
Emtithal creates a structured digital intelligence layer between regulatory requirements and company operations.


⸻


4. Primary Stakeholders
4.1 Hajj Service Company
Company users may include:
Compliance Officer.
Operations Manager.
Executive / Company Manager.
Authorized company employee.
They use Emtithal to:
Review applicable standards.
Monitor compliance.
Upload evidence.
Complete assessments.
Identify gaps.
Understand risk.
Receive improvement recommendations.
Simulate operational decisions.
Compare alternatives.
Track corrective actions.
Raise disputes regarding inaccurate AI analysis.


⸻


4.2 Ministry / Regulatory User
Authorized Ministry users may:
Monitor companies.
Review compliance indicators.
Review high-risk cases.
View recurring gaps.
Monitor corrective actions.
Review evidence where appropriate.
Manage standards and requirements.
Approve regulatory standards.
Update standards.
deactivate or retire standards.
Define assessment rules.
Define official weights.
Define effective dates.
Determine evidence requirements.
Determine whether human verification is required.
The Ministry remains the authoritative regulatory body.


⸻


5. Core Innovation
The primary innovation is:
Compliance Decision Intelligence
Emtithal does not only detect whether a company currently complies.
It uses AI to understand:
Current compliance.
Company operational capabilities.
Available resources.
Existing gaps.
Relevant requirements.
Operational context.
Proposed decisions.
and then determines the potential consequences of a decision before it is implemented.


⸻


6. Example of Decision Intelligence
A company proposes:
Reduce staffing at a service point by 20%.
Emtithal considers:
Current staffing.
Required staffing.
Number of pilgrims served.
Peak-period load.
Current compliance score.
Available alternative staff.
Related standards.
Available resources.
Existing operational gaps.
The system then produces:
Potential Effects
Requirements potentially affected.
Expected change in compliance.
New risks created.
Operational consequences.
Alternative Scenarios
Example:
Option A: Reduce staffing by 20%.
Option B: Transfer staff from another location.
Option C: Modify shift scheduling.
Option D: Use additional supplier resources.
Recommendation
Emtithal compares the scenarios according to:
Compliance impact.
Risk.
Operational feasibility.
Available resources.
Operational impact.
Cost, if reliable cost data is available.
Then recommends the most appropriate feasible option.


⸻


7. Company Capability Intelligence
Every company should have a dynamic capability profile.
This profile helps Emtithal understand what solutions are realistic for that specific company.


⸻


7.1 Core MVP Capability Data
The MVP should prioritize data that is realistically available:
Number of pilgrims served.
Workforce size.
Number of supervisors.
Core operational resources.
Transportation capacity where relevant.
Service locations.
Service capacity.
Current requirements.
Current compliance results.
Available evidence.
Current gaps.
Current risks.


⸻


7.2 Optional / Future Capability Data
Where available:
Operational budget.
Supplier capacity.
Historical inspection results.
Previous-season data.
Cost structures.
Corrective-action history.
Resource utilization.
Historical incident patterns.
Lack of optional data must not prevent the MVP from functioning.


⸻


8. Capability Indicators
The system may generate indicators such as:
Operational Capacity      82/100
Resource Readiness        71/100
Compliance Readiness      86/100
Evidence Readiness        74/100
Risk Resilience           68/100
These scores MUST NOT be arbitrarily generated by an LLM.
They must be calculated using documented formulas and structured data.
AI may:
Explain scores.
Compare scores.
Identify weaknesses.
Recommend improvement.
AI may NOT freely invent the numerical values.


⸻


9. Regulatory Standards Management
The Ministry must have a dedicated:
Regulatory Control Center
Authorized regulatory users can manage standards through the platform.
Each standard or requirement may contain:
Unique ID.
Title.
Description.
Category.
Official source.
Source reference.
Official weight.
Severity.
Assessment method.
Evidence required.
Effective date.
Expiration date.
Verification method.
Critical requirement flag.
Current version.
Current regulatory status.


⸻


10. Standard Lifecycle
A regulatory standard may have statuses such as:
Draft
↓
Approved
↓
Active
↓
Updated / Superseded
↓
Inactive / Retired
Only authorized Ministry roles may approve official standards.


⸻


11. Regulatory Versioning
Updating a standard must NOT erase previous regulatory history.
Example:
Requirement R-204

Version 1
Effective:
01-01-1447 → 30-06-1447

Official Weight:
10%

Status:
Superseded
Requirement R-204

Version 2
Effective From:
01-07-1447

Official Weight:
15%

Status:
Active
Historical company assessments must remain connected to the version that was effective at the time of assessment.


⸻


12. Evidence Ingestion & Intelligence
Companies should be able to upload evidence directly into Emtithal.
Initial file formats may include:
PDF.
Excel.
CSV.
Word.
Images.
The MVP should prioritize reliable support for:
PDF + Excel
before expanding to additional formats.


⸻


13. Evidence Processing Pipeline
Company Uploads File
        ↓
File Processing
        ↓
Text / Structured Data Extraction
        ↓
Document Classification
        ↓
Relevant Requirement Identification
        ↓
Evidence Extraction
        ↓
Rule Engine / AI Analysis
        ↓
Compliance Evaluation
        ↓
Evidence Trace


⸻


14. Structured Evidence Example
Requirement:
Minimum required supervisors = 30.
Uploaded file:
staff.xlsx
System extracts:
Available Supervisors = 26
Required Supervisors = 30
Rule:
26 >= 30 → False
Result:
Non-Compliant

Gap:
4 supervisors
The numerical conclusion is generated by the Compliance Engine, not by the AI language model.


⸻


15. Unstructured Evidence Example
Requirement:
An operational plan must contain:
Evacuation procedures.
Assembly points.
Emergency contacts.
Uploaded file:
EmergencyPlan.pdf
Evidence Intelligence identifies:
Evacuation Procedure
Found — Page 4

Assembly Points
Found — Page 6

Emergency Contacts
Not Found
The Compliance Engine then evaluates the requirement using its predefined assessment logic.


⸻


16. Evidence Traceability
Every important evidence-based conclusion should show its source.
Example:
Requirement:
R-102

Status:
Partially Compliant

Evidence:
EmergencyPlan.pdf

Found:
Evacuation Procedure — Page 4
Assembly Points — Page 6

Missing:
Emergency Contact Information
This improves explainability and allows human users to verify the result.


⸻


17. Compliance Engine
The Compliance Engine is responsible for numerical compliance evaluation.
It must remain logically separate from generative AI.
The engine may evaluate:
Boolean requirements.
Numerical thresholds.
Percentage requirements.
Weighted criteria.
Document-based criteria.
Critical mandatory requirements.


⸻


18. Numerical Compliance Score
Emtithal must display numerical compliance results.
Example:
Overall Compliance Readiness

87%
and category-level results such as:
Operations             92%
Transportation         78%
Evidence Readiness     91%
Guest Experience       84%


⸻


19. Weighted Compliance
Where official weights exist, the system uses those weights.
Example:
Criterion Weight:
20%

Company Achievement:
90%

Weighted Contribution:
18%
The weighting configuration must be controlled by the regulatory framework stored in Emtithal.


⸻


20. Assessment Methods
Different requirements may use different evaluation methods.
Possible methods:
Binary.
Percentage.
Weighted.
Threshold.
Document evidence.
Checklist.
Human verification.
Hybrid.
The system must NOT assume that all requirements use the same scoring method.


⸻


21. Critical Requirements
Some requirements may be classified as:
Critical Gates
A critical failure may:
Reduce the maximum possible readiness score.
Trigger a critical-risk warning.
Require immediate corrective action.
Require human verification.
A high overall numerical score must never hide an unresolved critical requirement.


⸻


22. Compliance Status
Possible statuses include:
Compliant.
Partially Compliant.
Non-Compliant.
Not Assessed.
Pending Verification.
Under Review.


⸻


23. Human-in-the-Loop Verification
Companies do NOT directly assign themselves higher compliance scores.
Typical lifecycle:
Non-Compliant
        ↓
Corrective Action
        ↓
New Evidence Uploaded
        ↓
Evidence Processed
        ↓
Automated / AI Analysis
        ↓
Pending Verification
        ↓
Human Verification if required
        ↓
Compliance Updated
Some objective requirements may be automatically verified.
Ambiguous, sensitive, or high-risk requirements may require human review.


⸻


24. Audit Trail
All significant compliance changes must be recorded.
The system should retain:
Previous value.
New value.
Requirement version.
Date and time.
User responsible.
Evidence submitted.
Automated evaluation.
AI analysis.
Human decision where applicable.
Reason for change.
Example:
10 Aug
Status:
Non-Compliant

Reason:
Required evidence missing
12 Aug
New evidence uploaded by company
12 Aug
AI Evidence Analysis:
Evidence appears sufficient
13 Aug
Authorized reviewer verified evidence
New Status:
Compliant


⸻


25. AI Responsibilities
Artificial intelligence may assist with:
Regulatory document understanding.
Requirement extraction.
Document classification.
Evidence understanding.
Data interpretation.
Gap explanation.
Risk analysis.
Improvement recommendations.
Company capability analysis.
Decision-impact forecasting.
Scenario generation.
Scenario comparison.
Recommendation generation.
Natural-language interaction.
Compliance summaries.


⸻


26. AI Decision Impact Forecasting
The MVP should NOT claim that the AI performs statistical prediction from historical data unless such data actually exists.
Instead, Emtithal performs:
AI-Assisted Impact Forecasting
based on:
Current company data.
Regulatory rules.
Operational context.
Company capability.
Proposed changes.
Defined assumptions.
Future versions may incorporate statistical predictive models where reliable historical data is available.


⸻


27. AI Confidence
AI-generated interpretations should communicate uncertainty.
For the MVP, confidence should preferably use:
High.
Medium.
Low.
rather than unsupported precision such as 86.4%.
Example:
Confidence:
High

Reason:
Current staffing data and supporting evidence are complete.
Example:
Confidence:
Low

Reason:
Current transportation-capacity data is missing.
Low-confidence results may trigger:
Warning.
Additional data request.
Human review.


⸻


28. AI Guardrails
Emtithal must follow these principles:
Never invent regulatory requirements.
Never fabricate official sources.
Regulatory conclusions must be connected to approved regulatory data.
Deterministic calculations remain separate from generative AI.
AI cannot arbitrarily override deterministic results.
AI recommendations must explain their reasoning.
AI uncertainty must be communicated.
Low-confidence results must be flagged.
Emtithal does not replace regulatory authority.
Emtithal does not guarantee inspection outcomes.
Numerical compliance must be reproducible.
Major changes must remain auditable.
Sensitive cases may require human review.


⸻


29. AI Feedback & Dispute System
Every significant AI-generated analysis should allow the user to report an inaccurate result.
UI example:
Is this AI analysis inaccurate?

Report Result


⸻


30. AI Issue Types
The user may report:
Incorrect document interpretation.
Incorrect requirement matching.
Incorrect extracted information.
Inappropriate recommendation.
Incorrect analysis.
Missing context.
Other.
The user may:
Write a description.
Attach supporting evidence.
Reference the disputed AI result.


⸻


31. Support Ticket Workflow
Reporting an AI answer creates a support / review ticket.
AI Result
        ↓
User Reports Issue
        ↓
Support Ticket Created
        ↓
Human Review
        ↓
Accepted / Rejected / More Information Required
        ↓
Correction if necessary
        ↓
Audit Trail Updated
A user disagreement must NOT automatically cause the AI to change its compliance conclusion.


⸻


32. AI Result Versioning
If an AI result is corrected, preserve both versions.
Example:
AI Analysis
Version 1
User Dispute:
Ticket #142
Reviewer Decision:
Incorrect interpretation
Corrected AI Analysis
Version 2
The reason for correction must remain visible in the audit history.


⸻


33. Customer Support
The platform should provide a clear path to:
Submit a support ticket.
Ask for human review.
Track ticket status.
Respond with additional information.
Receive the final resolution.
Possible statuses:
Open
Under Review
Waiting for User
Resolved
Closed


⸻


34. Gap Analysis
For every compliance gap, Emtithal should display:
Requirement affected.
Current state.
Required state.
Gap.
Severity.
Evidence status.
Reason.
Suggested corrective action.
Potential operational consequence.


⸻


35. Risk Intelligence
Risk analysis may consider:
Requirement severity.
Gap magnitude.
Criticality.
Operational impact.
Time sensitivity.
Evidence quality.
Recurrence.
Company capabilities.
Current operational load.
Risk levels:
Critical.
High.
Medium.
Low.
Risk methodology must remain documented and explainable.


⸻


36. Improvement Planning
For identified gaps, Emtithal may recommend:
Corrective action.
Priority.
Requirement affected.
Expected compliance improvement.
Required resources.
Suggested responsible role.
Operational considerations.
Alternative actions.
Recommendations must consider company capabilities.


⸻


37. Decision Intelligence Engine
Input:
Proposed Operational Decision
            +
Regulatory Requirements
            +
Company Compliance Status
            +
Company Capability Profile
            +
Available Resources
            +
Operational Context
Output:
Affected Requirements
Potential Compliance Impact
Operational Impact
Risk Level
Confidence
Mitigation Options
Alternative Scenarios
Recommended Option
Reasoning


⸻


38. Scenario Comparison
Example:
Option A
Reduce staff by 20%

Compliance Impact:
High

Operational Risk:
High
Option B
Move staff from lower-load location

Compliance Impact:
Low

Operational Risk:
Medium
Option C
Modify shifts

Compliance Impact:
Low

Operational Risk:
Low
The system should explain the trade-offs.


⸻


39. Recommended Decision
Emtithal recommends:
The Best Feasible Compliant Option
It must not simply select the lowest-risk theoretical solution.
The recommendation must consider:
Regulatory impact.
Risk.
Resource availability.
Operational feasibility.
Business constraints.
Cost when reliable data exists.


⸻


40. Company Dashboard
The Company Dashboard should display:
Overall Compliance Readiness %.
Compliance by category.
Requirements status.
Critical gaps.
Current risks.
Evidence readiness.
Pending verification.
Corrective actions.
Company capability indicators.
Priority recommendations.
Recent regulatory updates.


⸻


41. Ministry Regulatory Control Center
The Ministry view should display:
Company Monitoring
List of companies.
Compliance percentage.
High-risk companies.
Critical gaps.
Pending verification.
Corrective-action progress.
Last assessment date.
Regulatory Management
Create standards.
Approve standards.
Update standards.
Version standards.
Activate standards.
Deactivate standards.
Define weights.
Define evidence.
Define assessment rules.
Analytics
Recurring gaps.
Requirement failure trends.
Company-level comparison.
Risk distribution.
Compliance trends.


⸻


42. Ministry Role in Oversight
Emtithal helps the Ministry identify:
Which company needs attention?
        ↓
Which requirement is creating risk?
        ↓
What evidence supports the result?
        ↓
What corrective action is underway?
        ↓
Has company readiness improved?
The platform supports regulatory prioritization but does not independently issue official violations.


⸻


43. High-Level Architecture
                 MINISTRY
                    ↓
        Regulatory Control Center
                    ↓
       Standards + Rules + Weights
                    ↓
       Regulatory Knowledge Base
                    ↓
────────────────────────────────────
                    ↓
               EMTITHAL
                    ↓
────────────────────────────────────
        ↙                       ↘

Company Data                Company Evidence
     ↓                            ↓
Capability Engine        Evidence Intelligence
     ↓                            ↓
        ↘                       ↙
           Compliance Engine
          ↙                 ↘
     Rule Engine          AI Analysis
          ↓
       Gap Analysis
          ↓
      Risk Intelligence
          ↓
    Improvement Planning
          ↓
    Decision Intelligence
          ↓
     Scenario Comparison
          ↓
       Recommendation
        ↙             ↘
Company Dashboard    Ministry Dashboard


⸻


44. Initial Core Data Entities
Company
id
name
services
profile
operational_data
User
id
organization
role
permissions
Requirement
id
title
description
source
source_reference
category
official_weight
severity
assessment_method
evidence_requirement
effective_date
expiry_date
version
status
CompanyCapability
company_id
capability_type
value
capacity
date
Assessment
company_id
requirement_id
requirement_version
score
weighted_score
status
verification_status
date
Evidence
id
company_id
requirement_id
file
type
extracted_data
analysis
validation_status
Gap
company_id
requirement_id
description
severity
Risk
company_id
requirement_id
impact
probability
level
ImprovementAction
company_id
gap_id
action
priority
expected_impact
status
Simulation
company_id
proposed_decision
affected_requirements
expected_impact
Scenario
simulation_id
description
compliance_impact
risk
feasibility
resources
AIResult
id
type
output
confidence
version
SupportTicket
id
user_id
ai_result_id
issue_type
description
status
resolution
AuditEvent
id
entity
previous_value
new_value
user
timestamp
reason


⸻


45. Company User Journey
Company Login
       ↓
Compliance Dashboard
       ↓
Review Requirements
       ↓
Upload Evidence / Data
       ↓
Evidence Processing
       ↓
Compliance Evaluation
       ↓
Numeric Compliance Updated
       ↓
Gap Detection
       ↓
Risk Prioritization
       ↓
Improvement Recommendations
       ↓
Corrective Action
       ↓
Evidence Re-Submission
       ↓
Verification
       ↓
Updated Compliance


⸻


46. Decision Intelligence Journey
Operational Decision
       ↓
Enter Decision Into Emtithal
       ↓
Read Company Current State
       ↓
Identify Relevant Requirements
       ↓
Analyze Company Capabilities
       ↓
Forecast Decision Impact
       ↓
Generate / Compare Alternatives
       ↓
Recommend Best Feasible Option
       ↓
Explain Risk + Reasoning


⸻


47. Ministry Journey
Ministry Login
       ↓
Company Monitoring Dashboard
       ↓
Identify High-Risk Companies
       ↓
Review Compliance and Evidence
       ↓
Monitor Corrective Actions
Regulatory workflow:
Create / Update Standard
       ↓
Configure Assessment Rule
       ↓
Set Official Weight
       ↓
Define Evidence Requirements
       ↓
Approve
       ↓
Activate
       ↓
Automatically Apply Correct Version


⸻


48. Focused Hackathon MVP
The MVP should NOT attempt to implement the entire long-term platform.
The demo should focus on one convincing end-to-end journey.
Recommended MVP:
Company
↓
Uploads PDF + Excel
↓
Emtithal Extracts Evidence
↓
Evaluates 5–10 Requirements
↓
Calculates Numerical Compliance
↓
Detects One or More Gaps
↓
Shows Risk + Evidence Trace
↓
Generates Improvement Recommendation
↓
Company Tests Operational Decision
↓
Emtithal Compares 2–3 Alternatives
↓
Recommends Best Option
↓
Ministry Dashboard Shows Company Result
Ministry MVP additionally demonstrates:
Viewing company compliance.
Viewing risk.
Editing or activating one regulatory standard.
AI dispute MVP demonstrates:
Reporting one AI analysis.
Creating a review ticket.


⸻


49. Demo Scenario
Use a fictional Hajj service company.
Example:
Al-Noor Hajj Services
Demo data:
Requirements Evaluated:
10

Compliance Readiness:
78%

Critical Gap:
1

High Risks:
2
Company uploads:
One Excel workforce file.
One PDF operational plan.
Emtithal:
Extracts data.
Matches evidence to requirements.
Calculates compliance.
Identifies a gap.
Shows the evidence source.
Suggests corrective action.
Then the company proposes:
Reduce staffing at a high-demand service point.
Emtithal:
Identifies affected requirements.
Shows likely compliance impact.
Generates alternatives.
Compares alternatives.
Recommends the best feasible option.
The Ministry then sees the updated company status.


⸻


50. Success Metrics
Potential measures:
Compliance Readiness %.
Percentage of assessed requirements.
Number of identified high-risk gaps.
Time required to identify a gap.
Reduction in manual evidence review.
Corrective-action closure rate.
Evidence verification turnaround time.
Reduction in unresolved high-risk requirements.
Percentage of AI analyses traceable to source evidence.
Number of AI disputes requiring correction.


⸻


51. Alignment With Judging Criteria
Innovation & Originality
Primary innovation:
AI decision intelligence.
Personalized company capability analysis.
Decision-impact forecasting.
Scenario comparison.
Evidence intelligence.
Regulatory versioning.
Risk-based regulatory monitoring.


⸻


Feasibility & Impact
Emtithal directly addresses:
Manual compliance monitoring.
Late gap detection.
Evidence-review burden.
Operational decision risk.
Regulatory monitoring at scale.


⸻


Practical Implementation & Readiness
The MVP must demonstrate a working end-to-end flow rather than static screens.


⸻


Business Model & Sustainability
Potential deployment:
B2B SaaS for Hajj service companies.
B2G regulatory platform.
Enterprise compliance solution.
Future configurable compliance engine for related regulated sectors.


⸻


Team Integration & Presentation
The final project should clearly demonstrate integration between:
Regulatory expertise.
AI.
Software engineering.
Product design.
Data.
Operational knowledge.


⸻


52. Out of Scope — Hackathon MVP
The MVP does NOT require:
Every Ministry requirement.
Integration with Ministry production databases.
Automatic official violations.
Fully autonomous regulatory decisions.
Advanced billing.
Mobile application.
Production-scale infrastructure.
Complex predictive machine-learning models requiring unavailable historical datasets.


⸻


53. Development Rules for AI Coding Agents
Claude Code, Codex, and all coding agents MUST:
Read this file first.
Treat this document as the product source of truth.
Never invent Ministry requirements.
Never fabricate regulatory sources.
Keep deterministic calculations separate from generative AI.
Preserve numerical compliance reproducibility.
Preserve evidence traceability.
Preserve regulatory version history.
Preserve human verification where required.
Preserve AI dispute functionality.
Preserve audit history.
Avoid unnecessary feature expansion.
Prioritize the hackathon MVP.
Build modular and maintainable code.
Add tests for compliance calculations.
Explicitly flag assumptions.
Do not change the product vision without approval.
Optimize implementation toward judging criteria.


⸻


54. Definition of Done — Hackathon MVP
The MVP is ready when:
A company can access a dashboard.
Numerical compliance is displayed.
5–10 structured requirements exist.
At least one requirement has an official/configurable weight.
A PDF can be uploaded and analyzed.
An Excel file can be uploaded and analyzed.
Relevant evidence can be extracted.
At least one deterministic rule works.
Compliance calculation is reproducible.
A gap can be detected.
A risk can be displayed.
Evidence trace can be viewed.
An improvement recommendation can be generated.
A user can enter an operational decision.
Relevant requirements can be identified.
At least two alternative scenarios can be compared.
A recommended option can be shown.
AI reasoning is displayed.
AI uncertainty is communicated.
An AI result can be reported.
A support ticket can be created.
A Ministry user can view company compliance.
A Ministry user can manage at least one standard.
Audit history is recorded.
The complete flow works without developers manually modifying data during the presentation.


⸻


55. Open Questions Before Development
The team must still finalize:
Which official Ministry requirements will be used for the demo?
Which 5–10 requirements provide the strongest demonstration?
What official scoring rules apply to them?
Which requirements are deterministic?
Which requirements need AI document analysis?
Which requirements require human verification?
What company capability data will be included?
What operational decision will be used in the demo?
What exact risk formula will be used?
What technology stack will be used?
Which AI provider/model will power the prototype?
What information should company users see?
What information should Ministry users see?
Which Ministry roles can modify and approve standards?


⸻


56. Immediate Next Steps
Before full coding:
Select the official regulatory source documents.
Extract 5–10 requirements for the MVP.
Record their weights and assessment methods.
Define evidence requirements.
Define deterministic rules.
Define AI-assisted requirements.
Define human-review requirements.
Define company capability inputs.
Define one strong decision-intelligence scenario.
Finalize the architecture and technology stack.
Then begin implementation.
