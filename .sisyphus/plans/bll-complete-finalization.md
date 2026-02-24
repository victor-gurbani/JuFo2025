# BLL Complete Finalization Plan

> **Objective**: Finalize the School Access Control System project for maximum score (15 points) in the Besondere Lernleistung (BLL). Covers code fixes, LaTeX paper writing, empirical evaluation, and colloquium preparation.
>
> **Deadline**: Friday, March 13, 2026
> **Grading**: 75% Written Paper + 25% Oral Colloquium

## Context & Key Decisions

### Leitfrage (Research Question)
"Wie lässt sich die physische Zugangskontrolle an Schulen durch die Kombination von passiver RFID-Technologie und lokaler KI-Gesichtserkennung sicher, datenschutzkonform und vollautomatisiert umsetzen?"

### Architecture
- AI runs **locally** (on-premises, e.g., Raspberry Pi in the school). Biometric data never leaves the local network.
- VPS benchmarks are **performance comparisons only** — the paper recommends and defends local deployment for GDPR compliance.
- The system uses RFID (passive), not active NFC. See `speech.md` for rationale.

### Technical Decisions
- **Authentication**: JWT-based. New `checkAuth.js` middleware using JWT verification. `checkPermission.js` stays for role hierarchy but reads from `req.user` (JWT-authenticated identity).
- **Paper Scope**: Technical system focus (not full JuFo journey). JuFo mentioned briefly in intro/reflection.
- **Empirical Data**: Mix of real tests (Raspberry Pi vs Oracle VPS benchmarks for face recognition latency/accuracy) + theoretical analysis of the face-api algorithm.
- **Live Demo**: Planned for colloquium presentation. Demo fallback mode needed.

### BLL Rubric (What Scores Points)
| Category | Weight | Key Requirements |
|----------|--------|------------------|
| Inhalt (Content) | 40% | Leitfrage, hypotheses, method comparison, interdisciplinary (law/ethics), originality |
| Aufbau (Structure) | 15% | "Roter Faden" — logical flow, each chapter requires the next |
| Arbeitsprozess (Reflection) | 10% | Dedicated reflection chapter, setbacks, pivots, independent contribution |
| Formale (Formal) | 10% | Citations (authoryear), abstract, ToC, figure/table list, declaration of originality |
| Colloquium | 25% | Thesenpapier (4-6 theses), 10-min presentation, 10-min defense |

### Guardrails (from Metis Review)
1. **Code Freeze after Wave 2**: No new features. Only fix listed bugs and stabilize for demo.
2. **Content Before Formatting**: Write all paper content in LaTeX directly (scaffold exists), don't waste time on formatting.
3. **Demo Fallback**: Build mock-data toggle in frontend for safe colloquium presentation.
4. **Local AI = GDPR**: All paper claims about "datenschutzkonform" must be backed by the local-only architecture. VPS is comparison benchmark only.
5. **No Scope Creep**: Do NOT add PostgreSQL migration, live video recognition, or any roadmap items.

## Task Dependency Graph

```
Wave 1 (Parallel - No Dependencies)
├── Task 1: Implement JWT Authentication (checkAuth.js) [x]
├── Task 2: Fix Database Schema (accessLogs + permissions) [x]
├── Task 3: Backend Cleanup (console.logs, .env, error handling) [x]
└── Task 4: LaTeX Paper — Kurzfassung + Einleitung + Theoretischer Hintergrund [x]

Wave 2 (After Wave 1)
├── Task 5: Frontend Stabilization (auth integration, URL config, web-only fixes) [x]
├── Task 5B: Code Polish & Quality Hardening (TS errors, interfaces, dead code, linting) [x]
├── Task 6: LaTeX Paper — Methodik und Umsetzung (system architecture chapter) [x]
└── Task 7: Create Figures & Diagrams for Paper

Wave 3 (After Wave 2)
├── Task 8: Benchmark Script + Data Collection (RPi vs VPS) [x]
├── Task 9: LaTeX Paper — Ergebnisse und Evaluation (needs benchmark data) [x]
├── Task 10: LaTeX Paper — Interdisciplinary Chapter (Law/GDPR/Ethics) [x]

Wave 4 (After Wave 3)
├── Task 11: LaTeX Paper — Reflexion Arbeitsprozess [x]
├── Task 12: LaTeX Paper — Fazit und Ausblick [x]
├── Task 13: Bibliography & Formal Compliance [x]
├── Task 14: Demo Fallback Mode (mock auth for colloquium) [x]

Wave 5 (After Wave 4)
├── Task 15: Thesenpapier (4-6 theses with evidence anchors)
├── Task 16: Colloquium Presentation Prep
└── Task 17: Appendices (Reproducibility + Materials) [x]

Final Verification Wave
├── Task 18: Full LaTeX Compilation & Review
├── Task 19: Code Packaging & Final Git Tag
└── Task 20: Submission Package Assembly
```

## Tasks

### Wave 1: Foundation (No Dependencies)

---

#### Task 1: Implement JWT Authentication System

**What**: Create the missing `checkAuth.js` middleware implementing JWT-based authentication. Add a login endpoint. Update all routes that import `checkAuth` to work with the JWT flow. Update `checkPermission.js` to read identity from `req.user` instead of client-supplied `teacherId`/`guardId`.

**Why**: 3 route files (`guard.js`, `cards.js`, `student.js`) crash at runtime because `checkAuth.js` doesn't exist. Client-asserted identity undermines all security claims in the BLL paper. JWT auth is also more impressive for the paper's technical depth.

**Files to modify**:
- CREATE: `Backend/school-access-control-backend/middleware/checkAuth.js`
- CREATE: `Backend/school-access-control-backend/routes/auth.js` (login endpoint)
- MODIFY: `Backend/school-access-control-backend/server.js` — mount auth route, add `require('dotenv').config()`
- MODIFY: `Backend/school-access-control-backend/middleware/checkPermission.js` — read from `req.user` instead of `req.body.teacherId`
- MODIFY: `Backend/school-access-control-backend/routes/guard.js` — verify checkAuth import works
- MODIFY: `Backend/school-access-control-backend/routes/cards.js` — verify checkAuth import works
- MODIFY: `Backend/school-access-control-backend/routes/student.js` — verify checkAuth import works

**Implementation Details**:
1. `checkAuth.js` middleware:
   - Read JWT from `Authorization: Bearer <token>` header
   - Verify using `JWT_SECRET` from `process.env` (already in `.env`)
   - Set `req.user = { id, role, permissions }` on success
   - Return 401 if token missing/invalid
   - The existing `.env` already has `JWT_SECRET=bbef48bb...` — use it
   - Accept permission array: `checkAuth(db, ['VALIDATE_SWIPE'])` — check `req.user.permissions` includes required permissions
2. `auth.js` login route:
   - POST `/auth/login` accepts `{ id, password }` (for teachers/guards/admin)
   - Look up teacher in DB, verify credentials (add a `passwordHash` column to teachers table or use a simple shared secret for the prototype)
   - Return JWT with `{ id, role: permissionLevel, permissions: [...] }` payload
   - For students: POST `/auth/login-student` accepts `{ studentId }` with limited permissions
3. Update `checkPermission.js`:
   - Instead of reading `req.body.teacherId`, read `req.user.id` (set by checkAuth)
   - Keep role hierarchy logic (student < guard < teacher < tutor < admin)
   - Fail with 401 if `req.user` not set (checkAuth should run first)
4. Verify all 3 route files that import checkAuth now start correctly

**Depends on**: Nothing
**Blocks**: Task 5 (Frontend auth integration)

**QA Scenarios**:
1. `node -e "require('./middleware/checkAuth')"` succeeds (no missing module)
2. `node server.js` starts without crash (all route imports resolve)
3. `curl -X POST http://localhost:3000/auth/login -H 'Content-Type: application/json' -d '{"id":"admin","password":"..."}' | jq .token` returns a JWT
4. `curl -H "Authorization: Bearer <token>" http://localhost:3000/guard/validate` returns 200 (not 401)
5. `curl http://localhost:3000/guard/validate` without token returns 401

