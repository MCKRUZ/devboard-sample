const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/tasks
router.get('/', (req, res) => {
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.assignee) filters.assignee = req.query.assignee;

  const tasks = db.getAllTasks(filters);
  res.json(tasks);
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = db.getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, status, assignee_id } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const task = db.createTask({ title, description, status, assignee_id });
  res.status(201).json(task);
});

// PATCH /api/tasks/:id
router.patch('/:id', (req, res) => {
  const existing = db.getTaskById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, status, assignee_id } = req.body;
  const task = db.updateTask(req.params.id, { title, description, status, assignee_id });
  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const existing = db.getTaskById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  db.deleteTask(req.params.id);
  res.status(204).send();
});

module.exports = router;
