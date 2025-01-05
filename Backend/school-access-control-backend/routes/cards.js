const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const path = require("path");

// Initialize SQLite database
const dbPath = path.resolve(__dirname, "../database/cards.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");

    // Create the 'cards' table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS cards (
        uid TEXT PRIMARY KEY,
        lastAssigned TEXT,
        isValid INTEGER
      )`,
      (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
        }
      }
    );
  }
});

// Create
router.post("/", (req, res) => {
  const { uid, lastAssigned, isValid } = req.body;

  const query = `INSERT INTO cards (uid, lastAssigned, isValid) VALUES (?, ?, ?)`;
  db.run(query, [uid, lastAssigned, isValid ? 1 : 0], function (err) {
    if (err) {
      return res.status(500).json({ error: "Failed to create card", details: err.message });
    }
    res.json({ uid, lastAssigned, isValid });
  });
});

// Read
router.get("/", (req, res) => {
  const query = `SELECT * FROM cards`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch cards", details: err.message });
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
      return res.status(500).json({ error: "Failed to update card", details: err.message });
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
      return res.status(500).json({ error: "Failed to delete card", details: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Card not found" });
    }
    res.json({ success: true });
  });
});

module.exports = router;