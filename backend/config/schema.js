const db = require('./db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      await db.execute('SELECT 1');
      break;
    } catch (e) {
      if (attempt === 15) throw e;
      console.log(`Waiting for database... attempt ${attempt}/15`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'technician')),
    mobile TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS tasks (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP,
    completed_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP,
    closed_by INTEGER REFERENCES users(id),
    closed_at TIMESTAMP,
    completion_notes TEXT,
    clarification_request TEXT,
    clarification_response TEXT
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS task_assignments (
    id SERIAL PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    technician_id INTEGER NOT NULL REFERENCES users(id),
    is_lead INTEGER DEFAULT 0,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS task_notes (
    id SERIAL PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    note TEXT NOT NULL,
    is_progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS task_photos (
    id SERIAL PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    file_path TEXT NOT NULL,
    type TEXT DEFAULT 'completion',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS clarifications (
    id SERIAL PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'request' CHECK(type IN ('request', 'response')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  const adminExists = await db.queryOne('SELECT id FROM users WHERE username = $1', ['admin']);
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await db.execute('INSERT INTO users (username, password, name, role, mobile) VALUES ($1, $2, $3, $4, $5)',
      ['admin', hashedPassword, 'System Admin', 'admin', '0000000000']);
  }

  const techExists = await db.queryOne('SELECT id FROM users WHERE username = $1', ['tech1']);
  if (!techExists) {
    const hashedPassword = bcrypt.hashSync('tech123', 10);
    await db.execute('INSERT INTO users (username, password, name, role, mobile) VALUES ($1, $2, $3, $4, $5)',
      ['tech1', hashedPassword, 'John Technician', 'technician', '1111111111']);
    await db.execute('INSERT INTO users (username, password, name, role, mobile) VALUES ($1, $2, $3, $4, $5)',
      ['tech2', hashedPassword, 'Jane Technician', 'technician', '2222222222']);
    await db.execute('INSERT INTO users (username, password, name, role, mobile) VALUES ($1, $2, $3, $4, $5)',
      ['tech3', hashedPassword, 'Bob Technician', 'technician', '3333333333']);
  }
}

module.exports = initializeDatabase;
