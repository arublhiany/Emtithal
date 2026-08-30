# EMTITHAL — REGULATORY MATRIX v1

## 1. Purpose

This file defines the regulatory truth used by Emtithal.

Emtithal must never infer, invent, or fabricate:
- regulations
- official weights
- penalties
- applicability
- official APIs
- verification rules

If a regulatory fact is unclear or not officially verified, it must remain unresolved.

---

## 2. Core Regulatory Model

Each requirement follows this hierarchy:

Authority
→ Domain
→ Track / Program
→ Requirement
→ Verification Profile

Each requirement must define:

- id
- authority
- domain
- track
- title
- applicabilityRule
- targetSource
- actualSource
- verificationRule
- acceptedEvidence
- officialWeight
- internalCriticality
- season
- version
- effectiveDate
- officialSource
- lastVerifiedAt

---

## 3. Verification Statuses

Allowed statuses only:

- COMPLIANT
- PARTIALLY_COMPLIANT
- NON_COMPLIANT
- PENDING_VERIFICATION
- INSUFFICIENT_DATA
- NOT_APPLICABLE

Important rules:

Missing data ≠ Non-compliance.

Uploaded evidence ≠ Compliance.

Manual declaration ≠ Verified fact.

---

## 3A. Official Sources and Verified Locators

Verified issuing-authority sources for the Finalist implementation. These are
the official documents — distinct from this matrix file, which is the
implementation source of truth, not the issuing authority.

### A) HAJ-EXP-01 … HAJ-EXP-05

Official source:
وزارة الحج والعمرة — "محددات البرنامج وأعمال مسار صناعة التجربة وتعزيز الثقة لموسم الحج 1447 هـ"

Verified locator: pages 7–8 (3% track weight, 20% criterion weights, the
criteria, and measurement / supporting-document details).

### B) HAJ-NUSUK-01

Official source:
Official Nusuk Card FAQ — https://nusukcard.haj.gov.sa/ar-SA/faq

### C) HAJ-CATERING-01, HAJ-CAMP-01, HAJ-PROVIDERS-01

Official source:
وزارة الحج والعمرة — "دليل التعليمات والإجراءات المنظمة لأداء شركات تقديم الخدمة لحجاج الخارج لموسم حج عام 1447هـ"

Document page:
https://haj.gov.sa/sitecore/content/HAJJ/Main/Home/Media-Center/Document-Library/Guide-to-Instructions-and-Procedures-Regulating-Performance-of-Service-Companies-Season-1447-AH/

Official PDF:
https://haj.gov.sa/s-core/-/media/Project/HAJJ/PDF-and-FILES/Document-Library/Guide-to-Instructions-and-Procedures-Regulating-Performance-of-Service-Companies-Season-1447-AH/AR-Guide-to-Instructions-and-Procedures-Regulating-Performance-of-Service-Companies-Season-1447-AH.pdf

Verified locator: not yet established in our approved documents — retained as an
unresolved locator note. The verified official document remains the official
source.

### D) CIV-01 … CIV-05

Official source:
الدفاع المدني — "تعليمات السلامة في الحج" —
https://998.gov.sa/Ar/Page/SafetyInstInHajj/web/Safety/HajjSafetyInstruction/

Supplementary current-season official source:
https://998.gov.sa/ar/Page/News/2741/

These safety instructions explicitly cover fire equipment, trained workers,
emergency exits, unapproved electrical connections, and cooking restrictions.

### E) MOH-01

Official source:
وزارة الصحة — Health Regulations —
https://www.moh.gov.sa/CCC/healthp/regulations/Documents/HealthRegulations1.pdf

Supported rule: the meningococcal vaccination requirement applies to Hajj/Umrah
workers whose work requires direct contact with pilgrims / Umrah performers —
NOT all company workers.

Season continuity: UNRESOLVED. This source is not itself a 1447-specific
company-worker notice. MOH-01 is not treated as fully season-verified regulatory
truth until current-season continuity is verified.

### Target Source for qualitative / field requirements

A Target Source need not be a numeric regulator-published target.

- **CIV-01 … CIV-05** — Target Source: the company operational profile → all
  applicable camps/sites under the company's responsibility. Verification
  target: each applicable site must satisfy the relevant official safety
  condition. Actual Source: field inspection / verified checklist / official
  inspection result. These are therefore NOT UNRESOLVED_REQUIREMENT for lack of
  a numeric target.
