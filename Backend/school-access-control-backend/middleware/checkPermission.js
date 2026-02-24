// Permission Levels: admin, tutor, teacher, guard, student
/* 
Admin has full access to all endpoints
Tutor can invalidate cards, assign cards, and view permissions (basically a teacher with extra permissions)
Teachers can assign cards and view permissions
Guards can view permissions and cards
Student is not used in this project 
*/

const roleHierarchy = {
  student: 0,
  guard: 1,
  teacher: 2,
  tutor: 3,
  admin: 4
};

module.exports = (db, requiredLevel) => {
  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized: User not authenticated" });
    }
    const userId = req.user.id.toLowerCase();
    const query = `SELECT permissionLevel FROM teachers WHERE id = ?`;

    db.get(query, [userId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Teacher not found" });

      const { permissionLevel } = row;
      const userLevel = roleHierarchy[permissionLevel.toLowerCase()] || -1;
      const requiredLevelNum = roleHierarchy[requiredLevel.toLowerCase()] || 0;

      if (userLevel >= requiredLevelNum) {
        return next();
      } else {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
    });
  };
};