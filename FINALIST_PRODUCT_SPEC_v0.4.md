# EMTITHAL — FINALIST PRODUCT SPECIFICATION v0.4

## 1. Product Definition

امتثال منصة ذكاء تنظيمي وذكاء قرار مخصصة لشركات الحج والعمرة.

المنصة لا تكتفي بعرض الاشتراطات أو فحص المستندات، بل تكوّن صورة تشغيلية وتنظيمية مستمرة للشركة، تحدد المتطلبات المنطبقة عليها، تتحقق من حالة الاستيفاء من مصادر متعددة، تكشف الفجوات، ثم تستخدم هذه الصورة لتحليل ومحاكاة أثر القرارات التشغيلية قبل تنفيذها.

### Positioning

امتثال يكشف مخاطر عدم الامتثال مبكرًا ويحاكي أثر القرارات قبل تنفيذها.

### Product Category

Hajj Regulatory & Decision Intelligence Platform

منصة الذكاء التنظيمي وذكاء القرار لشركات الحج والعمرة.

---

# 2. Core Problem

تتعامل شركات الحج والعمرة مع متطلبات متعددة تختلف حسب:

- الجهة الحكومية
- الموسم
- نوع الخدمة
- عدد الحجاج
- عدد العاملين
- المواقع والمخيمات
- مقدمي الخدمات
- القرارات التشغيلية

امتثال يجب أن يجيب عن:

- ما المتطلبات التي تنطبق على هذه الشركة؟
- ما المطلوب منها تحديدًا؟
- ما الذي تم استيفاؤه فعليًا؟
- ما الفجوات الحالية؟
- ما مصدر كل نتيجة؟
- ماذا سيتغير إذا اتخذت الشركة قرارًا تشغيليًا جديدًا؟

---

# 3. Core Product Principle

المنصة تعمل وفق التسلسل التالي:

Company Data
→ Applicable Requirements
→ Verification
→ Gaps
→ Readiness
→ Decision Simulation
→ Recommended Action

أي نتيجة يجب أن تكون قابلة للتتبع إلى مصدرها.

---

# 4. Supported Organizations

يدعم النظام نوعين أساسيين فقط من الجهات المستخدمة للمنصة:

COMPANY
GOVERNMENT_AUTHORITY

---

# 5. Authentication Model

## 5.1 Company Login

الشركة لا تستخدم أدوار تسجيل دخول متعددة مثل:

- مسؤول امتثال
- مصدر قرار
- مسؤول تشغيل

في النسخة الحالية يوجد نوع مستخدم واحد فقط:

**ممثل الشركة**

organizationType = COMPANY
role = COMPANY_REPRESENTATIVE

ممثل الشركة يستطيع استخدام وظائف الشركة داخل المنصة حسب الصلاحيات المتاحة له.

لا يتم تعقيد تجربة التسجيل بأدوار إضافية في الـMVP.

يمكن إضافة صلاحيات داخلية مستقبلًا بدون تغيير تجربة الدخول الأساسية.

## 5.2 Government Login

تظهر في الصفحة الرئيسية:

**دخول الجهات الحكومية**

ولا نطلب من المستخدم اختيار مسمى وظيفي أثناء تسجيل الدخول.

كل مستخدم حكومي يكون مرتبطًا بجهة حكومية محددة داخل النظام:

organizationType = GOVERNMENT_AUTHORITY
organizationId = linked authority

مثال:

وزارة الحج والعمرة  
وزارة الصحة  
الدفاع المدني

يمكن دعم أدوار داخلية مستقبلًا مثل:

MEMBER
REVIEWER
ADMIN

لكنها لا تظهر كجزء من تجربة تسجيل الدخول الحالية إلا عند الحاجة.

---

# 6. Landing Page

الصفحة الرئيسية المعتمدة في Figma هي المرجع.

يجب الحفاظ على بساطتها.

العناصر الرئيسية فقط:

- شعار امتثال
- اللغة
- الرسالة الرئيسية
- وصف قصير
- دخول الجهات الحكومية
- دخول الشركات

لا يتم إضافة أقسام طويلة أو Feature Cards أو شرح للـAI Agents أو الجهات أو الأبحاث داخل الصفحة الرئيسية.

الصفحة الرئيسية ليست بروشورًا.

التفاصيل تظهر بعد تسجيل الدخول.

---

# 7. Company Onboarding

عند دخول ممثل الشركة لأول مرة، يبني امتثال ملفًا تشغيليًا أساسيًا للشركة.

الهدف:

تحديد ما الذي ينطبق عليها من متطلبات.

