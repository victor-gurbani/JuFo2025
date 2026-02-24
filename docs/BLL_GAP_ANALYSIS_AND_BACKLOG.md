# BLL Gap Analysis And Backlog

Analysis date: 2026-02-24  
Scope: Entire authored repository content (backend, frontend, project docs, diagrams, workflows).  
Excluded from analysis: third-party/generated vendor/build artifacts (`node_modules`, `Pods`, compiled outputs).

## 1. Executive Status

Current project state is not yet at "Acing BLL" level.  
Strengths: substantial implementation, clear product idea, multi-role architecture, practical scope.  
Blocking gaps: unresolved runtime/auth/schema issues, weak scientific framing, and insufficient BLL-grade methodology/evidence package.

## 2. Critical Technical Findings (Highest Priority)

### 2.1 Missing auth middleware used in routes

- `Backend/school-access-control-backend/routes/guard.js`
- `Backend/school-access-control-backend/routes/cards.js`
- `Backend/school-access-control-backend/routes/student.js`

These routes import `../middleware/checkAuth`, but `checkAuth.js` is not present in `Backend/school-access-control-backend/middleware/`.

Impact:
- Runtime failure when these routes are loaded.
- Security model incomplete.

### 2.2 Schema mismatch in access logging

- `Backend/school-access-control-backend/server.js` creates `accessLogs` without `verified_by`.
- `Backend/school-access-control-backend/routes/guard.js` inserts into `verified_by`.

Impact:
- Logging inserts can fail.
- Invalidates reliability of empirical results and audit trail.

### 2.3 Identity model is currently client-asserted

- `Backend/school-access-control-backend/middleware/checkPermission.js` trusts `teacherId/guardId` in request body/query.
- Frontend panels send role identity as plain request data.

Impact:
- RBAC is bypass-prone.
- Weakens security claims in BLL argumentation.

### 2.4 Frontend strict TypeScript compile state

Command run:
- `cd Frontend/SchoolAccessControl && npx tsc --noEmit`

Result:
- 78 TypeScript errors.

Impact:
- Low code quality signal.
- Reproducibility and maintainability claims weakened.

### 2.5 Runtime environment mismatch

Observed:
- Backend README expects Node 22.
- Running server under Node 25 in this environment failed `sqlite3` native binding resolution.

Impact:
- Local execution instability.
- Must lock runtime and document setup precisely for reproducibility.

### 2.6 CI workflow syntax issue

- `.github/workflows/android-apk-build.yml`
- `.github/workflows/ios-production-build.yml`

Issue:
- `if:` placed under `on.push` block (invalid placement).

Impact:
- Build automation reliability unclear.

### 2.7 App config inconsistency

- `Frontend/SchoolAccessControl/app.json` references `./assets/images/favicon.png`.
- Repo assets are in `Frontend/SchoolAccessControl/assets/` (no `images/` folder).

Impact:
- Web output config drift.

## 3. BLL Rubric Gap Matrix

## 3.1 Inhalt (40%)

Current:
- Mostly descriptive project write-up.
- No strict research-question-driven evidence chain.

Missing:
- Precise Leitfrage.
- Explicit hypotheses.
- Method comparison with justification.
- Reproducible empirical dataset and metric interpretation tied directly to Leitfrage.
- Strong interdisciplinary analysis (ethics/law + organizational/economic dimension).

## 3.2 Aufbau (15%)

Current:
- Paper structure exists (9 sections), but argument flow is weak.

Missing:
- Tight chain: problem -> research gap -> method -> results -> justified answer.
- Reduced speculative text.
- Stronger chapter transitions tied to the research question.

## 3.3 Arbeitsprozess (10%)

Current:
- Iterative development is mentioned.

Missing:
- Dedicated critical reflection chapter with:
  - failed approaches,
  - pivot decisions,
  - constraints and tradeoffs,
  - individual contribution clarity.

## 3.4 Formale Aspekte (10%)

Current:
- References exist but citation architecture is inconsistent.

Missing:
- One consistent citation system across full text.
- Formal academic compliance checklist (abstract, ToC depth, figure/table index, declaration package, appendix quality).

## 3.5 Colloquium Preparation (25%)

Current:
- No formal thesis paper package present.

Missing:
- 1-2 page Thesenpapier with debatable, assertive theses.
- 10-minute presentation structure.
- Defense question prep tied to specific evidence from the written work.

## 4. Documentation Quality Findings

### 4.1 English and German docs are broad but not BLL-rigorous

- `Doku.md`
- `DokuDeutsch.md`

Issues:
- Minimal analytical depth in method evaluation.
- Limited empirical evidence.
- Inconsistent formality and occasional informal placeholders.
- Not strongly anchored to Leitfrage methodology.

### 4.2 Diagram inconsistency

- `Teacher Permission Assigment Flow.mermaid` duplicates the access flow rather than teacher assignment flow.

Impact:
- Conceptual mismatch in explanatory material.

## 5. Underdocumented Implementation Areas

1. Face processing and verification internals:
- `Backend/school-access-control-backend/routes/guard.js`
- `Backend/school-access-control-backend/utils/imageProcessor.js`

2. Student self-service photo policy and verification behavior:
- `Backend/school-access-control-backend/routes/student.js`

3. Build hardening path (obfuscation/bytecode):
- `Backend/school-access-control-backend/compile.js`
- `Backend/school-access-control-backend/obfuscator-config.js`

4. Admin-side behavior complexity:
- `Frontend/SchoolAccessControl/app/AdminPanel.tsx`

## 6. Prioritized Backlog (P0 -> P2)

## 6.1 P0: Must finish first (blockers)

- [ ] Implement `checkAuth.js` and align route middleware usage.
- [ ] Fix `accessLogs` schema mismatch (`verified_by`, timestamp consistency).
- [ ] Standardize runtime environment and lock Node version for backend/frontend.
- [ ] Make frontend compile under strict TS (`npx tsc --noEmit` clean).
- [ ] Repair workflow YAML condition placement.

## 6.2 P1: High-value BLL scoring tasks

- [ ] Define final Leitfrage and hypotheses.
- [ ] Build reproducible test protocol and collect evidence.
- [ ] Produce results tables/figures tied directly to hypotheses.
- [ ] Write interdisciplinary chapter with legal/ethical and operational analysis.
- [ ] Write full reflection chapter for Arbeitsprozess scoring.

## 6.3 P2: Strengthening tasks

- [ ] Remove redundant image conversion logic in frontend panels.
- [ ] Improve recurrence model implementation and tests.
- [ ] Improve typed API client abstraction (avoid index-based method dispatch).
- [ ] Align diagrams with real workflows and current code behavior.

## 7. Acceptance Criteria For "Reference-Ready Start"

Before major writing phase begins, the following should be true:

- [ ] Backend starts cleanly in pinned runtime.
- [ ] All critical API paths used in app run without schema/middleware crashes.
- [ ] Frontend typecheck passes.
- [ ] Minimum auth model is explicit and enforced.
- [ ] Test protocol exists and can be repeated.
- [ ] Leitfrage and hypotheses are frozen.

## 8. Residual Risks

- Native dependencies (`sqlite3`, TensorFlow stack, canvas) can fail across environments.
- Data quality for empirical section may be too weak if collection starts too late.
- Security claims can be over-stated if auth model remains partial.
- Time pressure before 2026-03-13 requires strict scope discipline.