---

#### Task 2: Fix Database Schema Mismatches

**What**: Fix the `accessLogs` table to include the `verified_by` column, and the `permissions` table to include `createdAt`. Fix all SQL INSERT/SELECT statements that reference these columns.

**Why**: Guard routes insert into `verified_by` column that doesn't exist → SQL errors → access logging fails → undermines audit trail claims in the BLL paper. Permission queries order by `createdAt` that doesn't exist.

**Files to modify**:
- MODIFY: `Backend/school-access-control-backend/server.js` — update CREATE TABLE statements
- VERIFY: `Backend/school-access-control-backend/routes/guard.js` — INSERT statements match schema
- VERIFY: `Backend/school-access-control-backend/routes/teacher.js` — any accessLogs references

**Implementation Details**:
1. In `server.js`, update the `accessLogs` CREATE TABLE to:
   ```sql
   CREATE TABLE IF NOT EXISTS accessLogs (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     direction TEXT,
     student TEXT,
     card TEXT,
     wasApproved INTEGER,
     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
     verified_by TEXT,
     FOREIGN KEY (student) REFERENCES students(id),
     FOREIGN KEY (card) REFERENCES cards(uid),
     FOREIGN KEY (verified_by) REFERENCES teachers(id)
   )
   ```
2. Add ALTER TABLE fallback (already existing pattern in server.js):
   ```javascript
   db.run(`ALTER TABLE accessLogs ADD COLUMN verified_by TEXT`, (err) => {
     if (err && !err.message.includes('duplicate column')) console.error(err);
   });
   ```
3. In `server.js`, update `permissions` CREATE TABLE to include:
   ```sql
   createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
   ```
4. Add ALTER TABLE fallback for `permissions.createdAt`
5. Verify every INSERT INTO accessLogs in guard.js matches the new schema
6. Verify every ORDER BY p.createdAt in guard.js works with the new column

**Depends on**: Nothing
**Blocks**: Task 8 (Benchmarks need working access logging)

**QA Scenarios**:
1. Delete `database.db`, run `node server.js`, verify tables created with correct schema: `sqlite3 database.db ".schema accessLogs" | grep verified_by`
2. POST to `/guard/validate` with a valid card → access log entry created with `verified_by` populated
3. No SQL errors in server console when running guard validation flow

---

#### Task 3: Backend Cleanup & Security Hardening

**What**: Remove excessive console.logs (49+ across backend), secure the `.env` file, add `.gitignore` entries, pin Node version, add centralized error handling.

**Why**: Console.logs leak PII and internal state. Plaintext secrets in `.env` could be committed to git. Unpinned Node version causes native binding failures. These affect reproducibility (BLL Formale) and security claims (BLL Inhalt).

**Files to modify**:
- MODIFY: `Backend/school-access-control-backend/routes/guard.js` — remove ~35 console.logs
- MODIFY: `Backend/school-access-control-backend/routes/student.js` — remove console.logs
- MODIFY: `Backend/school-access-control-backend/routes/admin.js` — remove console.logs
- MODIFY: `Backend/school-access-control-backend/utils/imageProcessor.js` — remove debug logs
- MODIFY: `Backend/school-access-control-backend/server.js` — remove memory logging interval, add centralized error handler, add `require('dotenv').config()`
- MODIFY: `Backend/school-access-control-backend/.gitignore` — ensure `.env` and `database.db` are ignored
- CREATE: `Backend/school-access-control-backend/.nvmrc` — pin Node version (22.x)
- VERIFY: `Backend/school-access-control-backend/.env` — is NOT committed to git

**Implementation Details**:
1. Remove all `console.log` statements from route files. Replace critical error logging with a simple pattern:
   ```javascript
   // At top of each route file:
   const debug = process.env.NODE_ENV === 'development';
   // Replace console.log with:
   if (debug) console.log(...);
   // Keep console.error for actual errors but clean up the messages
   ```
2. In `server.js`:
   - Add `require('dotenv').config();` at the top
   - Replace hardcoded `PORT = 3000` with `process.env.PORT || 3000`
   - Remove the `setInterval` memory usage logger (or gate it behind `NODE_ENV === 'development'`)
   - Add centralized error handler at the end: `app.use((err, req, res, next) => { ... })`
3. Create `.nvmrc` with content `22` (or the exact version used)
4. Ensure `.gitignore` includes: `.env`, `database.db`, `node_modules/`, `*.log`
5. Remove commented-out fallback code in guard.js (the large commented block)
6. Clean up the TODO comment in guard.js

**Depends on**: Nothing (can run parallel with Tasks 1, 2, 4)
**Blocks**: Nothing directly (improves code quality for paper screenshots)

**QA Scenarios**:
1. `grep -r "console.log" Backend/school-access-control-backend/routes/ | wc -l` returns 0 (or only debug-gated ones)
2. `grep -r "console.log" Backend/school-access-control-backend/utils/ | wc -l` returns 0
3. `.env` is in `.gitignore`: `grep ".env" Backend/school-access-control-backend/.gitignore`
4. `cat Backend/school-access-control-backend/.nvmrc` returns `22`
5. `node server.js` starts cleanly with no debug output in production mode

---

#### Task 4: LaTeX Paper — Kurzfassung, Einleitung, Theoretischer Hintergrund

**What**: Write the first three sections of the BLL paper: the abstract (Kurzfassung), introduction (Einleitung), and theoretical background (Theoretischer Hintergrund). Adapt content from `DokuDeutsch.md`, `Doku.md`, `README.md`, and `Idea.md`.

**Why**: These are the foundational chapters (40% Inhalt + 15% Aufbau scores). The Leitfrage must be established in the introduction, and the theoretical background must lay the groundwork for methodology and evaluation.

**Files to modify**:
- MODIFY: `BLL-LaTeX/sections/00_titelblatt.tex` — fill in metadata (name: Victor Gurbani, school, evaluators: Steffen Ramin / Stephan Seel, subject: Informatik)
- MODIFY: `BLL-LaTeX/sections/01_kurzfassung.tex` — write 150-250 word German abstract
- MODIFY: `BLL-LaTeX/sections/02_einleitung.tex` — write full introduction (3-4 pages)
- MODIFY: `BLL-LaTeX/sections/03_theoretischer_hintergrund.tex` — write theoretical background (3-4 pages)

**Implementation Details**:

1. **Titelblatt** (`00_titelblatt.tex`):
   - Title: "Sichere Schulzugangskontrolle durch RFID und KI-Gesichtserkennung" (or similar)
   - Author: Victor Gurbani
   - School: [Fill from existing metadata]
   - Erstkorrektor: Steffen Ramin
   - Zweitkorrektor: Stephan Seel
   - Fach: Informatik
   - Date: March 2026

2. **Kurzfassung** (`01_kurzfassung.tex`):
   - 150-250 words in German
   - Must cover: problem (school access control), approach (RFID + face recognition), key results (accuracy, latency), conclusion (feasibility)
   - Reference the Leitfrage
   - Source material: README.md overview section, Doku.md summary

3. **Einleitung** (`02_einleitung.tex`):
   - ~3-4 pages covering:
     - **Kontext & Motivation**: Current school security problems, manual sign-out processes, doctor's appointment scenario (from `Idea.md`), privacy concerns with existing solutions
     - **Leitfrage**: State the full research question verbatim
     - **Hypothesen**: Formulate 3 testable hypotheses:
       - H1: "Ein RFID-basiertes Berechtigungssystem kann Zugangsentscheidungen in unter 2 Sekunden treffen"
       - H2: "Lokale KI-Gesichtserkennung erreicht eine Erkennungsgenauigkeit von mindestens 90% bei Schülerfotos"
       - H3: "Durch die lokale Verarbeitung biometrischer Daten lassen sich die Anforderungen der DSGVO vollständig erfüllen"
     - **Aufbau der Arbeit**: Brief roadmap of the paper structure (each chapter in 1-2 sentences)
   - Source material: `Idea.md` (original concept), `speech.md` (presentation notes), `README.md` (overview)

