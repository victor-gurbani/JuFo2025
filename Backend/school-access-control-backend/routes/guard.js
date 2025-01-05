const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // Validate a card swipe
  router.post("/validate", (req, res) => {
    const { cardUID } = req.body;
    const query = `
      SELECT c.uid, p.isValid, p.startDate, p.endDate
      FROM cards c
      JOIN permissions p ON p.associatedCard = c.uid
      WHERE c.uid = ? AND p.isValid = 1
      LIMIT 1
    `;
    db.get(query, [cardUID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.json({ valid: false });
      // Could check current time against startDate/endDate here
      // Example:
      // const now = new Date();
      // if (now < new Date(row.startDate) || now > new Date(row.endDate)) { ... }
      res.json({ valid: true });
    });
  });

  return router;
};