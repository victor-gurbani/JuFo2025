# BLL Execution Plan (2026-02-24 to 2026-03-13)

Submission target: Friday, 2026-03-13  
Start date: Tuesday, 2026-02-24  
Total window: 18 calendar days (inclusive).

## 1. Plan Strategy

- Phase A: unblock technical credibility (runtime/auth/schema/types).
- Phase B: build scientific core (Leitfrage, method, evidence).
- Phase C: finalize BLL-grade writing, formality, and colloquium prep.
- Keep at least 1 day of buffer for formatting/compliance/package finalization.

## 2. Day-By-Day Plan

| Date | Focus | Deliverable | Acceptance Criteria |
|---|---|---|---|
| 2026-02-24 | P0 triage | Final P0 implementation task list | All blockers assigned with owner + order |
| 2026-02-25 | Auth foundation | `checkAuth` implementation + route alignment | No missing middleware imports; auth flow documented |
| 2026-02-26 | Schema consistency | DB migration/creation alignment for `accessLogs` | Logging routes insert successfully to schema |
| 2026-02-27 | Runtime stability | Pinned runtime and setup notes | Reproducible startup steps validated |
| 2026-02-28 | Frontend compile pass I | Error-class reduction in TS | Critical TS errors reduced substantially |
| 2026-03-01 | Frontend compile pass II | Strict TS cleanup in major panels | `npx tsc --noEmit` clean or near-clean with explicit residual list |
| 2026-03-02 | Recurrence + behavior integrity | Recurrence logic clarified/tested | Recurring permissions behave as specified |
| 2026-03-03 | Leitfrage freeze | Final research question + hypotheses | Approved, measurable, testable statement set |
| 2026-03-04 | Method design | Evaluation protocol + baseline comparisons | Method chapter inputs are complete and reproducible |
| 2026-03-05 | Data collection I | Raw metrics run 1 | Core metrics captured and stored |
| 2026-03-06 | Data collection II | Raw metrics run 2 + consistency checks | Repeated runs show explainable variance |
| 2026-03-07 | Results analysis | Tables/charts + interpretation notes | Evidence mapped directly to hypotheses |
| 2026-03-08 | Interdisciplinary chapter | Legal/ethical + organizational analysis draft | Fächerverbindender requirement clearly met |
| 2026-03-09 | Reflection chapter | Process reflection draft | Setbacks/pivots/limitations explicitly analyzed |
| 2026-03-10 | Full structure pass | Coherent draft end-to-end | Every chapter supports Leitfrage argument chain |
| 2026-03-11 | Formal compliance pass | Citations, bibliography, figure/table indexes | One style only; no orphan references |
| 2026-03-12 | Colloquium package | Thesenpapier + oral defense prep | 4-6 debatable theses with evidence anchors |
| 2026-03-13 | Final packaging | Submission-ready packet | Complete BLL package delivered and validated |

## 3. Milestone Gates

## 3.1 Gate 1 (by 2026-03-01)

- [ ] P0 blockers closed.
- [ ] Basic technical credibility restored.

## 3.2 Gate 2 (by 2026-03-07)

- [ ] Leitfrage/hypotheses finalized.
- [ ] Reproducible evidence dataset complete.

## 3.3 Gate 3 (by 2026-03-12)

- [ ] Written draft meets rubric shape.
- [ ] Colloquium materials complete.

## 4. Dependencies

- Auth and schema fixes precede trustworthy evidence collection.
- TS and runtime stability precede credible reproducibility claims.
- Leitfrage freeze precedes final writing pass and slide/Thesenpapier design.

## 5. Risk Mitigation

- If timeline slips by >1 day before 2026-03-07:
  - Narrow scope to core claims only.
  - Drop non-critical feature improvements.
  - Preserve evidence quality over feature breadth.

- If native stack setup blocks progress:
  - Freeze environment versions.
  - Run measured experiments in a known-good pinned environment only.

## 6. Definition Of Done (Submission-Ready)

- [ ] Written BLL draft satisfies all rubric categories.
- [ ] All core technical claims are reproducible and traceable.
- [ ] Formal compliance complete (citations, bibliography, declaration package).
- [ ] Thesenpapier complete and aligned with written findings.
- [ ] Oral defense question prep done and evidence-linked.

