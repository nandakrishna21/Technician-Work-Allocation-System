const db = require('./db');
const bcrypt = require('bcryptjs');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'technician')),
      mobile TEXT,
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      contact_person TEXT,
      mobile_number TEXT,
      location TEXT NOT NULL,
      job_type TEXT NOT NULL,
      description TEXT,
      special_instructions TEXT,
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('High', 'Medium', 'Low')),
      attachment TEXT,
      status TEXT NOT NULL DEFAULT 'CREATED' CHECK(status IN ('CREATED','ASSIGNED','ACCEPTED','IN_PROGRESS','COMPLETED','CLOSED')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      assigned_by INTEGER REFERENCES users(id),
      assigned_at DATETIME,
      completed_by INTEGER REFERENCES users(id),
      completed_at DATETIME,
      closed_by INTEGER REFERENCES users(id),
      closed_at DATETIME,
      completion_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      technician_id INTEGER NOT NULL REFERENCES users(id),
      is_lead INTEGER DEFAULT 0,
      assigned_at DATETIME DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS task_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      note TEXT NOT NULL,
      is_progress INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS task_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      file_path TEXT NOT NULL,
      type TEXT DEFAULT 'completion',
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    );
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, name, role, mobile) VALUES (?, ?, ?, ?, ?)').run('admin', hashedPassword, 'System Admin', 'admin', '0000000000');
  }

  const techExists = db.prepare('SELECT id FROM users WHERE username = ?').get('tech1');
  if (!techExists) {
    const hashedPassword = bcrypt.hashSync('tech123', 10);
    db.prepare('INSERT INTO users (username, password, name, role, mobile) VALUES (?, ?, ?, ?, ?)').run('tech1', hashedPassword, 'John Technician', 'technician', '1111111111');
    db.prepare('INSERT INTO users (username, password, name, role, mobile) VALUES (?, ?, ?, ?, ?)').run('tech2', hashedPassword, 'Jane Technician', 'technician', '2222222222');
    db.prepare('INSERT INTO users (username, password, name, role, mobile) VALUES (?, ?, ?, ?, ?)').run('tech3', hashedPassword, 'Bob Technician', 'technician', '3333333333');
  }
}

module.exports = initializeDatabase;
