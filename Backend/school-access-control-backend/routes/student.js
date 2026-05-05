const express = require('express');
const checkAuth = require('../middleware/checkAuth');
const { processImage } = require('../utils/imageProcessor');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const fs = require('fs');
const path = require('path');

// Debug logging - only in development
const debug = process.env.NODE_ENV === 'development';

// Patch nodejs environment for face-api.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

module.exports = (db) => {
  const router = express.Router();
  let modelsLoaded = false;

  // Load face-api models on startup for face detection
  async function loadModels() {
    try {
      const modelsPath = path.join(__dirname, '../weights');
      
      // Make sure the models directory exists
      if (!fs.existsSync(modelsPath)) {
        fs.mkdirSync(modelsPath, { recursive: true });
        if (debug) console.log('Models directory created. Please download face-api models to this location.');
        return false;
      }
      
      // Only load the detection model, we don't need landmark and recognition for basic face detection
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
      
      if (debug) console.log('Face detection model loaded successfully');
      return true;
    } catch (error) {
      console.error("Error loading face detection model:", error);
      return false;
    }
  }

  // Initialize models
  loadModels().then(result => {
    modelsLoaded = result;
  });

  // Get student information (requires student authentication)
  /**
   * GET /student/info - Retrieve student profile information
   * Returns student details including name, email, photo, class group, and tutor info
   * @param {string} req.query.studentId - Optional student ID (if not provided, uses authenticated user ID)
   * @requires Authentication with VIEW_OWN_INFO permission
   * @returns {Object} Student object with id, name, email, photoUrl, classGroup, lastPhotoUpdate, tutorName
   * @throws {403} If user tries to view another student's info without elevated permissions
   * @throws {404} If student not found
   */
  router.get("/info", checkAuth(db, ['VIEW_OWN_INFO']), (req, res) => {
    // Get student ID from authenticated user
    const studentId = req.query.studentId || req.user.id;

    // Check if the user is requesting their own info or has elevated permissions
    if (studentId !== req.user.id && !req.user.permissions.includes('VIEW_STUDENTS')) {
      return res.status(403).json({ error: "You can only view your own student information" });
    }

    const query = `
      SELECT 
        s.id, s.name, s.email, s.photoUrl, s.classGroup, s.lastPhotoUpdate,
        t.name as tutorName
      FROM students s
      LEFT JOIN teachers t ON s.tutor = t.id
      WHERE s.id = ?
    `;

    db.get(query, [studentId], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json(row);
    });
  });

  // Get card and face verification activity for the authenticated student
  router.get("/access-logs", checkAuth(db, ['VIEW_OWN_INFO']), (req, res) => {
    const studentId = req.query.studentId || req.user.id;
    const requestedLimit = parseInt(req.query.limit, 10) || 100;
    const limit = Math.min(Math.max(requestedLimit, 1), 500);

    if (studentId !== req.user.id && !req.user.permissions.includes('VIEW_STUDENTS')) {
      return res.status(403).json({ error: "You can only view your own access history" });
    }

    const query = `
      SELECT
        al.id,
        al.direction,
        al.student,
        al.card,
        al.wasApproved,
        al.timestamp,
        al.verified_by as verifiedBy,
        t.name as verifiedByName,
        c.uid as cardUID
      FROM accessLogs al
      LEFT JOIN teachers t ON al.verified_by = t.id
      LEFT JOIN cards c ON al.card = c.uid
      WHERE al.student = ?
      ORDER BY al.timestamp DESC, al.id DESC
      LIMIT ?
    `;

    db.all(query, [studentId, limit], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows.map((row) => ({
        ...row,
        wasApproved: row.wasApproved === 1
      })));
    });
  });

  // Update student photo (with once per week limitation)
  /**
   * POST /student/update-photo - Update student profile photo with optional face verification
   * Handles photo upload, resizing, and optional face detection verification
   * Enforces once-per-week update limit for non-admin users
   * @param {Object} req.body - Request body
   * @param {string} req.body.photoUrl - Photo data-URI
   * @param {boolean} req.body.verifyFace - Optional face detection (default: false)
   * @param {string} req.body.studentId - Optional student ID (if not provided, uses authenticated user ID)
   * @requires Authentication with UPDATE_OWN_PHOTO permission
   * @returns {Object} {success, message, nextUpdateAvailable} - Confirmation with next update timestamp
   * @throws {403} If update limit exceeded or insufficient permissions
   * @throws {400} If no face detected (when verifyFace=true) or photo quality too low
   * @throws {503} If face detection service not available
   */
  router.post("/update-photo", checkAuth(db, ['UPDATE_OWN_PHOTO']), async (req, res) => {
    try {
      // Get student ID from authenticated user or parameter for elevated users
      const studentId = req.body.studentId || req.user.id;
      const photoUrl = req.body.photoUrl;
      const verifyFace = req.body.verifyFace;
      
      // Check if the user is updating their own photo or has elevated permissions
      if (studentId !== req.user.id && !req.user.permissions.includes('MANAGE_STUDENTS')) {
        return res.status(403).json({ error: "You can only update your own photo" });
      }

      if (!photoUrl) {
        return res.status(400).json({ error: "Photo is required" });
      }

      // Check when photo was last updated
      const lastUpdateQuery = `SELECT lastPhotoUpdate FROM students WHERE id = ?`;
      db.get(lastUpdateQuery, [studentId], async (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!row) {
          return res.status(404).json({ error: "Student not found" });
        }

        // Check if a week has passed since the last update
        // Skip this check for admins/managers
        const now = new Date();
        const lastUpdate = row.lastPhotoUpdate ? new Date(row.lastPhotoUpdate) : null;
        
        if (lastUpdate && 
            now.getTime() - lastUpdate.getTime() < 7 * 24 * 60 * 60 * 1000 && 
            !req.user.permissions.includes('MANAGE_STUDENTS')) {
          return res.status(403).json({ 
            error: "Photo can only be updated once per week", 
            nextUpdateAvailable: new Date(lastUpdate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() 
          });
        }

        // If face verification is requested
        if (verifyFace === true) {
          if (!modelsLoaded) {
            return res.status(503).json({ error: "Face detection service not available" });
          }

          try {
            // Process the image
            const processedBuffer = await processImage(photoUrl);
            // Load the image
            const img = await canvas.loadImage(processedBuffer);
            
            // Detect faces
            const detection = await faceapi.detectSingleFace(img);
            
            if (!detection) {
              return res.status(400).json({ error: "No face detected in the photo" });
            }
            
            // Optionally, check if the face is clear/good quality
            if (detection.score < 0.8) {
              return res.status(400).json({ error: "The face in the photo is not clear enough" });
            }

            // Continue with update if a face was detected
            updateStudentPhoto(processedBuffer);
          } catch (error) {
            console.error('Face detection error:', error);
            return res.status(500).json({ error: "Failed to process face detection" });
          }
        } else {
          // No face verification, just process and update the photo
          try {
            const processedPhotoUrl = await processImage(photoUrl);
            updateStudentPhoto(processedPhotoUrl);
          } catch (error) {
            console.error('Photo processing error:', error);
            return res.status(500).json({ error: "Failed to process photo" });
          }
        }

        // Helper function to update the photo in the database
        function updateStudentPhoto(processedPhoto) {
          const updateQuery = `UPDATE students SET photoUrl = ?, lastPhotoUpdate = ? WHERE id = ?`;
          db.run(updateQuery, [processedPhoto, now.toISOString(), studentId], function (updateErr) {
            if (updateErr) {
              return res.status(500).json({ error: updateErr.message });
            }
            
            if (this.changes === 0) {
              return res.status(404).json({ error: "Student not found or no changes made" });
            }
            
            res.json({ 
              success: true,
              message: "Photo updated successfully",
              nextUpdateAvailable: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
          });
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update student information (email only for now)
  /**
   * POST /student/update-info - Update student information
   * Currently allows updating email address only
   * @param {Object} req.body - Request body
   * @param {string} req.body.email - New email address
   * @param {string} req.body.studentId - Optional student ID (if not provided, uses authenticated user ID)
   * @requires Authentication with UPDATE_OWN_INFO permission
   * @returns {Object} {success, message} - Confirmation message
   * @throws {403} If user tries to update another student's info without elevated permissions
   * @throws {400} If email is missing or invalid
   * @throws {404} If student not found
   */
  router.post("/update-info", checkAuth(db, ['UPDATE_OWN_INFO']), (req, res) => {
    // Get student ID from authenticated user or parameter for elevated users
    const studentId = req.body.studentId || req.user.id;
    const { email } = req.body;
    
    // Check if the user is updating their own info or has elevated permissions
    if (studentId !== req.user.id && !req.user.permissions.includes('MANAGE_STUDENTS')) {
      return res.status(403).json({ error: "You can only update your own information" });
    }

    // Only allow updating email for now
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const query = `UPDATE students SET email = ? WHERE id = ?`;
    db.run(query, [email, studentId], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: "Student not found or no changes made" });
      }
      
      res.json({ success: true, message: "Student information updated successfully" });
    });
  });

  return router;
};
