# FINALIST_UI_UX_LOCK.md

**Status: design contract only. No UI is implemented against this document yet.**

This file is the locked UI/UX contract for the later UI phases of Emtithal
(Phases 10/11+). It records rules to follow when UI work begins. It does **not**
authorise any UI implementation now. Nothing here changes Phase 0–9 behaviour,
data, or the AI/trust boundaries.

---

## 1. Sources of truth

| Domain | Source of truth |
|---|---|
| **Visual** | **Figma** |
| **Behavioural** | Product Specification |
| **Regulatory** | Regulatory Matrix |
| **AI / trust-boundary** | AI Architecture |

- Figma is the visual source of truth.
- The **FIRST approved Emtithal visual direction in Figma** is the canonical
  visual direction. All remaining and new screens must look like a natural
  continuation of that first approved direction.
- Do **not**: invent a second visual style; redesign approved screens; create
  generic "AI dashboard" styling; introduce random new colors or components.

---

## 2. Colors

- Use the **exact** approved color palette and shades from Figma.
- Do **not** approximate colors by eye. Do **not** invent replacement colors.
- When UI implementation starts: extract repeated approved values into consistent
  **design tokens**.
- Use the **same semantic color** consistently for the **same status/action**
  throughout the product.
- **Never communicate state by color alone** (pair with text / icon / shape).

---

## 3. Typography

- **Cairo** is the canonical primary UI font.
- Use Cairo consistently across: headings, body text, labels, forms, cards,
  tables, dashboard content.
- Maintain one consistent typographic hierarchy:
  page titles → section titles → card headings → body copy → captions → metadata.
- Do not use unnecessary font-size variations.

---

## 4. Spacing & alignment

- Figma is the visual reference, but do **not** blindly copy obvious spacing
  errors.
- If Figma contains a clear padding inconsistency, margin inconsistency,
  alignment issue, overcrowded area, or excessive empty space — correct it with
  sound UI/UX judgement while preserving the approved visual identity.
- Use **one coherent spacing rhythm/system** across the whole product.
- Do not introduce arbitrary per-screen spacing.

---

## 5. UX principle — SHOW MORE, EXPLAIN LESS

The UI must be: simple, calm, clear to the eye, understandable, low cognitive
load, easy to scan.

- No filler text. No unnecessary explanatory paragraphs. No decorative element
  without a purpose.
- Prefer: cards, KPIs, status chips, progress, charts, comparisons, scenario
  differences, source indicators, concise tooltips, progressive disclosure.
- If information can be understood visually, do not also repeat it as a paragraph.

---

## 6. Information hierarchy

On every important screen the user should quickly answer:

1. Where am I?
2. What is the important information?
3. Is anything requiring my attention?
4. What is the next action I can take?

- Avoid giving many actions the same visual priority.
- Primary actions must be obvious.

---

## 7. Responsive UX

Assume Emtithal is opened from laptop, desktop, iPad/tablet, and mobile phone.

- Do **not** simply shrink the desktop layout. Responsive behaviour must be
  intentional.
- Expectations:
  - sidebar / navigation adapts appropriately
  - cards reflow intelligently
  - tables never become unreadably compressed — use controlled horizontal
    scrolling or a mobile card representation when appropriate
  - charts stay readable
  - filters stay usable
  - modals / dialogs / drawers fit small screens
  - buttons stay usable touch targets
  - typography stays readable
  - primary actions stay reachable
  - **no accidental horizontal overflow**
- Test meaningful breakpoints during the UI phase.

---

## 8. RTL (Arabic is RTL-first)

Handle RTL deliberately — not merely `direction: rtl` — for: page layout,
navigation, sidebar, breadcrumbs, icons, directional arrows, tables, charts,
forms, filters, dialogs, drawers, pagination, scenario comparisons.

---

## 9. Component consistency

**Same function = same component / pattern.**

- same status → same chip
- same source indicator → same component
- same type of card → same layout language
- same filters → same interaction
- same primary action → same visual hierarchy

Do not redesign components independently on each page.

---

## 10. Component & screen states

Important components/screens must intentionally handle:

- loading
- empty
- error
- unavailable
- insufficient data
- pending verification
- not applicable

- Do **not** expose raw technical errors to the user.
- Do **not** render null / unknown data as fake zero values.

---

## 11. Accessibility

Maintain: readable font sizes; appropriate contrast; usable touch targets;
visible labels; keyboard/focus usability where applicable; status communication
that never depends on color alone.

---

## 12. Emtithal product-truth separation (critical)

The UI must clearly distinguish **four** concepts and must **not** let them blur
together visually:

| Concept | Meaning |
|---|---|
| **REGULATION** | regulatory truth / official requirements |
| **VERIFICATION** | deterministic verification result |
| **AI** | interpretation / explanation / recommendation |
| **RESEARCH** | contextual decision support only |

- A **research insight must NEVER visually look like an official regulatory
  requirement.**
- **"دعم بحثي"** must appear as its own clearly identified section / card, kept
  visually separate from:
  - المتطلبات التنظيمية
  - حالة الامتثال
  - مؤشر جاهزية امتثال
  - نسبة التحقق
  - العوائق الحرجة
  - نتيجة التحقق
  - "لماذا تغيرت النتيجة؟"

Consistent with Phase 8: research is decision support only — it never creates a
regulatory requirement and never changes applicability, compliance status,
Readiness Index, Verification Coverage, blockers, or Phase 7 deterministic
outputs.

---

## 13. Landing page lock

Landing stays intentionally minimal. **Only:**

- logo
- language control
- main headline
- short supporting text
- government login
- company login
- minimal footer

- Government CTA label: **"دخول الجهات الحكومية"**
- Company role: **`COMPANY_REPRESENTATIVE` / ممثل الشركة**

Do **not** add without explicit approval: feature cards, statistics, authority
grids, research cards, AI-agent explanations, dashboard previews, or marketing
clutter.

---

## 14. Missing Figma screens

When a required screen is not explicitly designed in Figma:

1. reuse existing approved components first
2. follow the FIRST approved visual direction
3. extend the same design language
4. preserve the same colors, Cairo typography, spacing, cards, borders, radii,
   icon language, navigation, and density
5. preserve Product Spec behaviour
6. do not invent product behaviour
7. do not invent data merely to make the page visually attractive

The final system must feel like **one coherent product**.

---

_This document is a locked contract for later UI phases. Do not implement any of
it yet._
