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
      SELECT p.*, t.name AS assignedBy, s.photoUrl AS studentPhoto
      FROM permissions p
      JOIN teachers t ON p.assignedBy = t.id
      LEFT JOIN teacher s ON p.assignedStudent = s.id
      WHERE p.associatedCard = ? AND p.isValid = 1
    `;
    db.get(cardQuery, [cardUID], (err, cardRow) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!cardRow) return res.json({ valid: false });
      if (cardRow.isValid !== 1) return res.json({ valid: false });
      

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
            INSERT INTO accessLogs (direction, student, card, wasApproved, timestamp)
            VALUES (?, ?, ?, ?, ?)
          `;
          db.run(logQuery, ['ENTRY', studentId, cardUID, isValid ? 1 : 0, Math.floor(Date.now() / 1000)], (logErr) => {
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
            photoUrl: validPermissions[0].studentPhoto || null, // Use null as default
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