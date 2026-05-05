
## Database Schema Fixes (Task 2: Wave 1)

### Decision: Add verified_by and createdAt columns
- Added `verified_by TEXT FOREIGN KEY` column to `accessLogs` table
- Added `createdAt DATETIME DEFAULT CURRENT_TIMESTAMP` column to `permissions` table
- Both columns are now in server.js CREATE TABLE statements with ALTER TABLE fallbacks for existing databases

### Rationale
- Task 1 already updated guard.js to insert `verified_by` into accessLogs, so the schema must match
- The commented fallback query in guard.js line 188 references `p.createdAt`, so permissions table needs this column
- Fallback ALTER TABLE statements ensure existing databases are updated when server restarts

### Implementation
- Modified `server.js` lines 46-74: Added `createdAt DATETIME DEFAULT CURRENT_TIMESTAMP` to permissions table with ALTER TABLE fallback
- Modified `server.js` lines 140-165: Added `verified_by TEXT FOREIGN KEY` to accessLogs table with ALTER TABLE fallback
- guard.js already correctly inserts `verified_by` in both endpoints (line 96 and line 316)
- No changes needed to teacher.js

### Verification
- Confirmed both INSERT statements in guard.js match new schema (lines 93-96, 312-316)
- Verified with sqlite3: verified_by column exists in accessLogs
- Verified with sqlite3: createdAt column exists in permissions
- Manual INSERT test successful: both columns accept values and populate correctly


## Console Logging Strategy (Task 3: Backend Cleanup)

### Decision: Debug-Gated Pattern Over Removal
**NOT** to remove console.logs entirely, but to gate them behind development checks:
- Keeps debugging capability during development
- Completely silent in production
- Cleaner than blanket removal

### Implementation
```javascript
const debug = process.env.NODE_ENV === 'development';
if (debug) console.log('message');
```

### Files Modified
- `server.js`: Added `require('dotenv').config()`, environment-based PORT config, debug-gated memory logger, centralized error handler
- `routes/guard.js`: 30+ console.logs converted to debug-gated, removed commented fallback code (lines 177-205), removed TODO comment (line 168)
- `routes/student.js`: 4 console.logs converted to debug-gated
- `utils/imageProcessor.js`: 3 console.logs converted to debug-gated, fixed duplicate variable declarations

### Why This Approach
1. **Production Safety**: NODE_ENV=production eliminates all debug logs
2. **Development Agility**: Developers see logs when debugging
3. **Performance**: Zero overhead in production
4. **Maintainability**: Clear intent with consistent pattern

### Configuration Changes
- Created `.nvmrc` with content `22` (Node version pinning)
- `dotenv` dependency added to support environment-based configuration
- `.gitignore` verified to already contain `.env` and `database.db`
## Frontend Stabilization & Auth Integration (Task 5)

### Decision: Standardize JWT Interceptors and Remove Manual ID Passing
- Replaced manual `uid` and `studentId` passing with a centralized Axios interceptor in `services/api.ts` that automatically attaches the JWT token from `expo-secure-store`.
- Removed all legacy wrapper components (e.g., `CustomCard.tsx`) and `committed*Id` states from all panels (`AdminPanel`, `GuardFacePanel`, `GuardPanel`, `StudentPanel`, `TeacherPanel`).

### Rationale
- Manual ID passing is insecure and prone to state synchronization issues.
- A centralized JWT interceptor ensures all API requests are authenticated consistently.
- Removing redundant wrapper components simplifies the React component tree and reduces maintenance overhead.

### Implementation
- Installed `expo-secure-store` for secure token storage.
- Updated `services/api.ts` to use `SecureStore.getItemAsync('userToken')`.
- Cleaned up JSX structures in all panels, fixing mismatched tags caused by the removal of wrapper components.
- Resolved TypeScript strict-mode errors by explicitly typing catch blocks (`catch (error: any)`) and refs (`useRef<any>(null)`).
- Removed conflicting `@types/axios` dependency to fix Promise chain typings.

### Verification
- Ran `npx tsc --noEmit` to ensure zero TypeScript compilation errors.
- Ran `npx expo export` to verify the application bundles successfully without runtime crashes.
- Decided to use "Berliner Gymnasium" as a placeholder school name.
- Split the Introduction into three subsections: Problemstellung, Projektbeschreibung, and Forschungsfrage.
- Focused the Theoretical Background on RFID, Face Recognition (SSD Mobilenet v1), and GDPR.
- Added 10 relevant literature sources to references.bib.
### Decision: Methodology Structure (2026-02-24)
- Structured the methodology chapter to mirror the actual implementation (Systemarchitektur, RFID-Management, Gesichtserkennungs-Pipeline, Datenbankdesign, Datenschutz).
- Used specific technical details found in the source code (e.g., 1024x1024 resolution, 0.6 threshold, specific SQLite tables) to increase scientific depth.

### Task 7: Create Figures & Diagrams for Paper
- **Diagram Types**:
  - `systemarchitektur.mmd`: Used a `graph TD` to show the 3-tier architecture (Frontend, Backend, Data & AI).
  - `gesichtserkennung_pipeline.mmd`: Used a `graph TD` flowchart to illustrate the image processing and face recognition steps.
  - `datenbankschema.mmd`: Used an `erDiagram` to represent the SQLite database schema with relationships.
  - `rfid_workflow.mmd`: Used a `sequenceDiagram` based on the README to show the card validation process.
  - `benchmark_placeholder.mmd`: Used an `xychart-beta` to create a placeholder bar/line chart for benchmark results.
- **Placement in LaTeX**: Placed the figures in the corresponding subsections of `04_methodik_und_umsetzung.tex` using the `[H]` float specifier to ensure they appear exactly where they are referenced.
