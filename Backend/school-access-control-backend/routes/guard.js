const express = require("express");
const checkPermission = require("../middleware/checkPermission");

module.exports = (db) => {
  const router = express.Router();

  // Validate a card swipe (allow guards, teachers, tutors, admins)
  router.post("/validate", checkPermission(db, "guard"), (req, res) => {
    const { cardUID } = req.body;
    const query = `
      SELECT c.uid, c.lastAssigned, c.isValid
      FROM cards c
      WHERE c.uid = ?
      LIMIT 1
    `;
    db.get(query, [cardUID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.json({ valid: false });

      // Check if the card is valid
      if (row.isValid !== 1) {
        return res.json({ valid: false });
      }

      // Optionally, you can add more logic here, such as checking permissions

      // Return card details along with validation result
      res.json({
        valid: true,
        card: {
          uid: row.uid,
          lastAssigned: row.lastAssigned,
          isValid: row.isValid === 1
        }
      });
    });
  });

  return router;
};