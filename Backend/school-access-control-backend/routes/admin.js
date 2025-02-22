const express = require("express");
const checkPermission = require("../middleware/checkPermission");
const { processImage } = require('../utils/imageProcessor');

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
  router.post("/teachers", checkPermission(db, "admin"), async (req, res) => {
    try {
      const { id, name, permissionLevel, photoUrl } = req.body;
      
      // Process the image if one was provided
      const processedPhotoUrl = photoUrl ? await processImage(photoUrl) : null;
      
      const query = `
        INSERT INTO teachers (id, name, permissionLevel, photoUrl) 
        VALUES (?, ?, ?, ?)
      `;
      
      db.run(query, [id, name, permissionLevel, processedPhotoUrl], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, name, permissionLevel, photoUrl: processedPhotoUrl });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update a teacher (allow only admins)
  router.put("/teachers/:id", checkPermission(db, "admin"), async (req, res) => {
    try {
      const { name, permissionLevel, photoUrl } = req.body;
      
      // Process the image if one was provided
      const processedPhotoUrl = photoUrl ? await processImage(photoUrl) : null;
      
      const query = `
        UPDATE teachers 
        SET name = ?, permissionLevel = ?, photoUrl = ? 
        WHERE id = ?
      `;
      
      db.run(query, [name, permissionLevel, processedPhotoUrl, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Teacher not found" });
        res.json({ id: req.params.id, name, permissionLevel, photoUrl: processedPhotoUrl });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
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

  // Get all students (only admins) - Update the existing route
  router.get("/students", checkPermission(db, "admin"), (req, res) => {
    const query = `
      SELECT 
        s.*,
        GROUP_CONCAT(DISTINCT c.uid) as assignedCards,
        GROUP_CONCAT(DISTINCT t.name) as assignedTeachers
      FROM students s
      LEFT JOIN cards c ON c.lastAssigned = s.id
      LEFT JOIN permissions p ON p.assignedStudent = s.id
      LEFT JOIN teachers t ON p.assignedBy = t.id
      GROUP BY s.id
    `;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // Delete a student (only admins)
  router.delete("/students/:id", checkPermission(db, "admin"), (req, res) => {
    const query = `DELETE FROM students WHERE id = ?`;
    db.run(query, [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Student not found" });
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

  // Get specific student info
  router.get("/students/:id", checkPermission(db, "admin"), (req, res) => {
    const query = `
      SELECT 
        s.*,
        c.uid as cardUID,
        c.isValid as cardValid,
        p.startDate,
        p.endDate,
        p.isRecurring,
        t.name as assignedBy
      FROM students s
      LEFT JOIN cards c ON c.lastAssigned = s.id
      LEFT JOIN permissions p ON p.assignedStudent = s.id
      LEFT JOIN teachers t ON p.assignedBy = t.id
      WHERE s.id = ?
    `;
    db.all(query, [req.params.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  return router;
};