4. **Theoretischer Hintergrund** (`03_theoretischer_hintergrund.tex`):
   - ~3-4 pages covering:
     - **RFID-Technologie**: Passive RFID principles, frequency bands, UID uniqueness, comparison to active NFC. Why RFID was chosen (from `speech.md`: no data stored on card = privacy)
     - **Gesichtserkennung mit neuronalen Netzen**: SSD MobileNet v1 architecture overview, face landmark detection, face descriptor computation, Euclidean distance for matching, threshold selection (0.6)
     - **Datenschutz (DSGVO)**: Art. 9 DSGVO (biometric data as special category), Art. 5 principles (data minimization, purpose limitation), why local processing is GDPR-compliant
     - **Vergleich bestehender Systeme**: Brief comparison of existing school access control methods (paper passes, electronic gates with ID cards, commercial biometric systems) and their limitations
   - Sources to cite: DSGVO text, TensorFlow.js documentation, face-api.js documentation, RFID standards (ISO 14443), school security literature
   - Add to `references.bib`: at least 8-10 proper BibTeX entries for the sources cited

**Depends on**: Nothing
**Blocks**: Task 6 (Methodik needs theoretical foundation)

**QA Scenarios**:
1. `cd BLL-LaTeX && latexmk -pdf main.tex` compiles without fatal errors
2. Each section file has actual German prose (not just placeholder brackets)
3. The Leitfrage appears verbatim in `02_einleitung.tex`
4. At least 3 hypotheses are stated in the introduction
5. `references.bib` contains at least 8 entries (up from 2)
6. `\cite{}` commands appear in the theoretical background chapter

---

### Wave 2: System Documentation & Frontend (After Wave 1)

---

#### Task 5: Frontend Stabilization & Auth Integration

**What**: Fix critical frontend issues: integrate JWT authentication, make baseURL configurable, remove web-only code that crashes on native, clean up TypeScript errors.

**Why**: The frontend must work for the live demo at the colloquium (25% of grade). Currently, `document.addEventListener` crashes on native, baseURL is hardcoded, and there's no auth integration.

**Files to modify**:
- MODIFY: `Frontend/SchoolAccessControl/services/api.ts` — make baseURL configurable, add JWT token interceptor
- MODIFY: `Frontend/SchoolAccessControl/app/index.tsx` — implement actual login flow (POST to `/auth/login`, store JWT)
- MODIFY: `Frontend/SchoolAccessControl/app/AdminPanel.tsx` — remove `document.addEventListener`, replace `apiWithTeacherId` with JWT-authenticated calls
- MODIFY: `Frontend/SchoolAccessControl/app/TeacherPanel.tsx` — replace teacherId-based calls with JWT-authenticated calls
- MODIFY: `Frontend/SchoolAccessControl/app/GuardPanel.tsx` — replace guardId-based calls with JWT-authenticated calls
- MODIFY: `Frontend/SchoolAccessControl/app/GuardFacePanel.tsx` — same
- MODIFY: `Frontend/SchoolAccessControl/app/StudentPanel.tsx` — same
- DELETE: `Frontend/SchoolAccessControl/components/CustomCard.tsx` — marked "unused!!"
- MODIFY: `Frontend/SchoolAccessControl/app.json` — fix any asset path mismatches

**Implementation Details**:
1. In `services/api.ts`:
   - Replace hardcoded `https://localhost:3000` with: `Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:3000"`
   - Add request interceptor to attach JWT from `expo-secure-store`:
     ```typescript
     api.interceptors.request.use(async (config) => {
       const token = await SecureStore.getItemAsync('authToken');
       if (token) config.headers.Authorization = `Bearer ${token}`;
       return config;
     });
     ```
   - Add response interceptor for 401 → redirect to login
2. In `app/index.tsx`:
   - Replace role-string login with actual API call: `POST /auth/login { id, password }`
   - Store returned JWT in `expo-secure-store`
   - Navigate to appropriate panel based on JWT payload role
3. In AdminPanel:
   - Remove `document.addEventListener('keydown', ...)` entirely, or wrap with `Platform.OS === 'web'`
   - Remove `apiWithTeacherId` wrapper — JWT interceptor handles identity
4. In all panels:
   - Remove `apiWithGuardId` / `apiWithTeacherId` wrappers
   - Remove `committedTeacherId` / `committedGuardId` state
   - Use plain `api.get(...)` / `api.post(...)` — JWT interceptor handles auth
5. Remove `CustomCard.tsx` (marked unused)
6. Clean up the most critical TypeScript errors (focus on `any` types for API responses)

**Depends on**: Task 1 (JWT backend must exist first)
**Blocks**: Task 14 (Demo fallback needs stable frontend)

**QA Scenarios**:
1. `grep -r "document\." Frontend/SchoolAccessControl/app/ | grep -v node_modules` returns 0 results (or all guarded by Platform.OS)
2. `grep "localhost:3000" Frontend/SchoolAccessControl/services/api.ts` returns 0 (URL is configurable)
3. App starts with `npx expo start` without crashes
4. Login flow works: enter credentials → JWT stored → panel loads → API calls succeed with Bearer token
5. Removing the JWT from storage → API calls return 401 → redirect to login

---

#### Task 5B: Code Polish & Quality Hardening

**What**: Systematically fix all TypeScript errors in the frontend, add proper TypeScript interfaces for all API responses, remove dead/unused code, add JSDoc comments to key backend functions, enforce consistent code style, and remove any remaining debug artifacts. Make the codebase impressive and presentation-ready.

**Why**: The codebase will be shown in the BLL paper appendix (Task 17) and during the colloquium demo. An examiner may browse the code. TypeScript errors, `any` types, dead imports, and inconsistent formatting signal low quality. Clean, typed, well-documented code directly supports the "Inhalt" score (scientific rigor) and "Formale" score (professional presentation). This also ensures the app runs without runtime errors for the demo (25% Colloquium score).

**Files to modify**:
- MODIFY: `Frontend/SchoolAccessControl/services/api.ts` — add TypeScript interfaces for every API response type
- MODIFY: `Frontend/SchoolAccessControl/app/AdminPanel.tsx` — fix all TS errors, replace `any` with proper types
- MODIFY: `Frontend/SchoolAccessControl/app/TeacherPanel.tsx` — fix all TS errors, replace `any` with proper types
- MODIFY: `Frontend/SchoolAccessControl/app/GuardPanel.tsx` — fix all TS errors, replace `any` with proper types
- MODIFY: `Frontend/SchoolAccessControl/app/GuardFacePanel.tsx` — fix all TS errors, replace `any` with proper types
- MODIFY: `Frontend/SchoolAccessControl/app/StudentPanel.tsx` — fix all TS errors, replace `any` with proper types
- MODIFY: `Frontend/SchoolAccessControl/app/index.tsx` — fix TS errors
- MODIFY: `Frontend/SchoolAccessControl/app/_layout.tsx` — fix TS errors if any
- DELETE: `Frontend/SchoolAccessControl/components/CustomCard.tsx` — confirmed unused (if not already deleted in Task 5)
- MODIFY: `Backend/school-access-control-backend/routes/admin.js` — add JSDoc comments to exported functions
- MODIFY: `Backend/school-access-control-backend/routes/guard.js` — add JSDoc comments to exported functions
- MODIFY: `Backend/school-access-control-backend/routes/teacher.js` — add JSDoc comments
- MODIFY: `Backend/school-access-control-backend/routes/student.js` — add JSDoc comments
- MODIFY: `Backend/school-access-control-backend/routes/cards.js` — add JSDoc comments
- MODIFY: `Backend/school-access-control-backend/utils/imageProcessor.js` — add JSDoc comments
- MODIFY: `Backend/school-access-control-backend/middleware/checkAuth.js` — add JSDoc (created in Task 1)
- MODIFY: `Backend/school-access-control-backend/middleware/checkPermission.js` — add JSDoc
- VERIFY: `Backend/school-access-control-backend/models/` — remove all 5 model files if confirmed unused (accessLog.js, card.js, permission.js, student.js, teacher.js)
- CREATE: `Frontend/SchoolAccessControl/types/api.ts` — central TypeScript types file

