module.exports = (db, requiredLevel) => {
  return (req, res, next) => {
    // Example approach: your frontend could send an adminId with the request body
    // or as a query parameter. Adjust as needed for your auth flow:
    const adminId = req.body.adminId || req.query.adminId;

    // If adminId isn't provided, reject:
    if (!adminId) {
      return res.status(401).json({ error: "No adminId provided" });
    }

    // Look up the user in the 'teachers' table -- or create a separate 'admins' table
    // if you prefer. The check below expects a 'permissionLevel' field to match 'admin'.
    const query = `SELECT permissionLevel FROM teachers WHERE id = ?`;
    db.get(query, [adminId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "User not found" });

      if (row.permissionLevel !== requiredLevel) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      next();
    });
  };
};