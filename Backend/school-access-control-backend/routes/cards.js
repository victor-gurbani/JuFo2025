module.exports = (db) => {
    const express = require("express");
    const router = express.Router();
  
    // Create
    router.post("/", (req, res) => {
      const { uid, lastAssigned, isValid } = req.body;
  
      const query = `INSERT INTO cards (uid, lastAssigned, isValid) VALUES (?, ?, ?)`;
      db.run(query, [uid, lastAssigned, isValid ? 1 : 0], function (err) {
        if (err) {
          return res.status(500).json({ error: "Failed to create card" });
        }
        res.json({ uid, lastAssigned, isValid });
      });
    });
  
    // Read
    router.get("/", (req, res) => {
      const query = `SELECT * FROM cards`;
      db.all(query, [], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Failed to fetch cards" });
        }
        res.json(rows);
      });
    });
  
    // Update
    router.put("/:uid", (req, res) => {
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
  
    // Delete
    router.delete("/:uid", (req, res) => {
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
  