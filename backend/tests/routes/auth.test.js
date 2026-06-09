import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../testApp.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';
import { createPatient, authHeader } from '../helpers/auth.js';

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

// ── Register ────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser1', email: 'test1@ecgenius.test', password: 'Secret123!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toMatchObject({ username: 'testuser1', email: 'test1@ecgenius.test' });
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incomplete@ecgenius.test' });

    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    const payload = { username: 'user_dupe', email: 'dupe@ecgenius.test', password: 'Secret123!' };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send({ ...payload, username: 'user_dupe2' });

    expect(res.status).toBe(409);
  });

  it('returns 409 on duplicate username', async () => {
    const payload = { username: 'same_name', email: 'first@ecgenius.test', password: 'Secret123!' };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send({ ...payload, email: 'second@ecgenius.test' });

    expect(res.status).toBe(409);
  });
});

// ── Login ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'logintest', email: 'login@ecgenius.test', password: 'Correct123!' });
  });

  it('returns 200 with token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ emailOrUsername: 'login@ecgenius.test', password: 'Correct123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('accepts username as emailOrUsername', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ emailOrUsername: 'logintest', password: 'Correct123!' });

    expect(res.status).toBe(200);
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ emailOrUsername: 'login@ecgenius.test', password: 'WrongPass!' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ emailOrUsername: 'nobody@ecgenius.test', password: 'Anything1!' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ emailOrUsername: 'login@ecgenius.test' });

    expect(res.status).toBe(400);
  });
});

// ── GET /me ──────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the authenticated user', async () => {
    const user = await createPatient();
    const res = await request(app).get('/api/auth/me').set(authHeader(user._id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(user.email);
  });
});

// ── PATCH /me ────────────────────────────────────────────────────────────────

describe('PATCH /api/auth/me', () => {
  it('updates fullName and returns the updated user', async () => {
    const user = await createPatient();
    const res = await request(app)
      .patch('/api/auth/me')
      .set(authHeader(user._id))
      .send({ fullName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.fullName).toBe('Updated Name');
  });
});
