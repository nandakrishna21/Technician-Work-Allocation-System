const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/technicians', authenticate, authorize('admin'), async (req, res) => {
  try {
    const techs = await db.query('SELECT id, username, name, role, mobile, employee_id, created_at FROM users WHERE role = $1', ['technician']);
    res.json(techs);
  } catch (err) {
    console.error('Fetch technicians error:', err);
    res.status(500).json({ error: 'Failed to fetch technicians.' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { username, password, name, role, mobile } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'Username, password, name, and role are required.' });
    }

    const existing = await db.queryOne('SELECT id FROM users WHERE username = $1', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await db.queryOne('INSERT INTO users (username, password, name, role, mobile) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, hashedPassword, name, role, mobile || null]);

    const newId = result.id;
    try { await db.execute('UPDATE users SET employee_id = $1 WHERE id = $2', [String(newId), newId]); } catch (e) {}

    res.status(201).json({ id: result.id, username, name, role });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, employee_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });

    await db.execute('UPDATE users SET name = $1, mobile = $2, employee_id = $3 WHERE id = $4 AND role = $5',
      [name, mobile || null, employee_id || null, id, 'technician']);
    res.json({ success: true });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

module.exports = router;
