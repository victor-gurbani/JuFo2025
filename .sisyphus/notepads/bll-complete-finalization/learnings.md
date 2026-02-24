- When migrating from a custom permission check to JWT-based authentication, ensure that the permissions assigned in the JWT token match the permissions required by the endpoints.
- In `auth.js`, the permissions assigned to different roles must be comprehensive enough to cover all endpoints they need to access. For example, `VIEW_CARDS` and `VIEW_PERMISSIONS` were missing for `guard`, `teacher`, and `tutor` roles, which would have caused `403 Insufficient permissions` errors.
- The `checkAuth` middleware should handle the `ADMIN_ALL` permission correctly, allowing admins to bypass specific permission checks.
- Node.js native modules (like `canvas`, `sqlite3`, `@tensorflow/tfjs-node`) must be rebuilt when switching Node.js versions. Running `npm rebuild` is necessary after switching from Node 25 to Node 22.

## Schema Migration Patterns (Task 2)

### Key Learning: CREATE TABLE IF NOT EXISTS with ALTER TABLE Fallback
When updating existing databases:
1. Update the CREATE TABLE statement in server.js for fresh deployments
2. Add ALTER TABLE statements in the error callback to handle existing databases
3. Filter errors with `!alterErr.message.includes('duplicate column')` to gracefully skip if column exists

### SQLite Specifics
- Foreign key additions via ALTER TABLE might not work in SQLite after table creation
- Instead, the FOREIGN KEY constraint is kept in the CREATE TABLE definition
- For existing tables, the foreign key won't be enforced retroactively, but that's acceptable

### Pattern Used
```javascript
db.run(`CREATE TABLE IF NOT EXISTS tableName (... column TEXT ...)`, (err) => {
  if (err) {
    // Handle creation error
  } else {
    // Add ALTER for existing tables
    db.run(`ALTER TABLE tableName ADD COLUMN column TEXT`, (alterErr) => {
      if (alterErr && !alterErr.message.includes('duplicate column')) {
        console.error("Error:", alterErr);
      }
    });
  }
});
```

This ensures new databases work immediately and old databases get the column on next startup.


## Console Logging & Debug Pattern (Task 3: Backend Cleanup)

### Key Learning: Development-Only Logging Pattern
Instead of removing all console.logs, the specification required a **debug-gated pattern** for development:

```javascript
const debug = process.env.NODE_ENV === 'development';
if (debug) console.log('message');
```

This approach:
1. Keeps logs available for debugging during development
2. Completely eliminates them in production (no performance impact)
3. Prevents sensitive data leakage in production logs
4. Makes the codebase more maintainable than complete removal

### Pattern Applied Across Backend
- `guard.js` (~30+ logs): All converted to debug-gated
- `student.js` (4 logs): All converted to debug-gated
- `imageProcessor.js` (3 logs): All converted to debug-gated
- `server.js` (memory logger): Wrapped in `if (debug)` block
- `admin.js`: No console.logs found (already clean)

### Critical Point: .gitignore Already Correct
- `.env` was already present in `.gitignore` (line 59)
- `database.db` was already present (line 2)
- No changes needed to `.gitignore`

### Environment Variable Loading (dotenv)
- Added `require('dotenv').config()` at top of server.js
- PORT configuration updated to `process.env.PORT || 3000`
- Enables production flexibility without code changes
- .env file not versioned (correctly in .gitignore)