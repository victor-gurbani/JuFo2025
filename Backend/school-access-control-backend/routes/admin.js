const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // Admin endpoints - create teachers, manage system, etc.
  router.get("/dashboard", (req, res) => {
    res.json({ message: "Admin Dashboard" });
  });

  return router;
};