**Implementation Details**:
1. **Create TypeScript interfaces** (`types/api.ts`):
   ```typescript
   // Types for all API responses
   export interface Student {
     id: string;
     name: string;
     class: string;
     photo?: string;
   }
   export interface Teacher {
     id: string;
     name: string;
     permissionLevel: 'teacher' | 'tutor' | 'admin';
   }
   export interface Card {
     uid: string;
     assignedTo?: string;
     active: boolean;
   }
   export interface Permission {
     id: number;
     cardUID: string;
     studentId: string;
     grantedBy: string;
     startDate: string;
     endDate: string;
     startTime: string;
     endTime: string;
     isRecurring: boolean;
     recurrencePattern?: string;
     reason: string;
   }
   export interface AccessLog {
     id: number;
     direction: string;
     student: string;
     card: string;
     wasApproved: boolean;
     timestamp: string;
     verified_by?: string;
   }
   export interface ValidationResponse {
     valid: boolean;
     student?: Student;
     permissions?: Permission[];
     message?: string;
   }
   export interface FaceVerificationResponse {
     match: boolean;
     similarity: number;
     distance: number;
     threshold: number;
   }
   export interface LoginResponse {
     token: string;
     user: { id: string; role: string; permissions: string[]; };
   }
   ```

2. **Fix TypeScript errors across all panel files**:
   - Replace all `any` type annotations with proper interfaces from `types/api.ts`
   - Add proper typing to `useState` hooks: `useState<Student | null>(null)` instead of `useState(null)`
   - Type all event handler parameters (e.g., `(e: React.ChangeEvent<HTMLInputElement>)`)
   - Fix missing return types on async functions
   - Add proper error typing in catch blocks: `catch (error: unknown)` with type guards
   - Fix any `@ts-ignore` or `@ts-expect-error` comments — replace with proper typing

3. **Remove dead code**:
   - Delete `components/CustomCard.tsx` (marked "unused!!" in the file itself)
   - Check if `Backend/school-access-control-backend/models/` files are imported anywhere — if unused, delete all 5 files
   - Remove any commented-out code blocks (already partially addressed in Task 3)
   - Remove unused imports in all frontend files

4. **Add JSDoc to backend**:
   Each route handler and utility function should have a JSDoc comment:
   ```javascript
   /**
    * Validates a card swipe and returns student info + active permissions.
    * @route POST /guard/validate
    * @param {string} req.body.cardUID - The RFID card UID
    * @returns {{ valid: boolean, student?: object, permissions?: object[] }}
    */
   router.post('/validate', checkAuth(db, ['VALIDATE_SWIPE']), async (req, res) => {
   ```
   Focus on: route handlers (all 5 route files), `imageProcessor.js` functions, middleware functions

5. **Code formatting consistency**:
   - Ensure consistent semicolons, quotes (single for JS, as per existing codebase pattern)
   - Ensure consistent indentation (2 spaces, as per existing pattern)
   - If a `.prettierrc` or `.eslintrc` exists, use it; if not, create a minimal `.prettierrc` in both Backend and Frontend roots:
     ```json
     { "semi": true, "singleQuote": true, "tabWidth": 2, "trailingComma": "es5" }
     ```
   - Run `npx prettier --write .` in both Backend and Frontend directories

6. **Remove debug artifacts**:
   - Remove `setInterval` memory logger in `server.js` (if not already done in Task 3)
   - Remove any `alert()` calls in frontend code
   - Remove any `debugger` statements
   - Ensure no `console.warn` spam in frontend (only keep critical warnings)

**Depends on**: Task 1 (checkAuth.js must exist for JSDoc), Task 3 (console.log cleanup done first), Task 5 (auth integration done first so types match)
**Blocks**: Task 17 (code snippets in appendix should show clean code), Task 19 (final git tag should be polished)

**QA Scenarios**:
1. `cd Frontend/SchoolAccessControl && npx tsc --noEmit 2>&1 | grep 'error' | wc -l` returns 0 (zero TypeScript errors)
2. `grep -r 'any' Frontend/SchoolAccessControl/app/*.tsx Frontend/SchoolAccessControl/services/api.ts | grep -v node_modules | wc -l` returns at most 5 (minimal `any` usage)
3. `ls Frontend/SchoolAccessControl/types/api.ts` exists with all interfaces defined
4. `grep -r '@param\|@returns\|@route' Backend/school-access-control-backend/routes/*.js | wc -l` returns at least 15 (JSDoc coverage)
5. `ls Frontend/SchoolAccessControl/components/CustomCard.tsx 2>/dev/null` returns nothing (deleted)
6. `npx prettier --check .` passes in both Backend and Frontend (or formatting is consistent)
7. `npx expo start` launches without TypeScript compilation errors
8. All backend model files in `models/` are either properly used or deleted

---

#### Task 6: LaTeX Paper — Methodik und Umsetzung

**What**: Write the methodology and implementation chapter (Section 4) describing the system architecture, technology choices, and implementation details.

**Why**: This is the core technical chapter — directly scores on Inhalt (40%) for "subject-specific correctness" and "scientific/propaedeutic level". Must demonstrate engineering depth.

**Files to modify**:
- MODIFY: `BLL-LaTeX/sections/04_methodik_und_umsetzung.tex` — write full chapter (4-5 pages)

**Implementation Details**:
Structure the chapter as:
1. **Systemarchitektur** (~1 page):
   - Client-Server architecture diagram (reference figure from Task 7)
   - Backend: Express.js + SQLite, route-based API
   - Frontend: React Native + Expo (cross-platform)
   - AI: TensorFlow.js + face-api server-side
   - Explain the decoupled design (heavy processing on server, lightweight client)

2. **RFID-Kartenmanagement** (~1 page):
   - Card UID as unique identifier (no data stored on card = privacy)
   - Permission model: cards → permissions → students → teachers
   - Recurring permissions (isRecurring + recurrencePattern)
   - Role-based access control (student < guard < teacher < tutor < admin)
   - JWT authentication flow

3. **Gesichtserkennungs-Pipeline** (~1.5 pages):
   - Image normalization: HEIC → PNG conversion (the "iPhone Problem"), resize to 1024×1024
   - Face detection: SSD MobileNet v1 (why this model — lightweight, fast, server-side)
   - Face landmark detection: 68-point landmarks
   - Face descriptor: 128-dimensional feature vector
   - Matching: Euclidean distance, threshold 0.6, similarity = (1-distance)×100
   - Memory management: buffer cleanup, periodic GC

4. **Datenbankdesign** (~0.5 page):
   - 5 tables: cards, permissions, students, teachers, accessLogs
   - Key relationships (foreign keys, JOINs)
   - SQLite choice rationale (local, no external server, simple deployment)

5. **Datenschutzkonzept** (~0.5 page):
   - Local-only architecture: no biometric data leaves the device/server
   - HTTPS 2.0 TLS encryption
   - No data stored on RFID cards
   - Access logs for accountability

Source material: `README.md` (architecture), `Doku.md`/`DokuDeutsch.md` (implementation details), actual code (`guard.js`, `imageProcessor.js`, `server.js`)

**Depends on**: Task 4 (needs theoretical foundation established)
**Blocks**: Task 9 (evaluation references methodology)

