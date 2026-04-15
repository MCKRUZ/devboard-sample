const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users
router.get('/', (req, res) => {
  const users = db.getAllUsers();
  res.json(users);
});

// GET /api/users/:id  (intentional bug: no 404 handling)
router.get('/:id', (req, res) => {
  const user = db.getUserById(req.params.id);
  const tasks = db.getAllTasks({ assignee: req.params.id });
  res.json({ ...user, tasks });
});

// POST /api/users
router.post('/', (req, res) => {
  const { name, email } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  try {
    const user = db.createUser({ name, email });
    res.status(201).json(user);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'email already exists' });
    }
    throw err;
  }
});

// DELETE /api/users/:id  (intentional: no cascade delete of tasks)
router.delete('/:id', (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.getDb().prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
