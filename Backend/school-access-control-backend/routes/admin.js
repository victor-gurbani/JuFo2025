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
    const query = `SELECT id, name, permissionLevel FROM teachers`;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // Add a new endpoint for teacher photos
  router.get("/teachers/photos", checkPermission(db, "admin"), (req, res) => {
    const query = `SELECT id, photoUrl FROM teachers WHERE photoUrl IS NOT NULL`;
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // First, get the total count of logs
    const countQuery = `
      SELECT COUNT(*) as total
      FROM accessLogs al
    `;
    
    db.get(countQuery, [], (countErr, countResult) => {
      if (countErr) return res.status(500).json({ error: countErr.message });
      
      // Set the total count header
      res.setHeader('x-total-count', countResult.total);
      
      // Then get the paginated data
      const query = `
        SELECT 
          al.*,
          s.name as studentName,
          c.uid as cardUID
        FROM accessLogs al
        LEFT JOIN students s ON al.student = s.id
        LEFT JOIN cards c ON al.card = c.uid
        ORDER BY al.timestamp DESC
        LIMIT ? OFFSET ?
      `;
      
      db.all(query, [limit, offset], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      });
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

  // Get logs for a specific card
  router.get("/card-logs/:uid", checkPermission(db, "admin"), (req, res) => {
    const { uid } = req.params;
    
    const query = `
      SELECT 
        al.*,
        s.name as studentName
      FROM accessLogs al
      LEFT JOIN students s ON al.student = s.id
      WHERE al.card = ?
      ORDER BY al.timestamp DESC
      LIMIT 50
    `;
    
    db.all(query, [uid], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  // Add a dedicated route for invalidating cards directly from admin panel
  router.post("/invalidate-card", checkPermission(db, "admin"), (req, res) => {
    const { cardUID } = req.body;
    
    const query = `UPDATE cards SET isValid = 0 WHERE uid = ?`;
    db.run(query, [cardUID], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Card not found" });

      // Also invalidate all associated permissions
      const permQuery = `UPDATE permissions SET isValid = 0 WHERE associatedCard = ?`;
      db.run(permQuery, [cardUID], (permErr) => {
        if (permErr) return res.status(500).json({ error: permErr.message });
        res.json({ success: true });
      });
    });
  });

  return router;
};