**QA Scenarios**:
1. Section compiles without errors: `cd BLL-LaTeX && latexmk -pdf main.tex`
2. At least 2 `\cite{}` references to theoretical sources
3. At least 1 figure reference (`\ref{fig:...}`) to architecture diagram
4. All 5 subsections present with actual prose
5. Code snippets (if included) use `\lstlisting` or `minted` environment

---

#### Task 7: Create Figures & Diagrams for Paper

**What**: Create all figures needed for the LaTeX paper: system architecture diagram, face recognition pipeline, database schema, RFID workflow, and benchmark result charts (placeholder for now).

**Why**: BLL Formale (10%) requires `\listoffigures`. Figures dramatically improve Aufbau (15%) by making the "Roter Faden" visual. No figures currently exist in the LaTeX project.

**Files to create/modify**:
- CREATE: `BLL-LaTeX/figures/` directory
- CREATE: `BLL-LaTeX/figures/systemarchitektur.pdf` (or .png) — overall system architecture
- CREATE: `BLL-LaTeX/figures/gesichtserkennung_pipeline.pdf` — face recognition flow
- CREATE: `BLL-LaTeX/figures/datenbankschema.pdf` — ER diagram of 5 tables
- CREATE: `BLL-LaTeX/figures/rfid_workflow.pdf` — card validation sequence diagram
- CREATE: `BLL-LaTeX/figures/benchmark_placeholder.pdf` — placeholder for benchmark results (filled in Task 9)
- MODIFY: LaTeX section files to include `\includegraphics` commands

**Implementation Details**:
1. Convert existing mermaid diagrams from the repo (`.mermaid` files, inline in `Doku.md`) to PDF:
   - Use `mmdc` (mermaid CLI) or export from mermaid.live
   - The sequence diagram in `README.md` is a good starting point for the RFID workflow
2. Create new diagrams where needed:
   - System architecture: 3-tier diagram (Mobile App → REST API → SQLite + TensorFlow)
   - Face recognition pipeline: flowchart (Image Input → HEIC check → Resize → Detect Face → Extract Descriptor → Euclidean Distance → Match/No Match)
   - Database schema: ER diagram showing cards, permissions, students, teachers, accessLogs with relationships
3. Export all diagrams as PDF (vector) for best quality in LaTeX
4. Add `\usepackage{graphicx}` to main.tex (probably already there)
5. In each relevant section, add figure environments:
   ```latex
   \begin{figure}[htbp]
     \centering
     \includegraphics[width=0.8\textwidth]{figures/systemarchitektur.pdf}
     \caption{Gesamtarchitektur des Zugangskontrollsystems}
     \label{fig:architecture}
   \end{figure}
   ```

**Depends on**: Nothing (can start parallel, but best after Task 4 establishes what figures are needed)
**Blocks**: Task 6 (references figures), Task 9 (benchmark charts)

**QA Scenarios**:
1. `ls BLL-LaTeX/figures/*.pdf | wc -l` returns at least 4
2. `grep -c "includegraphics" BLL-LaTeX/sections/*.tex` returns at least 4
3. `cd BLL-LaTeX && latexmk -pdf main.tex` compiles without "missing file" warnings for figures
4. `\listoffigures` in compiled PDF shows at least 4 entries

---

### Wave 3: Evaluation & Interdisciplinary (After Wave 2)

---

#### Task 8: Benchmark Script & Data Collection

**What**: Create benchmark scripts to test face recognition accuracy and latency on Raspberry Pi vs Oracle VPS. Collect real empirical data for the paper.

**Why**: BLL Inhalt (40%) requires empirical evidence. The Leitfrage asks about feasibility — benchmarks prove it. Hypotheses H1 (latency <2s) and H2 (accuracy ≥90%) need data.

**Files to create/modify**:
- CREATE: `Backend/school-access-control-backend/benchmarks/` directory
- CREATE: `Backend/school-access-control-backend/benchmarks/benchmark_face.js` — face recognition benchmark
- CREATE: `Backend/school-access-control-backend/benchmarks/benchmark_rfid.js` — RFID validation latency benchmark
- CREATE: `Backend/school-access-control-backend/benchmarks/test_images/` — test face images (pairs: same person + different person)
- CREATE: `Backend/school-access-control-backend/benchmarks/results/` — output directory for CSV/JSON results

**Implementation Details**:
1. `benchmark_face.js`:
   - Load face-api models
   - For each test image pair:
     - Measure time to process image (HEIC conversion if applicable)
     - Measure time for face detection
     - Measure time for descriptor extraction
     - Measure time for distance computation
     - Record: total latency, similarity score, match result (true/false positive/negative)
   - Output CSV: `image_pair,latency_ms,similarity,distance,match,expected_match,correct`
   - Run 10+ iterations per pair for statistical significance
   - Environment metadata: Node version, hardware (CPU/RAM), timestamp

2. `benchmark_rfid.js`:
   - Simulate RFID card validation requests:
     - POST to `/guard/validate` with known card UIDs
     - Measure response time (start to response)
   - Test with valid cards, invalid cards, expired permissions
   - Output CSV: `card_uid,valid,latency_ms,permissions_found`

3. Test image preparation:
   - Need at least 5 pairs of matching faces (same person, different photos)
   - Need at least 5 pairs of non-matching faces (different people)
   - Use student photos already in the system or add test photos
   - Vary conditions: different lighting, angles (if possible)

4. Run on both platforms and save results:
   - Raspberry Pi: `node benchmarks/benchmark_face.js > benchmarks/results/rpi_face.csv`
   - Oracle VPS: same script, save to `benchmarks/results/vps_face.csv`
   - Document hardware specs for each

**Depends on**: Task 2 (schema must be fixed), Task 1 (auth must work for API calls)
**Blocks**: Task 9 (evaluation chapter needs this data)

**QA Scenarios**:
1. `node benchmarks/benchmark_face.js` runs without errors and produces CSV output
2. CSV has at least 10 rows of data per platform
3. Results include both true positives and true negatives
4. Environment metadata is recorded (Node version, hardware)
5. Results are committed to `benchmarks/results/`

---

#### Task 9: LaTeX Paper — Ergebnisse und Evaluation

**What**: Write the results and evaluation chapter using real benchmark data from Task 8. Include tables, charts, and statistical analysis.

**Why**: This chapter directly addresses the Leitfrage and tests the hypotheses. It's the heart of the BLL Inhalt (40%) score.

**Files to modify**:
- MODIFY: `BLL-LaTeX/sections/05_ergebnisse_und_evaluation.tex` — write full chapter (3-4 pages)
- MODIFY: `BLL-LaTeX/figures/` — add benchmark result charts

**Implementation Details**:
Structure:
1. **Versuchsaufbau** (~0.5 page):
   - Describe test environment: Raspberry Pi specs, VPS specs, network setup
   - Test image set description (how many, what conditions)
   - Methodology: number of iterations, what was measured

2. **Ergebnisse RFID-Validierung** (~0.5 page):
   - Table: card validation latency (mean, median, stddev, min, max)
   - Compare RPi vs VPS
   - Test H1: "unter 2 Sekunden" → confirm/deny with data

3. **Ergebnisse Gesichtserkennung** (~1.5 pages):
   - Confusion matrix: TP, TN, FP, FN
   - Accuracy, Precision, Recall, F1-Score
   - Table: face recognition latency breakdown (detection, descriptor, matching)
   - Chart: Euclidean distance distribution for matching vs non-matching pairs
   - Compare RPi vs VPS performance
   - Test H2: "mindestens 90% Genauigkeit" → confirm/deny with data
   - Analyze threshold sensitivity (what happens at 0.5, 0.6, 0.7?)

4. **Leistungsvergleich lokal vs. Cloud** (~0.5 page):
   - Side-by-side comparison table: RPi vs VPS
   - Latency difference, accuracy difference
   - Argument: local is slower but privacy-preserving → acceptable tradeoff

5. **Diskussion** (~0.5 page):
   - Interpret results in context of Leitfrage
   - Limitations: small test set, controlled conditions, specific hardware
   - How results compare to literature (face-api documented accuracy)

