
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