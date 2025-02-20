const express = require("express");
const checkPermission = require("../middleware/checkPermission");

module.exports = (db) => {
  const router = express.Router();

  // Get all cards (allow only admins)
  router.get("/cards", checkPermission(db, "admin"), (req, res) => {
    const query = `SELECT * FROM cards`;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // List all teachers (allow only admins)
  router.get("/teachers", checkPermission(db, "admin"), (req, res) => {
    const query = `SELECT * FROM teachers`;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // Create a teacher (allow only admins)
  router.post("/teachers", checkPermission(db, "admin"), (req, res) => {
    const { id, name, permissionLevel, photoUrl } = req.body;
    const query = `
      INSERT INTO teachers (id, name, permissionLevel, photoUrl) 
      VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, [id, name, permissionLevel, photoUrl], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, permissionLevel, photoUrl });
    });
  });

  // Update a teacher (allow only admins)
  router.put("/teachers/:id", checkPermission(db, "admin"), (req, res) => {
    const { name, permissionLevel, photoUrl } = req.body;
    const query = `
      UPDATE teachers 
      SET name = ?, permissionLevel = ?, photoUrl = ? 
      WHERE id = ?
    `;
    
    db.run(query, [name, permissionLevel, photoUrl, req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Teacher not found" });
      res.json({ id: req.params.id, name, permissionLevel, photoUrl });
    });
  });

  // Delete a teacher (allow only admins)
  router.delete("/teachers/:id", checkPermission(db, "admin"), (req, res) => {
    const query = `DELETE FROM teachers WHERE id = ?`;
    db.run(query, [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    });
  });

  // Example admin dashboard endpoint (only admins)
  router.get("/dashboard", checkPermission(db, "admin"), (req, res) => {
    res.json({ message: "Admin Dashboard" });
  });

  // Add this route in admin.js
  router.get("/access-logs", checkPermission(db, "admin"), (req, res) => {
    const query = `
      SELECT 
        al.*,
        s.name as studentName,
        c.uid as cardUID
      FROM accessLogs al
      LEFT JOIN students s ON al.student = s.id
      LEFT JOIN cards c ON al.card = c.uid
      ORDER BY al.timestamp DESC
      LIMIT 100
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  return router;
};