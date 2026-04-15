const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || ':memory:';

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    seedData();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
      assignee_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?)'
  );
  const u1 = insertUser.run('Alice Chen', 'alice@devboard.local');
  const u2 = insertUser.run('Bob Torres', 'bob@devboard.local');
  const u3 = insertUser.run('Carol Smith', 'carol@devboard.local');

  const insertTask = db.prepare(
    `INSERT INTO tasks (title, description, status, assignee_id) VALUES (?, ?, ?, ?)`
  );
  insertTask.run('Set up CI pipeline', 'Configure GitHub Actions for build and test', 'done', u1.lastInsertRowid);
  insertTask.run('Design database schema', 'ERD for core entities', 'done', u2.lastInsertRowid);
  insertTask.run('Implement auth middleware', 'JWT-based auth for all API routes', 'in_progress', u1.lastInsertRowid);
  insertTask.run('Write API documentation', 'OpenAPI spec for all endpoints', 'in_progress', u3.lastInsertRowid);
  insertTask.run('Add rate limiting', 'Protect public endpoints from abuse', 'todo', u2.lastInsertRowid);
  insertTask.run('Fix CORS configuration', null, 'todo', null);
  insertTask.run('Add request logging', 'Structured logs for all incoming requests', 'todo', u3.lastInsertRowid);
  insertTask.run('Deploy to staging', 'Push latest build to staging environment', 'todo', null);
}

// Task helpers
function getAllTasks(filters = {}) {
  let query = `
    SELECT t.*, u.name as assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    query += ' AND t.status = ?';
    params.push(filters.status);
  }
  if (filters.assignee) {
    query += ' AND t.assignee_id = ?';
    params.push(filters.assignee);
  }

  query += ' ORDER BY t.created_at DESC';
  return getDb().prepare(query).all(...params);
}

function getTaskById(id) {
  return getDb().prepare(
    `SELECT t.*, u.name as assignee_name
     FROM tasks t
     LEFT JOIN users u ON t.assignee_id = u.id
     WHERE t.id = ?`
  ).get(id);
}

function createTask(data) {
  const { title, description = null, status = 'todo', assignee_id = null } = data;
  const result = getDb().prepare(
    `INSERT INTO tasks (title, description, status, assignee_id) VALUES (?, ?, ?, ?)`
  ).run(title, description, status, assignee_id);
  return getTaskById(result.lastInsertRowid);
}

function updateTask(id, data) {
  const fields = [];
  const params = [];

  if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
  if (data.assignee_id !== undefined) { fields.push('assignee_id = ?'); params.push(data.assignee_id); }

  if (fields.length === 0) return getTaskById(id);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  getDb().prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return getTaskById(id);
}

function deleteTask(id) {
  return getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

// User helpers
function getAllUsers() {
  return getDb().prepare('SELECT * FROM users ORDER BY name').all();
}

function getUserById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function createUser(data) {
  const { name, email } = data;
  const result = getDb().prepare(
    'INSERT INTO users (name, email) VALUES (?, ?)'
  ).run(name, email);
  return getUserById(result.lastInsertRowid);
}

module.exports = {
  getDb,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAllUsers,
  getUserById,
  createUser,
};
