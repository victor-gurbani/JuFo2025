const express = require("express");
const checkPermission = require("../middleware/checkPermission");
const checkAuth = require("../middleware/checkAuth");
const { processImage } = require('../utils/imageProcessor');

module.exports = (db) => {
  const router = express.Router();
  router.use(checkAuth(db));
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
  /**
   * POST /admin/teachers - Create a new teacher account
   * Creates a teacher with role-based permissions and optional photo
   * @param {Object} req.body - Request body
   * @param {string} req.body.id - Unique teacher ID
   * @param {string} req.body.name - Teacher's full name
   * @param {string} req.body.permissionLevel - Role (admin, tutor, teacher, guard)
   * @param {string} req.body.photoUrl - Optional photo data-URI
   * @requires Authentication + admin permission
   * @returns {Object} Teacher object with processed photoUrl
   * @throws {400} If ID is 'photos' (reserved)
   * @throws {500} If database or image processing fails
   */
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

      // Prevent using "photos" as an ID
      if (id.toLowerCase() === "photos") {
        return res.status(400).json({ error: 'The ID "photos" is not allowed.' });
      }

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
  /**
   * GET /admin/students - Retrieve all students with aggregated info
   * Returns comprehensive student list with assigned cards and permissions
   * @requires Authentication + admin permission
   * @returns {Array} Array of student objects with cards and teacher assignments
   * @throws {500} If database operation fails
   */
  router.get("/students", checkPermission(db, "admin"), (req, res) => {
    const query = `
      SELECT 
      s.id,
      s.name,
      s.classGroup,
      s.email,
      s.tutor,
      s.lastPhotoUpdate,
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

  // Important: Move the students/photos route before the :id route
  // This is crucial - specific routes must come before parameterized routes
  router.get("/students/photos", checkPermission(db, "admin"), (req, res) => {
    const query = `SELECT id, photoUrl FROM students WHERE photoUrl IS NOT NULL`;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
  
  // Get specific student info - this must come after /students/photos
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

  // Access logs endpoint
  /**
   * GET /admin/access-logs - Retrieve paginated access logs
   * Returns timestamped records of all card validations and access attempts
   * Includes student name and card UID for reference
   * @param {number} req.query.page - Page number (default: 1)
   * @param {number} req.query.limit - Records per page (default: 20)
   * @requires Authentication + admin permission
   * @returns {Array} Array of access log entries ordered by timestamp DESC
   * @header {number} x-total-count - Total count of all logs
   * @throws {500} If database operation fails
   */
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

  // Create a student
  /**
   * POST /admin/students - Create a new student account
   * Creates a student record with optional profile photo
   * @param {Object} req.body - Request body
   * @param {string} req.body.id - Unique student ID
   * @param {string} req.body.name - Student's full name
   * @param {string} req.body.classGroup - Class/group designation
   * @param {string} req.body.email - Student's email address
   * @param {string} req.body.tutor - Assigned tutor ID
   * @param {string} req.body.photoUrl - Optional photo data-URI
   * @requires Authentication + admin permission
   * @returns {Object} Student object with processed photoUrl
   * @throws {400} If ID is 'photos' (reserved)
   * @throws {500} If database or image processing fails
   */
  router.post("/students", checkPermission(db, "admin"), async (req, res) => {
    try {
      const { id, name, classGroup, email, tutor, photoUrl } = req.body;

      // Prevent using "photos" as an ID
      if (id.toLowerCase() === "photos") {
        return res.status(400).json({ error: 'The ID "photos" is not allowed.' });
      }

      // Process the image if one was provided
      const processedPhotoUrl = photoUrl ? await processImage(photoUrl) : null;

      const query = `
        INSERT INTO students (id, name, classGroup, email, tutor, photoUrl) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(query, [id, name, classGroup, email, tutor, processedPhotoUrl], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, name, classGroup, email, tutor, photoUrl: processedPhotoUrl });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update a student
  router.put("/students/:id", checkPermission(db, "admin"), async (req, res) => {
    try {
      const { name, classGroup, email, tutor, photoUrl } = req.body;
      
      // Process the image if one was provided
      const processedPhotoUrl = photoUrl ? await processImage(photoUrl) : null;
      
      const query = `
        UPDATE students 
        SET name = ?, classGroup = ?, email = ?, tutor = ?, photoUrl = COALESCE(?, photoUrl)
        WHERE id = ?
      `;
      
      db.run(query, [name, classGroup, email, tutor, processedPhotoUrl, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Student not found" });
        res.json({ id: req.params.id, name, classGroup, email, tutor, photoUrl: processedPhotoUrl });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};