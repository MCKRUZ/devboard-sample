const request = require('supertest');

// Use a fresh in-memory DB for each test run
process.env.DB_PATH = ':memory:';

const app = require('../src/index');

describe('Tasks API', () => {
  test('GET /api/tasks returns an array', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/tasks?status=todo returns only todo tasks', async () => {
    const res = await request(app).get('/api/tasks?status=todo');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((task) => {
      expect(task.status).toBe('todo');
    });
  });

  test('GET /api/tasks?status=done returns only done tasks', async () => {
    const res = await request(app).get('/api/tasks?status=done');
    expect(res.status).toBe(200);
    res.body.forEach((task) => {
      expect(task.status).toBe('done');
    });
  });

  test('POST /api/tasks with valid data returns 201 and created task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task', description: 'A test', status: 'todo' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test task');
    expect(res.body.description).toBe('A test');
    expect(res.body.status).toBe('todo');
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/tasks without title returns 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ description: 'Missing title' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title is required');
  });

  test('PATCH /api/tasks/:id updates status', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Status test task' });

    expect(created.status).toBe(201);

    const res = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  test('PATCH /api/tasks/:id returns 404 for unknown id', async () => {
    const res = await request(app)
      .patch('/api/tasks/99999')
      .send({ status: 'done' });

    expect(res.status).toBe(404);
  });

  test('DELETE /api/tasks/:id removes the task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task to delete' });

    expect(created.status).toBe(201);
    const id = created.body.id;

    const del = await request(app).delete(`/api/tasks/${id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/tasks/${id}`);
    expect(get.status).toBe(404);
  });

  test('GET /api/tasks/:id returns a single task', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Single fetch task' });

    const res = await request(app).get(`/api/tasks/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.title).toBe('Single fetch task');
  });
});