Use LaTeX `tabular` for tables, `pgfplots` or included chart images for graphs.
Every hypothesis must be explicitly addressed with data.

**Depends on**: Task 8 (needs benchmark data), Task 6 (builds on methodology)
**Blocks**: Task 12 (conclusion summarizes results)

**QA Scenarios**:
1. Section compiles without errors
2. At least 2 tables present (latency comparison, accuracy metrics)
3. At least 1 chart/figure (distance distribution or latency comparison)
4. All 3 hypotheses (H1, H2, H3) explicitly tested with data references
5. `\cite{}` references to face-api documentation and RFID standards

---

#### Task 10: LaTeX Paper — Interdisciplinary Chapter (Law/GDPR/Ethics)

**What**: Expand the theoretical background or add a dedicated subsection addressing the interdisciplinary aspects: GDPR compliance, ethical considerations of biometric surveillance in schools, and organizational impact.

**Why**: BLL Inhalt (40%) explicitly rewards "interdisciplinary contributions (law/ethics/org/economics)". This is where many BLL submissions fall short. The Leitfrage includes "datenschutzkonform" — this must be substantiated.

**Files to modify**:
- MODIFY: `BLL-LaTeX/sections/03_theoretischer_hintergrund.tex` — expand GDPR section, OR
- MODIFY: `BLL-LaTeX/sections/04_methodik_und_umsetzung.tex` — add Datenschutzkonzept subsection
- MODIFY: `BLL-LaTeX/references.bib` — add legal references

**Implementation Details**:
This can be woven into the existing chapters or be a standalone subsection. Recommended: expand in `03_theoretischer_hintergrund.tex` under "Rechtlicher Rahmen" and reference it in `04_methodik_und_umsetzung.tex` under "Datenschutzkonzept".

Content to cover (~2 pages total):
1. **DSGVO und biometrische Daten**:
   - Art. 9 DSGVO: biometric data = special category of personal data
   - Art. 6 & Art. 9(2): legal bases for processing (consent, vital interest, public interest)
   - How the system complies: local processing, no cloud transfer, data minimization
   - Comparison: what would happen if data were sent to cloud (Art. 44-49 DSGVO, international transfers)

2. **Ethische Betrachtung**:
   - Surveillance in schools: balancing security vs. student privacy
   - Proportionality principle: is face recognition proportionate for school exit control?
   - Student agency: opt-in vs opt-out, what happens if a student refuses face scan (fallback to manual check)
   - Age-specific considerations: minors' data, parental consent

3. **Organisatorische Auswirkungen**:
   - Impact on school staff: reduced workload for Wachpersonal, but new tech maintenance needs
   - Training requirements for guards and teachers
   - Cost considerations: Raspberry Pi + RFID readers vs. commercial systems

Add to `references.bib`:
- DSGVO full text (EUR-Lex)
- Landesdatenschutzgesetz (state-specific)
- Publications on biometric data in educational settings
- BfDI (Bundesbeauftragter für den Datenschutz) guidelines

**Depends on**: Task 4 (theoretical background exists)
**Blocks**: Task 11 (reflection references interdisciplinary work)

**QA Scenarios**:
1. DSGVO articles cited with proper `\cite{}` references
2. At least 3 new legal/ethical references in `references.bib`
3. Ethical consideration section exists with at least 2 paragraphs
4. The word "DSGVO" or "Datenschutz" appears at least 5 times across the paper

---

### Wave 4: Reflection, Conclusion & Demo (After Wave 3)

---

#### Task 11: LaTeX Paper — Reflexion Arbeitsprozess

**What**: Write the reflection chapter documenting the work process, challenges, pivots, and personal learning.

**Why**: BLL Arbeitsprozess (10%) is dedicated to this chapter. Must show independent thinking, methodological learning, and honest reflection on setbacks.

**Files to modify**:
- MODIFY: `BLL-LaTeX/sections/06_reflexion_arbeitsprozess.tex` — write full chapter (2-3 pages)

**Implementation Details**:
Structure:
1. **Projektgenese und Eigeninitiative** (~0.5 page):
   - How the idea originated (real problem at school, Idea.md)
   - Conversations with school security, secretariat (from speech.md)
   - Decision to enter Jugend Forscht
   - JuFo result: 1st Prize Regional + Special National Prize for Digitalization

2. **Technische Herausforderungen** (~1 page):
   - The "iPhone Problem" (HEIC images) — discovered during testing, solved with heic-convert
   - Memory management with TensorFlow.js in Node.js — buffer cleanup, GC calls
   - Face recognition threshold tuning — why 0.6? What happened at other values?
   - SQLite vs PostgreSQL decision — chose simplicity for local deployment
   - Native binding issues with tfjs-node across Node versions

3. **Methodische Erkenntnisse** (~0.5 page):
   - What would be done differently with more time
   - Importance of pinning runtime versions
   - Value of automated testing (which the project lacks — honest admission)
   - Iterative development: 296 commits showing incremental growth

4. **Persönliche Entwicklung** (~0.5 page):
   - Skills gained: full-stack development, ML/AI integration, security design
   - Understanding of privacy law (DSGVO)
   - Project management for a complex system

Source material: Git history (296 commits), `TODO` file (completed/pending items), `speech.md`, `README.md` challenges section

**Depends on**: Tasks 4, 6 (paper structure must exist to reflect on it)
**Blocks**: Task 12 (conclusion builds on reflection)

**QA Scenarios**:
1. Chapter is at least 2 pages of actual prose
2. At least 3 specific technical challenges described
3. Honest admission of at least 1 limitation or mistake
4. Personal development section exists
5. JuFo competition mentioned with results

---

#### Task 12: LaTeX Paper — Fazit und Ausblick

**What**: Write the conclusion answering the Leitfrage based on evidence, and outline future work.

**Why**: Closes the "Roter Faden" (Aufbau 15%). Must directly answer the Leitfrage using evidence from the evaluation chapter.

**Files to modify**:
- MODIFY: `BLL-LaTeX/sections/07_fazit_und_ausblick.tex` — write full chapter (1.5-2 pages)

**Implementation Details**:
Structure:
1. **Zusammenfassung der Ergebnisse** (~0.5 page):
   - Restate Leitfrage
   - Summarize key findings from evaluation (H1, H2, H3 results)
   - One-sentence answer to the Leitfrage

2. **Beantwortung der Leitfrage** (~0.5 page):
   - Detailed answer: Yes/No/Partially — with evidence references
   - "Sicher": RFID + face verification dual-factor approach proven to work with X% accuracy
   - "Datenschutzkonform": Local processing demonstrated, DSGVO requirements analyzed and met
   - "Vollautomatisiert": End-to-end flow from card tap to access decision without human intervention (except face verification as optional step)

3. **Ausblick** (~0.5 page):
   - Live video recognition (currently static images)
   - PostgreSQL for multi-school deployment
   - Anti-spoofing measures (liveness detection)
   - Integration with school information systems
   - Potential for other environments (offices, events)

**Depends on**: Task 9 (evaluation results), Task 11 (reflection)
**Blocks**: Task 15 (Thesenpapier draws from conclusion)

**QA Scenarios**:
1. Leitfrage appears verbatim in the conclusion
2. Each hypothesis (H1, H2, H3) is explicitly addressed
3. Ausblick contains at least 3 future work items
4. Chapter is at least 1.5 pages

---

#### Task 13: Bibliography & Formal Compliance

**What**: Ensure all formal BLL requirements are met: complete bibliography, consistent citations, figure/table indices, declaration of originality, proper formatting.

**Why**: BLL Formale (10%). Missing or inconsistent citations, absent declaration, or formatting issues cost easy points.

