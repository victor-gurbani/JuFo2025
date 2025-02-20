const express = require("express");
const checkPermission = require("../middleware/checkPermission");

module.exports = (db) => {
  const router = express.Router();

  // Assign a card to a student (allow teachers, tutors, admins)
  router.post("/assign-card", checkPermission(db, "teacher"), (req, res) => {
    const { studentId, cardUID, startDate, endDate, isRecurring, recurrencePattern, studentPhotoUrl } = req.body;
    
    // First, ensure student exists or create them
    const checkStudentQuery = `SELECT id FROM students WHERE id = ?`;
    db.get(checkStudentQuery, [studentId], (err, student) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (!student) {
        // Create new student if doesn't exist
        const createStudentQuery = `INSERT INTO students (id, photoUrl) VALUES (?, ?)`;
        db.run(createStudentQuery, [studentId, studentPhotoUrl], (createErr) => {
          if (createErr) return res.status(500).json({ error: createErr.message });
          proceedWithCardAssignment();
        });
      } else if (studentPhotoUrl) {
        // Update existing student's photo
        const updateStudentQuery = `UPDATE students SET photoUrl = ? WHERE id = ?`;
        db.run(updateStudentQuery, [studentPhotoUrl, studentId], (updateErr) => {
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          proceedWithCardAssignment();
        });
      } else {
        proceedWithCardAssignment();
      }
    });

    function proceedWithCardAssignment() {
      const updateCardQuery = `UPDATE cards SET lastAssigned = ?, isValid = 1 WHERE uid = ?`;
      db.run(updateCardQuery, [studentId, cardUID], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        if (this.changes === 0) {
          const insertCardQuery = `INSERT INTO cards (uid, lastAssigned, isValid) VALUES (?, ?, 1)`;
          db.run(insertCardQuery, [cardUID, studentId], function (insertErr) {
            if (insertErr) return res.status(500).json({ error: insertErr.message });
            insertPermission();
          });
        } else {
          insertPermission();
        }
      });
    }

    function insertPermission() {
      const insertPermissionQuery = `
        INSERT INTO permissions (
          startDate, endDate, isRecurring, recurrencePattern, isValid, assignedStudent, assignedBy, associatedCard
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
      `;
      db.run(insertPermissionQuery, [startDate, endDate, isRecurring ? 1 : 0, recurrencePattern || "", studentId, req.body.teacherId, cardUID], function (permErr) {
        if (permErr) return res.status(500).json({ error: permErr.message });
        res.json({ success: true, cardUID, studentId });
      });
    }
  });

  // Invalidate a card (allow tutors, admins)
  router.post("/invalidate-card", checkPermission(db, "tutor"), (req, res) => {
    const { cardUID } = req.body;
    const query = `UPDATE cards SET isValid = 0 WHERE uid = ?`;
    db.run(query, [cardUID], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Card not found" });

      const permQuery = `UPDATE permissions SET isValid = 0 WHERE associatedCard = ?`;
      db.run(permQuery, [cardUID], () => {
        res.json({ success: true });
      });
    });
  });

  // View permissions (allow teachers, tutors, admins)
  router.get("/permissions", checkPermission(db, "teacher"), (req, res) => {
    const query = `SELECT * FROM permissions`;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  return router;
};