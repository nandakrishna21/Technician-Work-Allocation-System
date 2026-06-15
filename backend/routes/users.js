const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/technicians', authenticate, authorize('admin'), (req, res) => {
  try {
    const techs = db.prepare('SELECT id, username, name, role, mobile, created_at FROM users WHERE role = ?').all('technician');
    res.json(techs);
  } catch (err) {
    console.error('Fetch technicians error:', err);
    res.status(500).json({ error: 'Failed to fetch technicians.' });
  }
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const { username, password, name, role, mobile } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'Username, password, name, and role are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password, name, role, mobile) VALUES (?, ?, ?, ?, ?)').run(username, hashedPassword, name, role, mobile || null);

    res.status(201).json({ id: result.lastInsertRowid, username, name, role });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

module.exports = router;