CompanyProfile
- companyId
- legalName
- season
- pilgrimsCount
- workforceCount
- services[]
- locations[]
- camps[]
- serviceProviders[]
- dataSources[]

---

# 8. Data Acquisition Strategy

لا يجب إجبار الشركة على إنشاء ملفات جديدة خصيصًا لامتثال إذا كانت البيانات موجودة أصلًا.

ترتيب مصادر البيانات المفضل:

Official Government Integration
↓
Company System Integration
↓
Official Imported Report
↓
Verified Document
↓
Manual Entry

الإدخال اليدوي هو آخر خيار.

أي تكامل حكومي مستقبلي مشروط بـ:

- توفر API رسمي
- الصلاحيات النظامية
- الموافقات المطلوبة

ممنوع الادعاء بوجود أي تكامل غير موجود فعليًا.

---

# 9. Company Data Sources

يجب أن تظهر للشركة مصادر بياناتها بشكل واضح.

مثال:

Nusuk
Connected / Not Connected

Workers Data
Connected / Not Connected

Operational Data
Connected / Not Connected

Evidence
Connected / Not Connected

كل معلومة يجب أن تحتوي على:

source
lastUpdated
verificationStatus

---

# 10. Regulatory Model

المتطلبات التنظيمية تُبنى وفق:

Authority
→ Domain
→ Track / Program
→ Requirement

التفاصيل التنظيمية الرسمية توجد في:

REGULATORY_MATRIX_v1.md

وهو المرجع التنظيمي الأساسي للمنصة.

---

# 11. Applicability Engine

قبل تقييم أي Requirement، يجب أن يحدد النظام هل ينطبق على الشركة أصلًا.

مثال:

company_responsible_for_camp == true

إذا لم ينطبق المتطلب:

NOT_APPLICABLE

ولا يدخل في حساب الجاهزية.

---

# 12. Target Engine

امتثال لا يخترع قيمة المطلوب.

الـTarget يأتي من مصدر واضح مثل:

Official Data
Company Operational Profile
Approved Regulatory Rule

مثال:

Pilgrims requiring service = 1000
Actual covered pilgrims = 960
Gap = 40

يجب أن يكون للـ1000 مصدر.

---

# 13. Verification Engine

محرك التحقق هو مصدر الحقيقة في حالة الامتثال.

المسار:

Requirement
↓
Applicability
↓
Target
↓
Actual
↓
Verification Rule
↓
Compliance Status

الحالات المسموحة:

COMPLIANT
PARTIALLY_COMPLIANT
NON_COMPLIANT
PENDING_VERIFICATION
INSUFFICIENT_DATA
NOT_APPLICABLE

قواعد أساسية:

Missing Data ≠ Non-Compliance

Uploaded Document ≠ Compliance

Manual Declaration ≠ Verified Fact

---

# 14. Verification Profile

كل Requirement يجب أن يجيب على:

What is required?
Who does it apply to?
Where does the target come from?
Where does the actual value come from?
How is completion verified?
What evidence is accepted?
When was it last verified?

إذا لم نستطع الإجابة، لا يعتمد المتطلب للتقييم الآلي.

---

# 15. Non-Numeric Requirements

المتطلبات النوعية لا يتم تقييمها برأي AI عام.

يتم تقسيمها إلى Sub-Requirements رسمية.

مثال:

قائد المسار ✅  
رحلة ضيف موحدة ✅  
خريطة الرحلة ✅  
الهيكل التنظيمي ✅  
استراتيجية تجربة المستفيد ❌

ويعرض امتثال:

Missing:
استراتيجية تجربة المستفيد

---

# 16. Official Score

الدرجة الرسمية تستخدم فقط إذا توفر:

- وزن رسمي
- قاعدة تقييم رسمية
- نتيجة رسمية

إذا لم يوجد وزن رسمي:

officialWeight = null

ممنوع إنشاء وزن تقريبي وعرضه على أنه رسمي.

---

# 17. Emtithal Readiness Index

يمتلك امتثال مؤشر جاهزية داخلي مستقل:

Emtithal Readiness Index

هذا المؤشر:

- ليس درجة وزارة
- لا يمثل تقييمًا حكوميًا رسميًا
- يساعد على ترتيب الفجوات والمخاطر

مثال:

Readiness: 92%

Critical Blocker:
Mandatory safety requirement unresolved

المشكلة الحرجة لا تختفي بسبب ارتفاع النسبة العامة.

---

# 18. Multi-Authority Compliance

النسخة الجديدة ليست مرتبطة بوزارة الحج فقط.

V1 يدعم المتطلبات المثبتة رسميًا من:

وزارة الحج والعمرة  
وزارة الصحة  
الدفاع المدني

إضافة جهة جديدة تتطلب وجود Requirement رسمي مباشر ينطبق على:

- الشركة
- العاملين
- أو خدمة تقع على الشركة مسؤولية توفيرها أو التحقق منها

لا تتم إضافة الجهات فقط لأنها تشارك في موسم الحج.

---

# 19. Provider Responsibility

يجب التمييز بين:

COMPANY
EMPLOYEE
SERVICE_PROVIDER
SHARED

إذا كانت الشركة متعاقدة مع مقدم إعاشة أو نقل، لا تُنسب كل مخالفة تخص مقدم الخدمة مباشرة للشركة إلا إذا كان هناك نص رسمي يثبت مسؤوليتها عنها.

---

# 20. AI Architecture

النسخة النهائية تستخدم AI Agents فعلية.

الـAI لا يستبدل محرك التحقق.

الـAI دوره:

- الفهم
- الاستخراج
- الربط
- البحث
- الشرح
- اقتراح البدائل

أما حالة الامتثال فتحدد من خلال Verification Engine وقواعد رسمية.

---

# 21. Regulatory Intelligence Agent

وكيل التنظيمات.

مسؤوليته:

Retrieve approved regulations
Understand requirement context
Map requirements to company activities
Explain source
Identify affected requirements

ممنوع:

Invent regulations
Invent official weights
Invent penalties
Invent applicability

---

# 22. Evidence Intelligence Agent

وكيل الأدلة.

يقرأ:

- PDF
- Excel
- النصوص
- التقارير
- الملفات المرفوعة

ويستخرج:

facts
dates
counts
entities
evidence references
missing information
contradictions

ثم يرسل النتائج لمحرك التحقق.

لا يقرر COMPLIANT بنفسه.

---

# 23. Decision Intelligence Agent

وكيل ذكاء القرار.

هذا هو العنصر الرئيسي في امتثال.

مثال لقرار المستخدم:

زيادة الحافلات بنسبة 15%

المسار:

Understand Decision
↓
Identify Operational Domain
↓
Identify Affected Requirements
↓
Read Company Context
↓
Read Regulatory Context
↓
Generate Assumptions
↓
Generate Scenarios
↓
Evaluate Effects
↓
Explain Results

---

# 24. Scenario Simulation

يدعم النظام:

Current State
Scenario A
Scenario B
Scenario C

مثال:

A: زيادة الحافلات 10%
B: زيادة الحافلات 15%
C: إعادة توزيع الحافلات بدون زيادة العدد

المقارنة تعرض بصريًا:

Readiness Impact
Risk
Affected Requirements
Confidence
Operational Impact
Research Insight

---

# 25. Explainability

كل نتيجة AI يجب أن تحتوي على:

reason
requirementsUsed[]
dataUsed[]
assumptions[]
confidence
sources[]

يجب أن يستطيع المستخدم الضغط على:

**لماذا تغيرت النتيجة؟**

ويرى السبب بشكل واضح ومختصر.

---

# 26. Confidence

كل استنتاج AI:

HIGH
MEDIUM
LOW

إذا:

confidence = LOW

يمكن أن يصبح:

humanReviewRequired = true

ولا يتم استخدام النتيجة غير الموثوقة لتغيير درجة رسمية.

---

# 27. Assumptions

كل Scenario يجب أن يعرض الافتراضات الأساسية المستخدمة.

مثال:

عدد الحجاج ثابت  
عدد العاملين لم يتغير  
المتعهد الحالي مستمر  
البيانات التشغيلية حديثة

لا يتم إخفاء الافتراضات.

---

# 28. Source Lineage

أي نتيجة يجب أن تكون قابلة للتتبع:

Result
→ Requirement
→ Authority
→ Official Source
→ Company Data
→ Evidence

---

# 29. Action Plan

بعد اختيار Scenario:

Selected Scenario
↓
Action Plan

كل Action:

Task
Owner
Requirement
Deadline
Required Evidence
Status

الهدف تحويل التوصية إلى تنفيذ عملي.

---

# 30. Research Knowledge Agent

وكيل المعرفة البحثية يعتمد في V1 على المصادر الرسمية المنشورة من:

**معهد خادم الحرمين الشريفين لأبحاث الحج والعمرة — جامعة أم القرى**

وظيفته:

- البحث في الدراسات
- إيجاد الدراسات المرتبطة بالسؤال
- تلخيص النتائج
- إظهار المصدر والسنة
- استخراج Operational Insights

---

# 31. Research Knowledge Search

يوجد داخل النظام قسم مستقل:

**المعرفة البحثية**

مثال سؤال:

كيف يمكن تقليل زمن انتظار الحافلات؟

النتيجة:

Relevant Studies
Summary
Key Findings
Operational Insights
Original Source
Publication Date

---

# 32. Research Inside Decision Simulation

وكيل القرار يستطيع استدعاء وكيل المعرفة البحثية.

مثال:

Decision:
Increase shuttle buses

Regulatory Impact:
...

Research Insight:
...

قاعدة صارمة:

Research Insight ≠ Regulatory Requirement

الدراسة لا:

- تغير Official Score
- تصبح اشتراطًا حكوميًا
- تستخدم لإثبات مخالفة

وظيفتها دعم القرار فقط.

---

# 33. AI Guardrails

AI MUST NOT invent regulations.

AI MUST NOT invent official weights.

AI MUST NOT invent penalties.

AI MUST NOT invent official API integrations.

AI MUST NOT mark compliance without verification.

AI MUST NOT convert research into regulation.

AI MUST NOT treat missing data as compliance.

AI MUST expose sources for regulatory claims.

إذا لم تتوفر معلومة موثوقة:

INSUFFICIENT_DATA

أو:

UNRESOLVED_REQUIREMENT

---

# 34. Human-in-the-Loop

تحتاج الحالات التالية مراجعة بشرية عند الحاجة:

Ambiguous Evidence
Low Confidence
Conflicting Evidence
High-Risk Requirement
Reported AI Result

يتم حفظ:

reviewer
decision
timestamp
comment
previousResult
newResult

---

# 35. Report AI Result

يستمر نظام:

**Report Result**

الحالات:

OPEN
UNDER_REVIEW
WAITING_FOR_USER
RESOLVED
CLOSED

ويحتفظ بـ:

AI result version
user report
review notes
resolution
audit trail

---

# 36. Regulatory Versioning

كل Requirement يحتوي على:

season
version
effectiveFrom
effectiveTo
officialSource

لا يجوز خلط موسم 1446 مع 1447 تلقائيًا.

---

# 37. Government Authority Experience

المستخدم الحكومي يرى فقط البيانات والصلاحيات المرتبطة بجهته حسب النظام.

الواجهة الحكومية يمكن أن تعرض:

Companies
Applicable Requirements
Risk Signals
Verification Status
Evidence Status
Pending Reviews

لكن لا يتم افتراض أن جميع الجهات الحكومية تحتاج نفس الصلاحيات.

يجب أن تسمح المعمارية بالتوسع لاحقًا.

---

# 38. Company Dashboard

يجب أن تكون بصرية ومختصرة.

الأولوية:

Readiness
Critical Risks
Pending Verification
Top Gaps
Authorities
Recommended Action
Decision Simulation

ليس نصوصًا طويلة.

---

# 39. Requirement Detail

صفحة المتطلب تعرض:

Status
Target
Actual
Gap

Authority
Official Source

Verification Method
Evidence

Last Verified
Confidence
Related Risks

---

# 40. UI / UX Principle

التصميم المعتمد في Figma هو المرجع البصري.

قاعدة رئيسية:

**Show more. Explain less.**

تستخدم الواجهة:

- Cards
- Numbers
- Charts
- Status
- Progress
- Comparison
- Source badges
- Short labels

وتتجنب:

- الفقرات الطويلة
- الحشو
- الشروحات الكبيرة داخل الصفحة
- تكرار نفس المعلومة

التفاصيل الإضافية تظهر في:

Drawer
Modal
Expandable Details
Tooltip

---

# 41. Figma Source of Truth

يجب على Claude الحفاظ على:

Typography
Spacing
Cards
Tables
Navigation
Inputs
Status System
Border Radius
Visual Hierarchy

كما في Figma المعتمد.

لا يتم إنشاء Design Language جديد.

---

# 42. Missing Figma Screens

إذا كانت شاشة مطلوبة غير موجودة في Figma:

Claude يستطيع إنشاءها فقط باستخدام نفس:

components
spacing
typography
colors
layout logic
navigation patterns

المستخدمة في الشاشات المعتمدة.

لا يضيف تصميمًا جديدًا من عنده.

---

# 43. Existing Product Preservation

التطوير يبنى فوق المشروع الحالي.

لا يعاد بناء المشروع من الصفر.

يتم الحفاظ على ما يزال صالحًا من:

Company Dashboard
Government / Ministry Views
Evidence Flow
Compliance Engine
Decision Simulation
Audit Concepts
Dispute Workflow
Existing Routes

مع تعديل ما يتعارض مع هذه المواصفات.

