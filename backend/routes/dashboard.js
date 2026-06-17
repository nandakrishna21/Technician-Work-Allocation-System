const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'technician') {
      query = `SELECT t.status, COUNT(*)::int as count FROM tasks t
        INNER JOIN task_assignments ta ON t.id = ta.task_id AND ta.technician_id = $1
        GROUP BY t.status`;
      params = [req.user.id];
    } else {
      query = `SELECT status, COUNT(*)::int as count FROM tasks GROUP BY status`;
    }

    const statuses = await db.query(query, params);

    const counts = { CREATED: 0, ASSIGNED: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, CLOSED: 0 };
    statuses.forEach(s => { counts[s.status] = s.count; });

    const totalTasks = Object.values(counts).reduce((a, b) => a + b, 0);

    const recentTasks = req.user.role === 'technician'
      ? await db.query(`SELECT t.id, t.client_name, t.job_type, t.status, t.priority, t.created_at, u.name as created_by_name
          FROM tasks t LEFT JOIN users u ON t.created_by = u.id
          INNER JOIN task_assignments ta ON t.id = ta.task_id AND ta.technician_id = $1
          ORDER BY t.created_at DESC LIMIT 10`, [req.user.id])
      : await db.query(`SELECT t.id, t.client_name, t.job_type, t.status, t.priority, t.created_at, u.name as created_by_name
          FROM tasks t LEFT JOIN users u ON t.created_by = u.id
          ORDER BY t.created_at DESC LIMIT 10`);

    res.json({ counts, totalTasks, recentTasks });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

router.get('/activity', authenticate, async (req, res) => {
  try {
    let query = `SELECT al.*, u.name as user_name, t.client_name as task_client FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN tasks t ON al.task_id = t.id`;

    if (req.user.role === 'technician') {
      query += ` INNER JOIN task_assignments ta ON t.id = ta.task_id AND ta.technician_id = $1`;
      query += ` ORDER BY al.created_at DESC LIMIT 50`;
      const logs = await db.query(query, [req.user.id]);
      return res.json(logs);
    }

    query += ` ORDER BY al.created_at DESC LIMIT 50`;
    const logs = await db.query(query);
    res.json(logs);
  } catch (err) {
    console.error('Activity log error:', err);
    res.status(500).json({ error: 'Failed to load activity logs.' });
  }
});

module.exports = router;
