module.exports = (db) => {
  const express = require("express");
  const checkPermission = require("../middleware/checkPermission");
  const router = express.Router();

  // Create a new card (allow admins and tutors)
  router.post("/", checkPermission(db, "tutor"), (req, res) => {
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
  router.get("/", checkPermission(db, "guard"), (req, res) => {
    const query = `SELECT * FROM cards`;
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch cards" });
      }
      res.json(rows);
    });
  });

  // Read a specific card by UID (allow guards, admins)
  router.get("/:uid", checkPermission(db, "guard"), (req, res) => {
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
  router.put("/:uid", checkPermission(db, "tutor"), (req, res) => {
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
  router.delete("/:uid", checkPermission(db, "tutor"), (req, res) => {
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

  return router;
};