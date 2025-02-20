const express = require("express");
const checkPermission = require("../middleware/checkPermission");

module.exports = (db) => {
  const router = express.Router();

  // Validate a card swipe (allow guards, teachers, tutors, admins)
  router.post("/validate", checkPermission(db, "guard"), (req, res) => {
    const { cardUID } = req.body;
    const cardQuery = `
      SELECT c.uid, c.lastAssigned, c.isValid
      FROM cards c
      WHERE c.uid = ?
      LIMIT 1
    `;
    const permissionsQuery = `
      SELECT p.id, p.startDate, p.endDate, p.isRecurring, p.recurrencePattern, p.assignedStudent, t.name AS assignedBy
      FROM permissions p
      JOIN teachers t ON p.assignedBy = t.id
      WHERE p.associatedCard = ? AND p.isValid = 1
    `;

    db.get(cardQuery, [cardUID], (err, cardRow) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!cardRow) return res.json({ valid: false });

      // Check if the card is valid
      if (cardRow.isValid !== 1) {
        return res.json({ valid: false });
      }

      // Fetch permissions related to the card
      db.all(permissionsQuery, [cardUID], (permErr, permRows) => {
        if (permErr) return res.status(500).json({ error: permErr.message });

        // Validate date and time
        const now = new Date();
        const validPermissions = permRows.filter(perm => {
          const startDate = new Date(perm.startDate);
          const endDate = new Date(perm.endDate);
          return now >= startDate && now <= endDate;
        });

        // After validation, log the access attempt
        const logAccess = (isValid, studentId) => {
          const logQuery = `
            INSERT INTO accessLogs (direction, student, card, wasApproved)
            VALUES (?, ?, ?, ?)
          `;
          db.run(logQuery, ['ENTRY', studentId, cardUID, isValid ? 1 : 0], (logErr) => {
            if (logErr) console.error("Error logging access:", logErr.message);
          });
        };

        if (validPermissions.length > 0) {
          logAccess(true, validPermissions[0].assignedStudent);
          res.json({
            valid: true,
            card: {
              uid: cardRow.uid,
              lastAssigned: cardRow.lastAssigned,
              isValid: cardRow.isValid === 1,
            },
            permissions: validPermissions.map((perm) => ({
              id: perm.id,
              startDate: perm.startDate,
              endDate: perm.endDate,
              isRecurring: perm.isRecurring === 1,
              recurrencePattern: perm.recurrencePattern,
              assignedStudent: perm.assignedStudent,
              assignedBy: perm.assignedBy,
            })),
          });
        } else {
          logAccess(false, cardRow.lastAssigned);
          return res.json({ valid: false });
        }
      });
    });
  });

  return router;
};