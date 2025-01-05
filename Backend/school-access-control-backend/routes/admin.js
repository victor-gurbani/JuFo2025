const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // List all teachers
  router.get("/teachers", (req, res) => {
    const query = `SELECT * FROM teachers`;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // Create a teacher
  router.post("/teachers", (req, res) => {
    const { id, name, permissionLevel } = req.body;
    const query = `INSERT INTO teachers (id, name, permissionLevel) VALUES (?, ?, ?)`;
    db.run(query, [id, name, permissionLevel], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, permissionLevel });
    });
  });

  // Update a teacher
  router.put("/teachers/:id", (req, res) => {
    const { name, permissionLevel } = req.body;
    const query = `UPDATE teachers SET name = ?, permissionLevel = ? WHERE id = ?`;
    db.run(query, [name, permissionLevel, req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Not found" });
      res.json({ id: req.params.id, name, permissionLevel });
    });
  });

  // Delete a teacher
  router.delete("/teachers/:id", (req, res) => {
    const query = `DELETE FROM teachers WHERE id = ?`;
    db.run(query, [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    });
  });

  // Example admin dashboard endpoint
  router.get("/dashboard", (req, res) => {
    res.json({ message: "Admin Dashboard" });
  });

  return router;
};