---

# 44. Demo Mode

يجب أن يكون لدينا Demo Dataset ثابت للاختبار والعرض.

الهدف:

- سرعة العرض
- منع فشل Demo بسبب API
- التحكم في السيناريوهات

يجب التمييز داخل الكود بين:

DEMO_DATA
REAL_DATA

لا تقدم البيانات الوهمية على أنها بيانات حقيقية.

---

# 45. Production Integrations

المعمارية تدعم مستقبلًا:

Nusuk
Government Systems
Inspection Systems
Health Systems
Company ERP
HR Systems
Operational Systems

لكن لا يعرض أي منها كـConnected فعليًا إلا إذا كان الربط موجودًا ومصرحًا به.

---

# 46. Primary User Journey

Company Representative Logs In
↓
Company Profile Built / Synced
↓
Applicable Requirements Determined
↓
Data and Evidence Collected
↓
Verification Engine
↓
Gaps + Readiness
↓
User Enters Operational Decision
↓
Decision Intelligence Agent
↓
Scenario Comparison
↓
Regulatory Impact
↓
Research Insight
↓
Recommended Scenario
↓
Action Plan
↓
Re-Verification

---

# 47. Product Differentiation

امتثال لا يعتمد في تميزه على:

- تجميع اللوائح
- رفع الملفات
- البحث التنظيمي
- Dashboard
- AI Chat

التميّز الأساسي:

**تكوين صورة امتثال تشغيلية موثقة للشركة ثم استخدامها لتحليل ومحاكاة أثر القرار التشغيلي على الالتزامات والمخاطر قبل التنفيذ.**

---

# 48. What Emtithal Is Not

امتثال ليس:

Government Authority
Official Inspection Replacement
Official Compliance Certification
Legal Opinion Generator
Generic AI Chat
Document Storage Platform
Hajj ERP

امتثال هو:

Regulatory Intelligence
+
Decision Intelligence

---

# 49. Finalist MVP Success Criteria

تعتبر النسخة جاهزة عندما يستطيع المستخدم تنفيذ الرحلة التالية:

Login as Company Representative
↓
See Multi-Authority Compliance
↓
Open Requirement
↓
See Target / Actual / Gap / Source
↓
Inspect or Upload Evidence
↓
See Verification Result
↓
Enter Operational Decision
↓
Compare at least 2 Scenarios
↓
See Affected Requirements
↓
See Reasons + Confidence
↓
See Research Insight
↓
Select Scenario
↓
See Action Plan

---

# 50. Claude Pre-Implementation Rule

قبل أي Coding يجب على Claude قراءة:

REGULATORY_MATRIX_v1.md
FINALIST_PRODUCT_SPEC_v0.4.md
AI_AGENTS_ARCHITECTURE_v1.md
FIGMA_IMPLEMENTATION_RULES.md

ثم يقدم فقط:

1. Architecture understanding
2. Existing functionality to preserve
3. Required changes
4. Data model changes
5. Conflicts
6. Missing information
7. Risks
8. Proposed implementation phases

ولا يبدأ Coding حتى يحصل على موافقة.

---

# 51. No-Assumption Rule

إذا كان أي شيء غير واضح في:

Regulation
Official Weight
Official Source
API Capability
Verification Rule
Business Rule
Figma Behavior

Claude لا يخمن.

يضعه:

UNRESOLVED

ويطلب توضيحًا قبل تنفيذه كحقيقة.

---

# 52. Development Phases

Phase 1
Data Model + Multi-Authority Structure

Phase 2
Company Profile + Data Sources + Applicability

Phase 3
Verification Engine

Phase 4
Real AI Agents

Phase 5
Decision Intelligence + Scenario Comparison

Phase 6
Research Knowledge

Phase 7
Approved Figma UI

Phase 8
Testing + Demo Dataset + Production Build

Phase 9
Vercel Deployment

بعد كل مرحلة:

Tests
TypeScript Check
Lint
Build
Manual Review

---

# 53. Final Product Principle

امتثال لا يجيب فقط:

**هل الشركة ممتثلة الآن؟**

بل:

**ما وضع الشركة الآن، ماذا ينقصها، ما مصدر النتيجة، وكيف سيتغير وضعها التنظيمي إذا اتخذت قرارًا تشغيليًا قبل تنفيذه؟**

---

## Document Status

Version: 0.4

Stage: Finalist Pre-Development Specification

Regulatory Source of Truth:

REGULATORY_MATRIX_v1.md

Visual Source of Truth:

Approved Finalist Figma Design

Implementation:

Not authorized until all implementation documents are reviewed.