- **HAJ-PROVIDERS-01** — Target Source: the company operational profile → all
  contracted service providers to whom the company's official supervision /
  verification responsibility applies. Where the exact company responsibility for
  a provider is unclear, that provider-level assessment stays PENDING /
  INSUFFICIENT rather than assumed. HAJ-PROVIDERS-01 remains
  UNRESOLVED_REQUIREMENT only for the unresolved company-vs-provider
  responsibility mapping — not for a missing Target Source.

---

# 4. Ministry of Hajj and Umrah

## 4.1 Quality of Service Performance

### Track: صناعة التجربة وتعزيز الثقة

Official track weight:

3%

Each criterion below has an official weight of:

20% within the track.

---

### HAJ-EXP-01

**Authority:** وزارة الحج والعمرة  
**Domain:** جودة أداء الخدمات  
**Track:** صناعة التجربة وتعزيز الثقة  
**Requirement:** صناعة تجربة ضيف الرحمن

**Official Weight:** 20% within track

**Verification Areas:**
- تعيين قائد لمسار صناعة التجربة
- إعداد رحلة موحدة لضيف الرحمن
- مشاركة خريطة رحلة بحسب الخدمات والباقات
- وجود الهيكل التنظيمي للشركة
- وجود استراتيجية تجربة المستفيد
- المستندات والمخرجات الداعمة المطلوبة رسميًا

**Target Source:** Official criterion structure

**Actual Source:**
- company evidence
- verified documents
- operational records where applicable

**Verification Rule:**
Evaluate required official components individually.

Do not infer completion from the existence of one general document.

**Accepted Evidence:**
- الهيكل التنظيمي
- استراتيجية تجربة المستفيد
- ملف رحلة ضيف الرحمن
- supporting official evidence

**Season:** 1447H

---

### HAJ-EXP-02

**Authority:** وزارة الحج والعمرة  
**Domain:** جودة أداء الخدمات  
**Track:** صناعة التجربة وتعزيز الثقة  
**Requirement:** تبني المفاهيم الحديثة والترسيخ المعرفي

**Official Weight:** 20% within track

**Verification Areas:**
- المشاركة في الورش المطلوبة
- نشر المفاهيم والثقافة المعرفية
- الاستبانات
- دراسة أو تقرير عن السلوكيات والثقافات
- التقارير الداعمة المطلوبة

**Target Source:** Official criterion structure

**Actual Source:**
- workshop records
- reports
- questionnaires
- verified supporting documents

**Verification Rule:**
Verify each required component separately.

**Season:** 1447H

---

### HAJ-EXP-03

**Authority:** وزارة الحج والعمرة  
**Domain:** جودة أداء الخدمات  
**Track:** صناعة التجربة وتعزيز الثقة  
**Requirement:** ضمان حفظ حقوق ضيف الرحمن

**Official Weight:** 20% within track

**Verification Areas:**
- وجود وحدة أو إدارة معنية بحقوق ضيوف الرحمن
- دليل الحقوق والواجبات
- التوعية بالحقوق والواجبات
- توثيق أعمال التوعية

**Target Source:** Official criterion structure

**Actual Source:**
- company structure
- rights guide
- awareness evidence
- verified documents

**Verification Rule:**
All required official components must be verified independently.

**Season:** 1447H

---

### HAJ-EXP-04

**Authority:** وزارة الحج والعمرة  
**Domain:** جودة أداء الخدمات  
**Track:** صناعة التجربة وتعزيز الثقة  
**Requirement:** التعايش مع رحلة ضيف الرحمن ورصد التجربة

**Official Weight:** 20% within track

**Verification Areas:**
- قنوات التواصل والاستجابة
- الاستبانات المرتبطة بالرحلة
- التحديات المرصودة
- التحديات التي تمت معالجتها
- خطة التحسين
- أدوات ومنهجيات التحسين
- قياس الأثر
- التقارير الإحصائية الداعمة

**Target Source:** Official criterion structure

**Actual Source:**
- questionnaires
- challenge logs
- improvement plans
- impact reports
- verified evidence

**Verification Rule:**
Verify required elements separately and identify missing components.

**Season:** 1447H

---

### HAJ-EXP-05

**Authority:** وزارة الحج والعمرة  
**Domain:** جودة أداء الخدمات  
**Track:** صناعة التجربة وتعزيز الثقة  
**Requirement:** توثيق فعاليات ومبادرات فريق السعادة

**Official Weight:** 20% within track

**Canonical Name:** توثيق فعاليات ومبادرات فريق السعادة

**Important:**
Do not rename this criterion to "برنامج قياس التجربة وإدارة العواطف".

That phrase may be stored only as a supporting source alias where required for traceability.

