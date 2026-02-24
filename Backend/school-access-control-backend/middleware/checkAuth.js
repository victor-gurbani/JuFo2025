const jwt = require('jsonwebtoken');

/**
 * Middleware to check JWT authentication and permissions.
 * @param {Object} db - The database connection (kept for signature compatibility, though we might not need it if permissions are in JWT).
 * @param {Array<string>} requiredPermissions - Array of permissions required to access the route.
 */
const checkAuth = (db, requiredPermissions = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = decoded; // { id, role, permissions }

      // Check permissions if any are required
      if (requiredPermissions.length > 0) {
        const userPermissions = req.user.permissions || [];
        const hasAdminAll = userPermissions.includes('ADMIN_ALL');
        const hasPermission = hasAdminAll || requiredPermissions.every(p => userPermissions.includes(p));
        
        if (!hasPermission) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

module.exports = checkAuth;
