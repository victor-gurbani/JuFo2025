const express = require("express");
const checkPermission = require("../middleware/checkPermission");
// Import face-api.js for face comparison
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');
const canvas = require('canvas');
const fetch = require('node-fetch');

// Register canvas for face-api to work in Node.js environment
faceapi.env.monkeyPatch({ fetch, Canvas, Image, ImageData });

module.exports = (db) => {
  const router = express.Router();
  
  // Initialize face-api.js models (call this during server startup)
  let modelsLoaded = false;
  
  const loadModels = async () => {
    try {
      // Adjust these paths to where your models are located
      const modelPath = './public/models';
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
      modelsLoaded = true;
      console.log("Face recognition models loaded");
    } catch (err) {
      console.error("Error loading face recognition models:", err);
    }
  };
  
  loadModels();

  // Validate a card swipe (allow guards, teachers, tutors, admins)
  router.post("/validate", checkPermission(db, "guard"), (req, res) => {
    const { cardUID } = req.body;
    const cardQuery = `
      SELECT c.uid, c.lastAssigned, c.isValid
      FROM cards c
      WHERE c.uid = ?
      LIMIT 1
    `;
    const permissionsQuery = `
      SELECT p.*, t.name AS assignedBy, s.photoUrl AS studentPhoto
      FROM permissions p
      JOIN teachers t ON p.assignedBy = t.id
      LEFT JOIN students s ON p.assignedStudent = s.id
      WHERE p.associatedCard = ? AND p.isValid = 1
    `;
    db.get(cardQuery, [cardUID], (err, cardRow) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!cardRow) return res.json({ valid: false });
      if (cardRow.isValid !== 1) return res.json({ valid: false });
      

      // Fetch permissions related to the card
      db.all(permissionsQuery, [cardUID], (permErr, permRows) => {
        if (permErr) return res.status(500).json({ error: permErr.message });

        // Validate date and time
        const now = new Date();
        const validPermissions = permRows.filter(perm => {
          const startDate = new Date(perm.startDate);
          const endDate = new Date(perm.endDate);
          return now >= startDate && now <= endDate;
        });

        // After validation, log the access attempt
        const logAccess = (isValid, studentId) => {
          const logQuery = `
            INSERT INTO accessLogs (direction, student, card, wasApproved, timestamp)
            VALUES (?, ?, ?, ?, ?)
          `;
          db.run(logQuery, ['ENTRY', studentId, cardUID, isValid ? 1 : 0, Math.floor(Date.now() / 1000)], (logErr) => {
            if (logErr) console.error("Error logging access:", logErr.message);
          });
        };

        if (validPermissions.length > 0) {
          logAccess(true, validPermissions[0].assignedStudent);
          res.json({
            valid: true,
            card: {
              uid: cardRow.uid,
              lastAssigned: cardRow.lastAssigned,
              isValid: cardRow.isValid === 1,
            },
            photoUrl: validPermissions[0].studentPhoto || null, // Use null as default
            permissions: validPermissions.map((perm) => ({
              id: perm.id,
              startDate: perm.startDate,
              endDate: perm.endDate,
              isRecurring: perm.isRecurring === 1,
              recurrencePattern: perm.recurrencePattern,
              assignedStudent: perm.assignedStudent,
              assignedBy: perm.assignedBy,
            })),
          });
        } else {
          logAccess(false, cardRow.lastAssigned);
          return res.json({ valid: false });
        }
      });
    });
  });

  // New endpoint for face verification
  router.post("/verify-face", checkPermission(db, "guard"), async (req, res) => {
    if (!modelsLoaded) {
      return res.status(500).json({ error: "Face recognition models not loaded yet" });
    }
    
    const { snapshotImage, cardUID } = req.body;
    
    if (!snapshotImage || !cardUID) {
      return res.status(400).json({ error: "Missing snapshot image or card UID" });
    }
    
    try {
      // Get student photo from database
      const query = `
        SELECT s.photoUrl
        FROM students s
        JOIN cards c ON c.lastAssigned = s.id
        WHERE c.uid = ? AND c.isValid = 1
        LIMIT 1
      `;
      
      db.get(query, [cardUID], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row || !row.photoUrl) return res.status(404).json({ error: "Student photo not found" });
        
        const studentPhoto = row.photoUrl;
        
        try {
          // Load images
          const referenceImage = await canvas.loadImage(studentPhoto);
          const snapshotImageObj = await canvas.loadImage(snapshotImage);
          
          // Detect faces
          const referenceDetection = await faceapi.detectSingleFace(referenceImage)
            .withFaceLandmarks().withFaceDescriptor();
          
          const snapshotDetection = await faceapi.detectSingleFace(snapshotImageObj)
            .withFaceLandmarks().withFaceDescriptor();
          
          if (!referenceDetection || !snapshotDetection) {
            return res.status(400).json({ 
              match: false, 
              similarity: 0,
              error: !referenceDetection ? "No face detected in reference photo" : "No face detected in snapshot"
            });
          }
          
          // Compare faces using euclidean distance
          const distance = faceapi.euclideanDistance(
            referenceDetection.descriptor,
            snapshotDetection.descriptor
          );
          
          // Convert distance to similarity score (0-100%)
          // Lower distance means higher similarity
          const similarity = Math.max(0, Math.min(100, (1 - distance) * 100));
          
          // Determine if it's a match (customize threshold as needed)
          const match = similarity > 70;
          
          res.json({
            match,
            similarity,
            distance
          });
        } catch (err) {
          console.error("Face comparison error:", err);
          res.status(500).json({ error: "Error during face comparison: " + err.message });
        }
      });
    } catch (error) {
      console.error("Face verification error:", error);
      res.status(500).json({ error: "Face verification failed: " + error.message });
    }
  });

  return router;
};