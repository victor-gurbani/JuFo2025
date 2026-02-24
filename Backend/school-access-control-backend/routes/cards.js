const express = require("express");
// Replace checkPermission with checkAuth
const checkAuth = require("../middleware/checkAuth");

module.exports = (db) => {
  const router = express.Router();

  // Create a new card (allow admins and tutors)
  /**
   * POST /cards - Create a new NFC card
   * Adds a new card to the system with UID and validity status
   * @param {Object} req.body - Request body
   * @param {string} req.body.uid - Unique NFC card identifier
   * @param {string} req.body.lastAssigned - Student ID or empty string
   * @param {boolean} req.body.isValid - Whether card is active (default: true)
   * @requires Authentication with MANAGE_CARDS permission
   * @returns {Object} Card object with uid, lastAssigned, isValid
   * @throws {500} If database operation fails
   */
  router.post("/", checkAuth(db, ['MANAGE_CARDS']), (req, res) => {
    const { uid, lastAssigned, isValid } = req.body;

    const query = `INSERT INTO cards (uid, lastAssigned, isValid) VALUES (?, ?, ?)`;
    db.run(query, [uid, lastAssigned, isValid ? 1 : 0], function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to create card" });
      }
      res.json({ uid, lastAssigned, isValid });
    });
  });

  // Read all cards (allow guards, teachers, tutors, admins)
  /**
   * GET /cards - Retrieve all NFC cards
   * Returns a list of all cards in the system
   * @requires Authentication with VIEW_CARDS permission
   * @returns {Array} Array of card objects with uid, lastAssigned, isValid status
   * @throws {500} If database operation fails
   */
  router.get("/", checkAuth(db, ['VIEW_CARDS']), (req, res) => {
    const query = `SELECT * FROM cards`;
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch cards" });
      }
      res.json(rows);
    });
  });

  // Read a specific card by UID (allow guards, admins)
  /**
   * GET /cards/:uid - Retrieve a specific card by UID
   * Fetches detailed information for a single card
   * @param {string} req.params.uid - Card UID
   * @requires Authentication with VIEW_CARDS permission
   * @returns {Object} Card object with uid, lastAssigned, isValid
   * @throws {404} If card not found
   * @throws {500} If database operation fails
   */
  router.get("/:uid", checkAuth(db, ['VIEW_CARDS']), (req, res) => {
    const { uid } = req.params;
    const query = `SELECT * FROM cards WHERE uid = ? LIMIT 1`;
    db.get(query, [uid], (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch card" });
      }
      if (!row) {
        return res.status(404).json({ error: "Card not found" });
      }
      res.json(row);
    });
  });

  // Update a card (allow admins and tutors)
  router.put("/:uid", checkAuth(db, ['MANAGE_CARDS']), (req, res) => {
    const { lastAssigned, isValid } = req.body;
    const query = `UPDATE cards SET lastAssigned = ?, isValid = ? WHERE uid = ?`;
    db.run(query, [lastAssigned, isValid ? 1 : 0, req.params.uid], function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to update card" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Card not found" });
      }
      res.json({ uid: req.params.uid, lastAssigned, isValid });
    });
  });

  // Delete a card (allow admins and tutors)
  router.delete("/:uid", checkAuth(db, ['MANAGE_CARDS']), (req, res) => {
    const query = `DELETE FROM cards WHERE uid = ?`;
    db.run(query, [req.params.uid], function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to delete card" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Card not found" });
      }
      res.json({ success: true });
    });
  });

  // Get permissions for a specific card (allow guards, admins)
  /**
   * GET /cards/:uid/permissions - Get all permissions for a card
   * Returns active permissions assigned to a specific card
   * @param {string} req.params.uid - Card UID
   * @requires Authentication with VIEW_PERMISSIONS and VIEW_CARDS permissions
   * @returns {Array} Array of permission objects with startDate, endDate, recurrence info, and assignee
   * @throws {500} If database operation fails
   */
  router.get("/:uid/permissions", checkAuth(db, ['VIEW_PERMISSIONS', 'VIEW_CARDS']), (req, res) => {
    const { uid } = req.params;
    const permissionsQuery = `
      SELECT p.id, p.startDate, p.endDate, p.isRecurring, p.recurrencePattern, p.assignedStudent, t.name AS assignedBy
      FROM permissions p
      JOIN teachers t ON p.assignedBy = t.id
      WHERE p.associatedCard = ? AND p.isValid = 1
    `;

    db.all(permissionsQuery, [uid], (err, permRows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(
        permRows.map((perm) => ({
          id: perm.id,
          startDate: perm.startDate,
          endDate: perm.endDate,
          isRecurring: perm.isRecurring === 1,
          recurrencePattern: perm.recurrencePattern,
          assignedStudent: perm.assignedStudent,
          assignedBy: perm.assignedBy,
        }))
      );
    });
  });

  return router;
};