**Verification Areas:**
- فعاليات ومبادرات فريق السعادة
- توثيق المبادرات
- التفاعل والأثر
- الالتزام بالهوية أو المحددات المطلوبة
- الاستبانات
- التقرير النهائي
- الصور أو التوثيق الإعلامي عند طلبه رسميًا

**Target Source:** Official criterion structure

**Actual Source:**
- initiative reports
- questionnaires
- final report
- visual documentation
- verified evidence

**Verification Rule:**
Verify official required components individually.

**Season:** 1447H

---

# 5. Ministry of Hajj and Umrah — Operational Compliance

These requirements are separate from the Experience Track.

Official weights must remain null unless specifically verified.

---

## HAJ-NUSUK-01

**Requirement:** إدارة واستيفاء متطلبات بطاقة نُسك

**Authority:** وزارة الحج والعمرة

**Domain:** الجاهزية التشغيلية

**Applicability:**
Applicable to the relevant pilgrims, workers, or operators according to official Nusuk rules.

**Target Source:**
Approved or official roster of people to whom the requirement applies.

**Actual Source:**
- official Nusuk data if available
- official imported report
- verified company operational data

**Measurement Example:**

required = applicable persons

actual = issued / received / distributed according to the stage being measured

gap = required - actual

**Verification Rule:**
The system must never invent the required population.

Each number must include:
- source
- last updated date
- verification status

**Official Weight:** null

**Season:** 1447H

---

## HAJ-CATERING-01

**Requirement:** جاهزية وتغطية خدمات الإعاشة

**Authority:** وزارة الحج والعمرة

**Domain:** الجاهزية التشغيلية

**Applicability:**
Applicable when the company is responsible for providing or ensuring the required catering service.

**Target Source:**
Number of pilgrims/services covered by the official obligation and company operational profile.

**Actual Source:**
- valid provider contract
- provider data
- operational evidence
- field follow-up evidence
- official inspection result where available

**Verification Rule:**
Contract existence alone does not prove operational compliance.

Coverage and actual readiness must be evaluated separately.

**Official Weight:** null

**Season:** 1447H

---

## HAJ-CAMP-01

**Requirement:** جاهزية المخيمات والمواقع

**Authority:** وزارة الحج والعمرة

**Domain:** الجاهزية التشغيلية

**Applicability Rule:**

company_responsible_for_camp == true

**Target Source:**
All camps/sites under the company's responsibility.

**Actual Source:**
- field inspection
- verified checklist
- operational evidence
- official inspection result where available

**Verification Rule:**
Each site is verified independently.

Example:

7 required sites  
6 verified  
1 pending verification

**Official Weight:** null

**Season:** 1447H

---

## HAJ-PROVIDERS-01

**Requirement:** متابعة مقدمي خدمات النقل والإعاشة

**Authority:** وزارة الحج والعمرة

**Domain:** إدارة مقدمي الخدمات

**Applicability:**
Applicable when the company contracts with external service providers.

**Responsible Party Model:**
- COMPANY
- SERVICE_PROVIDER
- SHARED

**Verification Rule:**
Emtithal must identify what responsibility belongs directly to the Hajj company.

A provider violation must not automatically be recorded as a company violation unless an official source establishes company responsibility.

**Actual Source:**
- provider contracts
- verification records
- operational follow-up
- official inspection evidence

**Official Weight:** null

**Season:** 1447H

---

# 6. Ministry of Health

Only directly verified Hajj-related requirements may be included.

---

## MOH-01

**Requirement:** استيفاء متطلبات التحصين للعاملين المشاركين في الحج

**Authority:** وزارة الصحة

**Domain:** صحة العاملين

**Applicability:**
Only the workers to whom the current official Hajj health requirement applies.

**Target Source:**
Applicable worker roster.

**Actual Source:**
- official vaccination record
- approved vaccination evidence
- official integration if available in the future

**Verification Rule:**
Compare applicable workers against valid verified vaccination status.

Possible result example:

320 required  
306 verified  
9 non-compliant  
5 pending verification

**Official Weight:** null

**Important:**
Do not add vaccines as mandatory requirements unless supported by the current official source.

**Season:** 1447H

---

# 7. Civil Defense

These requirements apply only where the Hajj company is responsible for the relevant camp/site.

Applicability rule:

company_responsible_for_camp == true

---

## CIV-01

**Requirement:** جاهزية وسائل وأنظمة الإطفاء

**Authority:** الدفاع المدني

**Domain:** السلامة

**Verification Method:**
- field inspection
- checklist with evidence
- official inspection result

**Official Weight:** null

---

## CIV-02

