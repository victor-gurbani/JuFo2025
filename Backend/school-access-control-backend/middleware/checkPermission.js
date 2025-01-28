module.exports = (db, requiredLevel) => {
  return (req, res, next) => {
    const teacherId = req.body.teacherId || req.query.teacherId; // Must be passed by the client
    const query = `SELECT permissionLevel FROM teachers WHERE id = ?`;

    db.get(query, [teacherId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Teacher not found" });

      const { permissionLevel } = row;

      // If user is admin, allow them to proceed no matter what
      if (permissionLevel === "admin") {
        return next();
      }

      // Otherwise, check if the permission matches the required level
      if (permissionLevel !== requiredLevel) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      next();
    });
  };
};