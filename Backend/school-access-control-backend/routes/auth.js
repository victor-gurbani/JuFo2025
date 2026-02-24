const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = (db) => {
  const router = express.Router();

  // Login for teachers, guards, and admins

  /**
   * POST /auth/login - Authenticate teacher, guard, or admin
   * Verifies credentials and returns JWT token with permissions
   * @param {Object} req.body - Request body
   * @param {string} req.body.id - User ID (teacher/guard/admin)
   * @param {string} req.body.password - Password (prototype accepts 'prototype_secret' or 'admin123')
   * @returns {Object} {token, user} - JWT token and user info with role and permissions
   * @throws {401} If credentials are invalid
   * @throws {400} If ID or password is missing
   */
  router.post('/login', (req, res) => {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ error: 'ID and password are required' });
    }

    // For prototype: simple shared secret or check against DB if password column exists
    // We will check if the user exists in the teachers table
    db.get('SELECT * FROM teachers WHERE id = ?', [id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Prototype authentication: accept a shared secret 'prototype_secret' or a specific password
      // In a real app, we would compare passwordHash
      const isValidPassword = password === 'prototype_secret' || password === user.password || password === 'admin123';

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Determine permissions based on role (permissionLevel)
      let permissions = [];
      const role = user.permissionLevel;

      if (role === 'admin') {
        permissions = ['ADMIN_ALL', 'VALIDATE_SWIPE', 'VERIFY_FACE', 'MANAGE_CARDS', 'MANAGE_STUDENTS', 'VIEW_CARDS', 'VIEW_PERMISSIONS'];
      } else if (role === 'tutor') {
        permissions = ['VALIDATE_SWIPE', 'MANAGE_STUDENTS', 'VIEW_CARDS', 'VIEW_PERMISSIONS', 'MANAGE_CARDS'];
      } else if (role === 'teacher') {
        permissions = ['VALIDATE_SWIPE', 'MANAGE_STUDENTS', 'VIEW_CARDS', 'VIEW_PERMISSIONS'];
      } else if (role === 'guard') {
        permissions = ['VALIDATE_SWIPE', 'VERIFY_FACE', 'VIEW_CARDS', 'VIEW_PERMISSIONS'];
      }

      const token = jwt.sign(
        { id: user.id, role: role, permissions },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, name: user.name, role } });
    });
  });

  // Login for students

  /**
   * POST /auth/login-student - Authenticate a student
   * Validates student ID and returns JWT token with student permissions
   * @param {Object} req.body - Request body
   * @param {string} req.body.studentId - Student ID
   * @returns {Object} {token, user} - JWT token and student info with role and permissions
   * @throws {401} If student is not found
   * @throws {400} If studentId is missing
   */
  router.post('/login-student', (req, res) => {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    db.get('SELECT * FROM students WHERE id = ?', [studentId], (err, student) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!student) {
        return res.status(401).json({ error: 'Student not found' });
      }

      const permissions = ['STUDENT_ACCESS', 'VIEW_OWN_INFO', 'UPDATE_OWN_PHOTO', 'UPDATE_OWN_INFO'];
      const role = 'student';

      const token = jwt.sign(
        { id: student.id, role, permissions },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: student.id, name: student.name, role } });
    });
  });

  return router;
};
