const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // Assign a card to a student
  router.post("/assign-card", (req, res) => {
    const { studentId, cardUID, startDate, endDate, isRecurring, recurrencePattern } = req.body;
    // Mark the card as assigned in cards table
    const updateCardQuery = `UPDATE cards SET lastAssigned = ?, isValid = 1 WHERE uid = ?`;
    db.run(updateCardQuery, [studentId, cardUID], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Card not found" });
      // Create or update permission
      const insertPermissionQuery = `
        INSERT INTO permissions (
          startDate, endDate, isRecurring, recurrencePattern, isValid, assignedStudent, assignedBy, associatedCard
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
      `;
      // assignedBy could come from teacher's session or request data
      db.run(insertPermissionQuery, [startDate, endDate, isRecurring ? 1 : 0, recurrencePattern || "", studentId, "teacherX", cardUID], function (permErr) {
        if (permErr) return res.status(500).json({ error: permErr.message });
        res.json({ success: true, cardUID, studentId });
      });
    });
  });

  // Invalidate a card
  router.post("/invalidate-card", (req, res) => {
    const { cardUID } = req.body;
    const query = `UPDATE cards SET isValid = 0 WHERE uid = ?`;
    db.run(query, [cardUID], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Card not found" });
      // Also mark permission as invalid
      const permQuery = `UPDATE permissions SET isValid = 0 WHERE associatedCard = ?`;
      db.run(permQuery, [cardUID], () => {
        res.json({ success: true });
      });
    });
  });

  // View permissions by teacher (could filter by teacher ID in real use)
  router.get("/permissions", (req, res) => {
    const query = `SELECT * FROM permissions`;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  return router;
};