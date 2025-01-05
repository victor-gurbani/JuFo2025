const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // Guard endpoints for validating card swipes, logs
  router.post("/validate", (req, res) => {
    // Implementation
    res.json({ valid: true });
  });

  return router;
};