**Requirement:** وجود عمالة مدربة على استخدام وسائل الإطفاء

**Authority:** الدفاع المدني

**Domain:** السلامة

**Verification Method:**
- verified workforce records
- training evidence
- inspection evidence

**Official Weight:** null

---

## CIV-03

**Requirement:** إبقاء مخارج الطوارئ مفتوحة وخالية من العوائق

**Authority:** الدفاع المدني

**Domain:** السلامة

**Verification Method:**
- field inspection
- official inspection
- checklist with evidence

**Official Weight:** null

---

## CIV-04

**Requirement:** عدم استخدام تمديدات أو توصيلات كهربائية غير معتمدة

**Authority:** الدفاع المدني

**Domain:** السلامة

**Verification Method:**
- field inspection
- approved technical evidence
- official inspection result

**Official Weight:** null

---

## CIV-05

**Requirement:** منع استخدام وسائل الطبخ داخل الخيام

**Authority:** الدفاع المدني

**Domain:** السلامة

**Verification Method:**
- field inspection
- checklist with evidence
- official inspection result

**Official Weight:** null

---

# 8. Target / Actual / Gap Rule

Every measurable requirement must answer three questions:

1. What is required?
2. What is the verified current state?
3. What is the gap?

Formula where applicable:

gap = target - actual

Target must never be generated by AI without an approved source.

---

# 9. Non-Numeric Verification

For qualitative requirements, Emtithal must use official sub-requirements.

Example:

Requirement:
صناعة تجربة ضيف الرحمن

Sub-requirements:

- قائد المسار
- رحلة ضيف موحدة
- خريطة رحلة
- الهيكل التنظيمي
- استراتيجية تجربة المستفيد

The system reports the exact missing component.

It must not generate an arbitrary percentage from AI opinion.

---

# 10. Official Score

Official Score may only use:

- officially published weights
- officially published assessment rules
- official assessment results where available

If no official weight exists:

officialWeight = null

---

# 11. Emtithal Readiness Index

The Emtithal Readiness Index is an internal readiness indicator.

It is NOT a Ministry score.

It may use verified applicable requirements to help prioritize gaps.

Critical regulatory blockers must remain visible even if total readiness is high.

Example:

Emtithal Readiness: 92%

Critical blocker:
Mandatory safety requirement not satisfied.

---

# 12. Internal Criticality

Emtithal may classify requirements internally as:

- CRITICAL
- REQUIRED
- ADVISORY

This is an internal product risk classification only.

It must never be presented as an official regulatory weight unless officially documented.

---

# 13. Source Lineage

Every regulatory result must maintain traceability:

Result
→ Requirement
→ Authority
→ Official Source
→ Target Source
→ Actual Source
→ Evidence

---

# 14. Season and Version Control

Every requirement must include:

- season
- version
- effectiveDate
- officialSource

Requirements from previous seasons must not automatically be applied to 1447H.

No mixing of 1446H and 1447H rules unless continuity is officially verified.

---

# 15. AI Boundary

AI may:

- read
- extract
- map evidence
- retrieve approved requirements
- explain
- detect missing information
- suggest actions

AI must NOT:

- invent regulations
- invent official weights
- invent penalties
- invent applicability
- create official targets
- mark compliance without verification
- transform research recommendations into regulations

The deterministic Verification Engine remains the source of truth for compliance status.

---

# 16. Unresolved Requirement Rule

If any of the following is unknown:

- applicability
- target source
- verification rule
- official weight
- official source
- season/version

the requirement must be marked:

UNRESOLVED_REQUIREMENT

and must not be treated as verified regulatory truth.

---

# 17. Scope Control

Do not add additional authorities only because they participate in Hajj operations.

An authority enters the regulatory matrix only when an official requirement is directly applicable to:

- the Hajj/Umrah company
- its workers
- or a service for which the company has an official responsibility to provide, supervise, or verify

---

# 18. Future Integrations

The architecture may support future integration with:

- Nusuk
- government systems
- inspection systems
- health systems
- company ERP
- HR systems
- operational systems

However:

No integration may be presented as currently available unless it actually exists and is authorized.

Preferred wording:

"Integration subject to official API availability and required authorization."

---

# 19. Regulatory Matrix Status

Version: 1.0

Season focus: 1447H

Status:
Approved regulatory foundation for Finalist MVP implementation.

This file is the regulatory source of truth for implementation together with:

FINALIST_PRODUCT_SPEC_v0.4.md

AI_AGENTS_ARCHITECTURE_v1.md

FIGMA_IMPLEMENTATION_RULES.md