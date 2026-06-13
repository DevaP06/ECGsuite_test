import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../testApp.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';
import { createPatient, authHeader } from '../helpers/auth.js';

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

// Pulls the `refreshToken=<value>` cookie pair out of a response's Set-Cookie
// header so it can be replayed via `.set('Cookie', ...)` on the next request.
function extractRefreshCookie(res) {
  const setCookie = res.headers['set-cookie'] || [];
  const cookie = setCookie.find((c) => c.startsWith('refreshToken='));
  return cookie ? cookie.split(';')[0] : null;
}

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
    // Refresh token is delivered via httpOnly cookie, never in the response body.
    expect(res.body.data).not.toHaveProperty('refreshToken');
    const refreshCookie = (res.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toMatch(/HttpOnly/i);
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
    const refreshCookie = (res.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toMatch(/HttpOnly/i);
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

// ── Refresh ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('returns 401 when no refresh cookie is present', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an unknown refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=not-a-real-token');

    expect(res.status).toBe(401);
  });

  it('rotates the refresh token and issues a new access token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'refreshuser', email: 'refresh@ecgenius.test', password: 'Secret123!' });

    const originalCookie = extractRefreshCookie(registerRes);
    expect(originalCookie).toBeTruthy();

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie);

    expect(refreshRes.status).toBe(200);
    // The access token's claims ({id, role}, iat, exp) can legitimately be
    // identical to the one issued at registration if both happen within the
    // same second — JWT signing is deterministic, so this isn't a meaningful
    // thing to assert. The refresh-token cookie rotating (below) is what matters.
    expect(typeof refreshRes.body.data.token).toBe('string');
    expect(refreshRes.body.data.token.length).toBeGreaterThan(0);
    expect(refreshRes.body.data).not.toHaveProperty('refreshToken');

    const rotatedCookie = extractRefreshCookie(refreshRes);
    expect(rotatedCookie).toBeTruthy();
    expect(rotatedCookie).not.toBe(originalCookie);
  });

  it('rejects reuse of a rotated refresh token and revokes the whole family', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'reuseuser', email: 'reuse@ecgenius.test', password: 'Secret123!' });

    const originalCookie = extractRefreshCookie(registerRes);

    const firstRefresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie);
    expect(firstRefresh.status).toBe(200);
    const rotatedCookie = extractRefreshCookie(firstRefresh);

    // Replaying the now-revoked original cookie is treated as token theft.
    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie);
    expect(reuseRes.status).toBe(401);

    // The whole token family — including the cookie issued by the first
    // refresh — should now be revoked too.
    const rotatedRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', rotatedCookie);
    expect(rotatedRes.status).toBe(401);
  });
});

// ── Logout ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('returns 200 even when no refresh cookie is present', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('clears the cookie and revokes the refresh token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'logoutuser', email: 'logout@ecgenius.test', password: 'Secret123!' });

    const cookie = extractRefreshCookie(registerRes);

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    const clearedCookie = (logoutRes.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='));
    expect(clearedCookie.split(';')[0]).toBe('refreshToken=');
    expect(clearedCookie).toMatch(/Expires=Thu, 01 Jan 1970/);

    // The revoked token can no longer be used to refresh.
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie);
    expect(refreshRes.status).toBe(401);
  });
});
