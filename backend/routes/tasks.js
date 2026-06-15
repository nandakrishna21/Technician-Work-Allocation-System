const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function generateTaskId() {
  const last = db.prepare('SELECT id FROM tasks ORDER BY created_at DESC LIMIT 1').get();
  const num = last ? parseInt(last.id.split('-')[1]) + 1 : 1;
  return 'TASK-' + String(num).padStart(5, '0');
}

function logActivity(taskId, userId, action, details) {
  db.prepare('INSERT INTO activity_logs (task_id, user_id, action, details) VALUES (?, ?, ?, ?)').run(taskId, userId, action, details || null);
}

router.post('/', authenticate, authorize('admin'), upload.single('attachment'), (req, res) => {
  try {
    const {
      client_name, contact_person, mobile_number, location,
      job_type, description, special_instructions, priority
    } = req.body;

    if (!client_name || !location || !job_type) {
      return res.status(400).json({ error: 'Client name, location, and job type are required.' });
    }

    const taskId = generateTaskId();
    const attachment = req.file ? req.file.filename : null;

    db.prepare(`INSERT INTO tasks (id, client_name, contact_person, mobile_number, location, job_type, description, special_instructions, priority, attachment, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      taskId, client_name, contact_person || null, mobile_number || null, location,
      job_type, description || null, special_instructions || null, priority || 'Medium',
      attachment, req.user.id
    );

    logActivity(taskId, req.user.id, 'TASK_CREATED', `Task created by ${req.user.name}`);

    res.status(201).json({ id: taskId, message: 'Task created successfully.' });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

router.get('/', authenticate, (req, res) => {
  try {
    const { status, technician, priority, date_from, date_to, search } = req.query;
    let query = `SELECT t.*, u.name as created_by_name FROM tasks t LEFT JOIN users u ON t.created_by = u.id WHERE 1=1`;
    const params = [];

    if (req.user.role === 'technician') {
      query = `SELECT t.*, u.name as created_by_name FROM tasks t
        LEFT JOIN users u ON t.created_by = u.id
        INNER JOIN task_assignments ta ON t.id = ta.task_id AND ta.technician_id = ?
        WHERE 1=1`;
      params.push(req.user.id);
    }

    if (status) {
      const statuses = status.split(',');
      const placeholders = statuses.map(() => '?').join(',');
      query += ` AND t.status IN (${placeholders})`;
      params.push(...statuses);
    }

    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (date_from) {
      query += ' AND t.created_at >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND t.created_at <= ?';
      params.push(date_to + ' 23:59:59');
    }

    if (search) {
      query += ' AND (t.client_name LIKE ? OR t.job_type LIKE ? OR t.id LIKE ? OR t.location LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY t.created_at DESC';

    const tasks = db.prepare(query).all(...params);

    const tasksWithAssignments = tasks.map(task => {
      const techs = db.prepare(`SELECT u.id, u.name, u.mobile, ta.is_lead, ta.assigned_at FROM task_assignments ta INNER JOIN users u ON ta.technician_id = u.id WHERE ta.task_id = ?`).all(task.id);
      return { ...task, technicians: techs };
    });

    res.json(tasksWithAssignments);
  } catch (err) {
    console.error('Fetch tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const task = db.prepare(`SELECT t.*, u.name as created_by_name,
      a.name as assigned_by_name, c.name as completed_by_name, cl.name as closed_by_name
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN users a ON t.assigned_by = a.id
      LEFT JOIN users c ON t.completed_by = c.id
      LEFT JOIN users cl ON t.closed_by = cl.id
      WHERE t.id = ?`).get(req.params.id);

    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const technicians = db.prepare(`SELECT u.id, u.name, u.mobile, ta.is_lead FROM task_assignments ta INNER JOIN users u ON ta.technician_id = u.id WHERE ta.task_id = ?`).all(task.id);

    const logs = db.prepare(`SELECT al.*, u.name as user_name FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id WHERE al.task_id = ? ORDER BY al.created_at DESC`).all(task.id);

    const notes = db.prepare(`SELECT tn.*, u.name as user_name FROM task_notes tn LEFT JOIN users u ON tn.user_id = u.id WHERE tn.task_id = ? ORDER BY tn.created_at DESC`).all(task.id);

    const photos = db.prepare(`SELECT tp.*, u.name as user_name FROM task_photos tp LEFT JOIN users u ON tp.user_id = u.id WHERE tp.task_id = ? ORDER BY tp.created_at DESC`).all(task.id);

    res.json({ ...task, technicians, activity_logs: logs, notes, photos });
  } catch (err) {
    console.error('Fetch task error:', err);
    res.status(500).json({ error: 'Failed to fetch task.' });
  }
});

router.put('/:id', authenticate, authorize('admin'), upload.single('attachment'), (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const {
      client_name, contact_person, mobile_number, location,
      job_type, description, special_instructions, priority
    } = req.body;

    const attachment = req.file ? req.file.filename : task.attachment;

    db.prepare(`UPDATE tasks SET client_name=?, contact_person=?, mobile_number=?, location=?,
      job_type=?, description=?, special_instructions=?, priority=?, attachment=? WHERE id=?`).run(
      client_name || task.client_name,
      contact_person !== undefined ? contact_person : task.contact_person,
      mobile_number !== undefined ? mobile_number : task.mobile_number,
      location || task.location,
      job_type || task.job_type,
      description !== undefined ? description : task.description,
      special_instructions !== undefined ? special_instructions : task.special_instructions,
      priority || task.priority,
      attachment,
      req.params.id
    );

    logActivity(req.params.id, req.user.id, 'TASK_UPDATED', `Task updated by ${req.user.name}`);

    res.json({ message: 'Task updated successfully.' });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

router.post('/:id/assign', authenticate, authorize('admin'), (req, res) => {
  try {
    const { technician_ids, lead_technician_id } = req.body;
    if (!technician_ids || !Array.isArray(technician_ids) || technician_ids.length === 0) {
      return res.status(400).json({ error: 'At least one technician must be assigned.' });
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const deleteStmt = db.prepare('DELETE FROM task_assignments WHERE task_id = ?');
    const insertStmt = db.prepare('INSERT INTO task_assignments (task_id, technician_id, is_lead) VALUES (?, ?, ?)');

    const transaction = db.transaction(() => {
      deleteStmt.run(req.params.id);
      technician_ids.forEach(techId => {
        const isLead = lead_technician_id && techId == lead_technician_id ? 1 : 0;
        insertStmt.run(req.params.id, techId, isLead);
      });
      db.prepare('UPDATE tasks SET status = ?, assigned_by = ?, assigned_at = datetime(\'now\', \'localtime\') WHERE id = ?').run('ASSIGNED', req.user.id, req.params.id);
    });

    transaction();
    logActivity(req.params.id, req.user.id, 'TASK_ASSIGNED', `Task assigned to ${technician_ids.length} technician(s) by ${req.user.name}`);

    res.json({ message: 'Task assigned successfully.' });
  } catch (err) {
    console.error('Assign task error:', err);
    res.status(500).json({ error: 'Failed to assign task.' });
  }
});

router.post('/:id/accept', authenticate, authorize('technician'), (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (task.status !== 'ASSIGNED') return res.status(400).json({ error: 'Task must be in ASSIGNED status.' });

    const assignment = db.prepare('SELECT * FROM task_assignments WHERE task_id = ? AND technician_id = ?').get(req.params.id, req.user.id);
    if (!assignment) return res.status(403).json({ error: 'You are not assigned to this task.' });

    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('ACCEPTED', req.params.id);
    logActivity(req.params.id, req.user.id, 'TASK_ACCEPTED', `Task accepted by ${req.user.name}`);

    res.json({ message: 'Task accepted successfully.' });
  } catch (err) {
    console.error('Accept task error:', err);
    res.status(500).json({ error: 'Failed to accept task.' });
  }
});

router.post('/:id/start', authenticate, authorize('technician'), (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (task.status !== 'ACCEPTED' && task.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Task must be in ACCEPTED or IN_PROGRESS status.' });

    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('IN_PROGRESS', req.params.id);
    logActivity(req.params.id, req.user.id, 'WORK_STARTED', `Work started by ${req.user.name}`);

    res.json({ message: 'Work started successfully.' });
  } catch (err) {
    console.error('Start task error:', err);
    res.status(500).json({ error: 'Failed to start task.' });
  }
});

router.post('/:id/notes', authenticate, authorize('technician'), (req, res) => {
  try {
    const { note, is_progress } = req.body;
    if (!note) return res.status(400).json({ error: 'Note is required.' });

    const assignment = db.prepare('SELECT * FROM task_assignments WHERE task_id = ? AND technician_id = ?').get(req.params.id, req.user.id);
    if (!assignment) return res.status(403).json({ error: 'You are not assigned to this task.' });

    db.prepare('INSERT INTO task_notes (task_id, user_id, note, is_progress) VALUES (?, ?, ?, ?)').run(req.params.id, req.user.id, note, is_progress ? 1 : 0);
    logActivity(req.params.id, req.user.id, 'NOTE_ADDED', `Note added by ${req.user.name}`);

    res.status(201).json({ message: 'Note added successfully.' });
  } catch (err) {
    console.error('Add note error:', err);
    res.status(500).json({ error: 'Failed to add note.' });
  }
});

router.post('/:id/complete', authenticate, authorize('technician'), upload.array('photos', 5), (req, res) => {
  try {
    const { completion_notes } = req.body;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (task.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Task must be in IN_PROGRESS status.' });

    const assignment = db.prepare('SELECT * FROM task_assignments WHERE task_id = ? AND technician_id = ?').get(req.params.id, req.user.id);
    if (!assignment) return res.status(403).json({ error: 'You are not assigned to this task.' });

    db.prepare('UPDATE tasks SET status = ?, completed_by = ?, completed_at = datetime(\'now\', \'localtime\'), completion_notes = ? WHERE id = ?').run('COMPLETED', req.user.id, completion_notes || null, req.params.id);

    if (req.files && req.files.length > 0) {
      const insertPhoto = db.prepare('INSERT INTO task_photos (task_id, user_id, file_path, type) VALUES (?, ?, ?, ?)');
      req.files.forEach(file => {
        insertPhoto.run(req.params.id, req.user.id, file.filename, 'completion');
      });
    }

    logActivity(req.params.id, req.user.id, 'TASK_COMPLETED', `Task marked complete by ${req.user.name}`);

    res.json({ message: 'Task marked as completed.' });
  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ error: 'Failed to complete task.' });
  }
});

router.post('/:id/approve', authenticate, authorize('admin'), (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (task.status !== 'COMPLETED') return res.status(400).json({ error: 'Task must be in COMPLETED status.' });

    db.prepare('UPDATE tasks SET status = ?, closed_by = ?, closed_at = datetime(\'now\', \'localtime\') WHERE id = ?').run('CLOSED', req.user.id, req.params.id);
    logActivity(req.params.id, req.user.id, 'TASK_CLOSED', `Task closed by ${req.user.name}`);

    res.json({ message: 'Task closed successfully.' });
  } catch (err) {
    console.error('Approve task error:', err);
    res.status(500).json({ error: 'Failed to approve task.' });
  }
});

router.post('/:id/reopen', authenticate, authorize('admin'), (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (task.status !== 'COMPLETED') return res.status(400).json({ error: 'Task must be in COMPLETED status.' });

    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('IN_PROGRESS', req.params.id);
    logActivity(req.params.id, req.user.id, 'TASK_REOPENED', `Task reopened by ${req.user.name}`);

    res.json({ message: 'Task reopened. Status set to IN PROGRESS.' });
  } catch (err) {
    console.error('Reopen task error:', err);
    res.status(500).json({ error: 'Failed to reopen task.' });
  }
});

router.get('/:id/photos/:filename', authenticate, (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  res.sendFile(filePath);
});

module.exports = router;