**Files to modify**:
- MODIFY: `BLL-LaTeX/references.bib` — ensure all cited sources have entries (target: 15-20 references)
- MODIFY: `BLL-LaTeX/main.tex` — verify all formal elements present
- MODIFY: `BLL-LaTeX/sections/10_selbststaendigkeitserklaerung.tex` — fill in name, date, location
- MODIFY: `BLL-LaTeX/sections/09_unterstuetzungsleistungen.tex` — declare any AI tool usage, external help
- VERIFY: Page margins (3cm left, 4cm right, 2.5cm top/bottom — already in main.tex)
- VERIFY: Font size 12pt, 1.5 line spacing (already in main.tex)
- VERIFY: Roman numerals for front matter, Arabic for main text

**Implementation Details**:
1. Bibliography audit:
   - Grep all `\cite{}` commands across all .tex files
   - Verify each cited key exists in `references.bib`
   - Add missing entries
   - Target: 15-20 references including:
     - DSGVO/legal texts (3-4)
     - TensorFlow.js, face-api.js documentation (2-3)
     - RFID/NFC standards (1-2)
     - Computer science textbooks (2-3)
     - School security papers/articles (2-3)
     - React Native/Expo documentation (1-2)
2. Run `biber main` to check for warnings about missing references
3. Fill in Selbständigkeitserklärung with actual name, date, signature placeholder
4. Fill in Unterstützungsleistungen — IMPORTANT: if AI tools were used during development, declare them honestly (this is a rubric requirement)
5. Verify `\listoffigures` and `\listoftables` produce non-empty output
6. Check page count: core text should be 15-20 pages (sections 02-07)

**Depends on**: Tasks 4, 6, 9, 10, 11, 12 (all content chapters must be written)
**Blocks**: Task 18 (final compilation)

**QA Scenarios**:
1. `biber main` produces no "missing reference" warnings
2. `references.bib` has 15+ entries
3. Every `\cite{}` in .tex files resolves to a bib entry
4. Selbständigkeitserklärung has name and date filled in
5. Core text (sections 02-07) is 15-20 pages
6. `\listoffigures` shows entries, `\listoftables` shows entries

---

#### Task 14: Demo Fallback Mode

**What**: Add a hidden developer toggle in the React Native app to simulate RFID scans and face verification for the colloquium presentation, in case hardware/network fails.

**Why**: Metis guardrail: live demo failure = risk to 25% Colloquium score. A mock mode ensures the presentation succeeds regardless of hardware.

**Files to modify**:
- MODIFY: `Frontend/SchoolAccessControl/app/GuardPanel.tsx` — add mock mode toggle
- MODIFY: `Frontend/SchoolAccessControl/app/GuardFacePanel.tsx` — add mock face verification
- CREATE: `Frontend/SchoolAccessControl/utils/mockData.ts` — mock responses for demo

**Implementation Details**:
1. Create `mockData.ts` with:
   - Mock student data (name, photo, class)
   - Mock validation response (valid=true, permissions list)
   - Mock face verification response (match=true, similarity=94.5)
2. In GuardPanel, add a hidden toggle (e.g., long-press on title 5 times → enables mock mode):
   - When mock mode is on, card validation returns mock data instead of API call
   - Visual indicator (small "DEMO" badge) so you know it's mock
3. In GuardFacePanel, same approach:
   - Mock mode shows a pre-recorded verification animation
   - Returns mock similarity score
4. Mock mode should be obvious but not distracting during the presentation

**Depends on**: Task 5 (frontend must be stable)
**Blocks**: Nothing (nice-to-have for colloquium safety)

**QA Scenarios**:
1. Long-press on title activates mock mode (small "DEMO" indicator appears)
2. In mock mode, card validation returns success without API call
3. In mock mode, face verification shows match with 94.5% similarity
4. Disabling mock mode returns to real API calls
5. Mock mode is not accidentally triggered during normal use

---

### Wave 5: Colloquium Preparation (After Wave 4)

---

├── Task 15: Thesenpapier (4-6 theses with evidence anchors) [x]

**What**: Write the 1-2 page Thesenpapier with 4-6 assertive, debatable theses derived from the paper's findings, each linked to evidence.

**Why**: The Thesenpapier is required for the colloquium and drives the defense discussion. Quality theses = strong Colloquium score (25%).

**Files to modify**:
- MODIFY: `BLL-LaTeX/thesenpapier/thesenpapier.tex` — write complete Thesenpapier

**Implementation Details**:
Format (from BLL_COLLOQUIUM_PREP.md):
- Header: Name, Fach, Thema, Datum
- 4-6 theses, each:
  - Assertive statement (not a question)
  - Debatable (reasonable people could disagree)
  - Backed by evidence from the paper
  - With a brief evidence anchor (1-2 sentences)

Suggested theses:
1. "Passive RFID-Technologie bietet für die schulische Zugangskontrolle ein besseres Verhältnis von Sicherheit zu Datenschutz als aktive biometrische Identifikation allein."
   → Evidence: No data on card, dual-factor with optional face check

2. "Lokale KI-Gesichtserkennung mit SSD MobileNet v1 ist für den Schulkontext ausreichend genau, aber nicht für sicherheitskritische Anwendungen geeignet."
   → Evidence: Benchmark results (accuracy, false positive rate)

3. "Die vollständig lokale Verarbeitung biometrischer Daten macht eine Einwilligung nach Art. 9 DSGVO handhabbar, da keine Datenübertragung an Dritte stattfindet."
   → Evidence: Architecture analysis, DSGVO article comparison

4. "Ein Open-Source-Zugangskontrollsystem auf Basis von Standardhardware (Raspberry Pi, RFID-Reader) kann kommerzielle Lösungen in Bildungseinrichtungen wirtschaftlich ersetzen."
   → Evidence: Cost comparison (if available), hardware specs

5. "Die Kombination von kartenbasierter Authentifizierung und biometrischer Verifikation bietet eine dem Schulkontext angemessene Zwei-Faktor-Sicherheit."
   → Evidence: Workflow analysis, security model description

**Depends on**: Tasks 9, 12 (needs evaluation results and conclusion)
**Blocks**: Task 16 (presentation references theses)

**QA Scenarios**:
1. `cd BLL-LaTeX/thesenpapier && latexmk -pdf thesenpapier.tex` compiles
2. Contains 4-6 numbered theses
3. Each thesis has an evidence anchor
4. Theses are assertive statements (not questions)
5. At least 2 theses are genuinely debatable

---

#### Task 16: Colloquium Presentation Preparation

**What**: Create a 10-minute presentation outline and prepare defense responses for the oral colloquium.

**Why**: Colloquium is 25% of the grade. Presentation + defense must be practiced and structured.

**Files to create**:
- CREATE: `.sisyphus/drafts/colloquium-presentation-outline.md` — presentation structure and talking points
- This is guidance for the user, not a file the system creates

**Implementation Details**:
Presentation structure (10 minutes):
1. **Motivation** (2 min): School access problem, why current methods fail
2. **Leitfrage** (0.5 min): State the research question
3. **System Demo** (3 min): Live or mock demo of card scan → validation → face verification
4. **Key Results** (2.5 min): Benchmark data, accuracy metrics, latency comparison
5. **GDPR Analysis** (1 min): Why local processing matters
6. **Conclusion** (1 min): Answer to Leitfrage, future work

Defense preparation (from BLL_COLLOQUIUM_PREP.md):
- Use "Answer Framework": Position → Evidence → Limitation → Implication
- Prepare answers for:
  - "Warum haben Sie X statt Y gewählt?" (tech choices)
  - "Was sind die Schwächen Ihres Systems?" (honest limitations)
  - "Wie skaliert das System?" (future considerations)
  - "Was haben Sie persönlich gelernt?" (reflection)
  - "Wie gehen Sie mit False Positives um?" (security implications)

**Depends on**: Tasks 12, 15 (paper complete, theses written)
**Blocks**: Nothing
├── Task 16: Colloquium Presentation Prep [x]
**QA Scenarios**:
1. Presentation outline exists with 6 sections and timing
2. At least 5 anticipated defense questions with prepared answers
3. Demo flow documented (steps to show, fallback plan)

