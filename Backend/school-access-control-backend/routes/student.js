const express = require("express");
const { processImage } = require('../utils/imageProcessor');
const faceapi = require('@vladmandic/face-api');
const canvas = require("canvas");
const fs = require("fs");
const path = require("path");

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
        console.log("Models directory created. Please download face-api models to this location.");
        return false;
      }
      
      // Only load the detection model, we don't need landmark and recognition for basic face detection
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
      
      console.log("Face detection model loaded successfully");
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
  router.get("/info", (req, res) => {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
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

  // Update student photo (with once per week limitation)
  router.post("/update-photo", async (req, res) => {
    try {
      const { studentId, photoUrl, verifyFace } = req.body;
      
      if (!studentId || !photoUrl) {
        return res.status(400).json({ error: "Student ID and photo are required" });
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
        const now = new Date();
        const lastUpdate = row.lastPhotoUpdate ? new Date(row.lastPhotoUpdate) : null;
        
        if (lastUpdate && now.getTime() - lastUpdate.getTime() < 7 * 24 * 60 * 60 * 1000) {
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
            console.error("Face detection error:", error);
            return res.status(500).json({ error: "Failed to process face detection" });
          }
        } else {
          // No face verification, just process and update the photo
          try {
            const processedPhotoUrl = await processImage(photoUrl);
            updateStudentPhoto(processedPhotoUrl);
          } catch (error) {
            console.error("Photo processing error:", error);
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
  router.post("/update-info", (req, res) => {
    const { studentId, email } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
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