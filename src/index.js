const express = require('express');
const path = require('path');

const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/users');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DevBoard listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