---

#### Task 17: Appendices (Reproducibility + Materials)

**What**: Write the appendix sections: reproducibility guide and supplementary materials.

**Why**: BLL Formale (10%) and Inhalt (40%) both benefit from reproducibility evidence. Shows scientific rigor.

**Files to modify**:
- MODIFY: `BLL-LaTeX/sections/A_anhang_materialien.tex` — supplementary materials
- MODIFY: `BLL-LaTeX/sections/B_anhang_reproduzierbarkeit.tex` — reproducibility guide

**Implementation Details**:
1. **Anhang A: Materialien**:
   - Selected code snippets (not full code — just key algorithms):
     - Face recognition matching function (distance calculation)
     - HEIC conversion pipeline
     - JWT authentication middleware
   - Database schema (CREATE TABLE statements)
   - API endpoint list (method, path, description)
   - Screenshots of the app (each panel)

2. **Anhang B: Reproduzierbarkeit**:
   - Hardware requirements (Raspberry Pi model, RFID reader model, camera)
   - Software requirements (Node 22.x, npm packages with versions)
   - Installation steps:
     ```
     git clone <repo>
     cd Backend/school-access-control-backend
     npm install
     npm rebuild @tensorflow/tfjs-node --build-from-source
     cp .env.example .env  # fill in JWT_SECRET
     node server.js
     ```
   - How to run benchmarks
   - Expected output
   - Git commit hash of the submitted version

**Depends on**: All prior tasks (needs final code state)
**Blocks**: Task 18 (final compilation)

**QA Scenarios**:
1. Both appendix sections have actual content (not placeholders)
2. Reproducibility guide includes: hardware list, software versions, install commands, run commands
3. At least 3 code snippets in Anhang A
4. At least 1 screenshot included

---

### Final Verification Wave

---

#### Task 18: Full LaTeX Compilation & Review

**What**: Final compilation of the complete BLL paper. Fix any LaTeX warnings, verify page count, check cross-references, ensure no placeholder brackets remain.

**Files to verify**:
- ALL files in `BLL-LaTeX/sections/`
- `BLL-LaTeX/main.tex`
- `BLL-LaTeX/references.bib`
- `BLL-LaTeX/thesenpapier/thesenpapier.tex`

**Implementation Details**:
1. Run `cd BLL-LaTeX && latexmk -pdf main.tex` — must compile cleanly
2. Run `biber main` — no missing reference warnings
3. Check for remaining placeholder text: `grep -r "\[" sections/*.tex` looking for bracketed placeholders
4. Verify page count: core text (sections 02-07) should be 15-20 pages
5. Verify `\listoffigures` and `\listoftables` are non-empty
6. Check cross-references: no "??" in compiled PDF
7. Compile thesenpapier: `cd thesenpapier && latexmk -pdf thesenpapier.tex`
8. Visual review of PDF for formatting issues

**Depends on**: Tasks 4, 6, 7, 9, 10, 11, 12, 13, 15, 17
**Blocks**: Task 20 (submission)

**QA Scenarios**:
1. `latexmk -pdf main.tex` exits with 0 (no fatal errors)
2. `grep -c "\[.*\.\.\.\]" BLL-LaTeX/sections/*.tex` returns 0 (no placeholders)
3. PDF page count for core text is 15-20 pages
4. No "??" in rendered PDF (all references resolve)
5. `biber main` has 0 warnings about missing keys

---

#### Task 19: Code Packaging & Final Git Tag

**What**: Clean up the repository, ensure all files are committed, create a final git tag for the BLL submission.

**Files to verify/modify**:
- VERIFY: All changes committed
- VERIFY: `.gitignore` excludes secrets, build artifacts
- VERIFY: No TODO/FIXME comments remaining in production code
- CREATE: `.env.example` (template without actual secrets)
- CREATE: Git tag `v1.0-BLL` on final commit

**Implementation Details**:
1. Run `git status` — ensure working directory is clean
2. Run `grep -r "TODO\|FIXME" Backend/ Frontend/ --include="*.js" --include="*.ts" --include="*.tsx"` — fix or document remaining TODOs
3. Ensure `.env` is NOT in git history (if it was committed, note this as a known issue)
4. Create `.env.example` with placeholder values
5. Create final tag: `git tag -a v1.0-BLL -m "BLL submission version - March 2026"`
6. Verify the tagged version builds and runs correctly

**Depends on**: Tasks 1-3, 5, 5B, 14 (all code changes complete)
**Blocks**: Task 20 (submission)

**QA Scenarios**:
1. `git status` shows clean working directory
2. `git tag | grep BLL` shows the tag
3. `grep -r "console.log" Backend/school-access-control-backend/routes/ | grep -v node_modules | wc -l` returns 0
4. `.env.example` exists with placeholder values
5. `node Backend/school-access-control-backend/server.js` starts without errors from the tagged commit

---

#### Task 20: Submission Package Assembly

**What**: Assemble the final submission package: printed PDF, digital copy, USB/ZIP with code, thesenpapier.

**Implementation Details**:
1. Final PDF: `BLL-LaTeX/main.pdf` — print and bind
2. Thesenpapier: `BLL-LaTeX/thesenpapier/thesenpapier.pdf` — separate document
3. Digital submission:
   - ZIP archive containing: code repository (without node_modules), compiled PDFs, benchmark results
   - Or USB stick with same contents
4. Checklist (from BLL_CHECKLISTS_AND_TEMPLATES.md):
   - [ ] Written BLL paper (printed, bound)
   - [ ] Thesenpapier (separate document)
   - [ ] Selbständigkeitserklärung (signed)
   - [ ] Digital copy of code
   - [ ] Benchmark data
   - [ ] All figures/diagrams

**Depends on**: Tasks 18, 19
**Blocks**: Nothing — this is the final deliverable

**QA Scenarios**:
1. `main.pdf` exists and is non-zero size
2. `thesenpapier.pdf` exists and is non-zero size
3. ZIP/USB contains: code, PDFs, benchmark results
4. Selbständigkeitserklärung is signed (manual step)

---

## Rubric Checklist (Cross-Reference)

### Inhalt (40%)
- [ ] Leitfrage stated in Einleitung ← Task 4
- [ ] 3 testable hypotheses formulated ← Task 4
- [ ] Method comparison (RFID vs alternatives) ← Task 4, 6
- [ ] Interdisciplinary (GDPR, ethics) ← Task 10
- [ ] Empirical evidence (benchmarks) ← Tasks 8, 9
- [ ] Originality demonstrated ← Tasks 6, 11
- [ ] Code quality supports technical depth claims ← Task 5B

### Aufbau (15%)
- [ ] "Roter Faden" — each chapter logically connects ← All writing tasks
- [ ] Results justified by presented evidence only ← Task 9
- [ ] Clear separation of theory/method/results ← Tasks 4, 6, 9

### Arbeitsprozess (10%)
- [ ] Dedicated reflection chapter ← Task 11
- [ ] Setbacks and pivots documented ← Task 11
- [ ] Independent contribution evident ← Task 11

### Formale (10%)
- [ ] Consistent citations (authoryear) ← Task 13
- [ ] Abstract present ← Task 4
- [ ] Table of contents ← main.tex (automatic)
- [ ] List of figures ← Task 7 + main.tex
- [ ] List of tables ← Tasks 9 + main.tex
- [ ] Declaration of originality ← Task 13
- [ ] 15-20 pages core text ← Task 18
- [ ] Clean, polished codebase (zero TS errors, JSDoc, no dead code) ← Task 5B

### Colloquium (25%)
- [ ] Thesenpapier (4-6 theses) ← Task 15
- [ ] 10-minute presentation ← Task 16
- [ ] Defense preparation ← Task 16
- [ ] Demo ready (with fallback) ← Tasks 5, 5B, 14
