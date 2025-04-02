const express = require("express");
const checkPermission = require("../middleware/checkPermission");
const faceapi = require("face-api.js");
const canvas = require("canvas");
const fs = require("fs");
const path = require("path");
require("@tensorflow/tfjs-node");
// Import the image processor utility
const { processImage } = require("../utils/imageProcessor");

// Patch nodejs environment for face-api.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

module.exports = (db) => {
  const router = express.Router();
  let modelsLoaded = false;

  // Load face-api models on startup
  async function loadModels() {
    try {
      const modelsPath = path.join(__dirname, '../weights');
      
      // Make sure the models directory exists
      if (!fs.existsSync(modelsPath)) {
        fs.mkdirSync(modelsPath, { recursive: true });
        console.log("Models directory created. Please download face-api models to this location.");
        return false;
      }
      
      // Load all required models
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
      
      console.log("Face recognition models loaded successfully");
      return true;
    } catch (error) {
      console.error("Error loading face recognition models:", error);
      return false;
    }
  }

  // Initialize models
  loadModels().then(result => {
    modelsLoaded = result;
  });

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
    console.log("Starting face verification request");
    try {
      // Check if models are loaded
      console.log("Checking if models are loaded:", modelsLoaded);
      if (!modelsLoaded) {
        console.log("Models not loaded, returning error");
        return res.status(503).json({ 
          error: "Face recognition service not available", 
          message: "Face recognition models not loaded properly" 
        });
      }

      const { snapshotImage, cardUID } = req.body;
      console.log("Received request with cardUID:", cardUID);
      console.log("Snapshot image received:", snapshotImage ? "Yes" : "No");
      
      if (!snapshotImage || !cardUID) {
        console.log("Missing required data in request");
        return res.status(400).json({ 
          error: "Missing required data", 
          message: "Both snapshot image and card UID are required" 
        });
      }

      // Get the reference student photo for this card
      console.log("Querying database for reference photo with cardUID:", cardUID);
      const photoQuery = `
        SELECT s.photoUrl
        FROM students s
        JOIN permissions p ON s.id = p.assignedStudent
        JOIN cards c ON p.associatedCard = c.uid
        WHERE c.uid = ? AND c.isValid = 1 AND p.isValid = 1
        LIMIT 1
      `;

      db.get(photoQuery, [cardUID], async (err, row) => {
        console.log("Database query completed");
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }

        console.log("Database result:", row);
        if (!row || !row.photoUrl) {
          console.log("No reference photo found for this card");
          return res.status(404).json({ 
            error: "Reference photo not found", 
            match: false, 
            similarity: 0 
          });
        }
        
        console.log("Snapshot image data preview:", snapshotImage.slice(0, 20) + "...");
        // Process the snapshot image using utility
        console.log("Processing snapshot image");
        const snapshotBuffer = processImage(snapshotImage);
        console.log("Snapshot processing complete, buffer size:", snapshotBuffer.length);

        console.log("Reference photo URL preview:", row.photoUrl.slice(0, 20) + "...");
        // Process the reference image using utility
        console.log("Processing reference image");
        const referenceBuffer = processImage(row.photoUrl);
        console.log("Reference processing complete, buffer size:", referenceBuffer.length);

        // Load images
        console.log("Loading images into canvas");
        try {
          const snapshotImg = await canvas.loadImage(snapshotBuffer);
          console.log("Snapshot image loaded, dimensions:", snapshotImg.width, "x", snapshotImg.height);
          
          const referenceImg = await canvas.loadImage(referenceBuffer);
          console.log("Reference image loaded, dimensions:", referenceImg.width, "x", referenceImg.height);

          // Detect faces and get face descriptors
          console.log("Detecting face in snapshot image");
          const snapshotDetection = await faceapi
            .detectSingleFace(snapshotImg)
            .withFaceLandmarks()
            .withFaceDescriptor();
          console.log("Snapshot face detection result:", snapshotDetection ? "Face detected" : "No face detected");

          console.log("Detecting face in reference image");
          const referenceDetection = await faceapi
            .detectSingleFace(referenceImg)
            .withFaceLandmarks()
            .withFaceDescriptor();
          console.log("Reference face detection result:", referenceDetection ? "Face detected" : "No face detected");

          // Check if faces were detected in both images
          if (!snapshotDetection || !referenceDetection) {
            console.log("Face detection failed in one or both images");
            return res.json({ 
              match: false, 
              similarity: 0, 
              error: !referenceDetection ? "No face detected in reference photo" : "No face detected in snapshot"
            });
          }

          // Calculate similarity using Euclidean distance
          console.log("Calculating face similarity");
          const distance = faceapi.euclideanDistance(
            snapshotDetection.descriptor,
            referenceDetection.descriptor
          );
          console.log("Euclidean distance between faces:", distance);

          // Convert distance to similarity score (0-100%)
          // Lower distance means higher similarity
          // Typically, distances < 0.6 indicate same person
          const threshold = 0.6;
          const similarity = Math.max(0, Math.min(100, (1 - distance / threshold) * 100));
          const match = distance < threshold;
          
          console.log("Calculated similarity score:", similarity);
          console.log("Face match result:", match);

          // Log the verification attempt
          console.log("Logging verification attempt to database");
          const logQuery = `
            INSERT INTO accessLogs (direction, student, card, wasApproved, timestamp)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          db.run(logQuery, ['FACE_VERIFY', row.studentId, cardUID, match ? 1 : 0, Math.floor(Date.now() / 1000)], (logErr) => {
            if (logErr) console.error("Error logging face verification:", logErr);
            else console.log("Verification attempt logged successfully");
          });

          // Return the result
          console.log("Sending verification response to client");
          res.json({
            match,
            similarity,
            distance,
            facesDetected: {
              snapshot: true,
              reference: true
            }
          });
        } catch (imageError) {
          console.error("Error processing images:", imageError);
          res.status(500).json({
            error: "Image processing failed",
            message: imageError.message,
            match: false,
            similarity: 0
          });
        }
      });
    } catch (error) {
      console.error("Face verification error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        error: "Face verification failed", 
        message: error.message,
        match: false,
        similarity: 0
      });
    }
  });

  return router;
};