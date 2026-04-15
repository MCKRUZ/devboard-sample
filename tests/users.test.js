const request = require('supertest');

process.env.DB_PATH = ':memory:';

const app = require('../src/index');

describe('Users API', () => {
  test('GET /api/users returns an array', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('POST /api/users with valid data returns 201', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Dana Lee', email: 'dana@test.local' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Dana Lee');
    expect(res.body.email).toBe('dana@test.local');
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/users without name returns 400', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'noname@test.local' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('name is required');
  });

  test('POST /api/users without email returns 400', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'No Email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('email is required');
  });

  test('POST /api/users with duplicate email returns 409', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'First User', email: 'dupe@test.local' });

    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Second User', email: 'dupe@test.local' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('email already exists');
  });

  test('GET /api/users/:id returns user with their tasks', async () => {
    const userRes = await request(app)
      .post('/api/users')
      .send({ name: 'Task Owner', email: 'owner@test.local' });

    const userId = userRes.body.id;

    await request(app)
      .post('/api/tasks')
      .send({ title: 'Owned task', assignee_id: userId });

    const res = await request(app).get(`/api/users/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThanOrEqual(1);
  });

  test('DELETE /api/users/:id removes the user', async () => {
    const created = await request(app)
      .post('/api/users')
      .send({ name: 'Delete Me', email: 'deleteme@test.local' });

    const del = await request(app).delete(`/api/users/${created.body.id}`);
    expect(del.status).toBe(204);
  });

  test('DELETE /api/users/:id returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/users/99999');
    expect(res.status).toBe(404);
  });
});
