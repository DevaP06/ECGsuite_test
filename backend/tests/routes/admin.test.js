import request from 'supertest';
import app from '../testApp.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';
import { createAdmin, createCardiologist, createPatient, authHeader } from '../helpers/auth.js';

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

// ── RBAC enforcement ──────────────────────────────────────────────────────────

describe('Admin RBAC', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('returns 403 for CARDIOLOGIST', async () => {
    const cardio = await createCardiologist();
    const res = await request(app).get('/api/admin/stats').set(authHeader(cardio._id));
    expect(res.status).toBe(403);
  });

  it('returns 403 for PATIENT', async () => {
    const patient = await createPatient();
    const res = await request(app).get('/api/admin/stats').set(authHeader(patient._id));
    expect(res.status).toBe(403);
  });
});

// ── GET /stats ────────────────────────────────────────────────────────────────

describe('GET /api/admin/stats', () => {
  it('returns system stats for ADMIN', async () => {
    const admin = await createAdmin();
    const res = await request(app).get('/api/admin/stats').set(authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // data shape: { users: { total, ... }, analyses: { total, ... } }
    expect(res.body.data).toHaveProperty('users');
    expect(res.body.data).toHaveProperty('analyses');
    expect(res.body.data.users).toHaveProperty('total');
    expect(res.body.data.analyses).toHaveProperty('total');
  });
});

// ── GET /reports ──────────────────────────────────────────────────────────────

describe('GET /api/admin/reports', () => {
  it('returns report data with expected shape', async () => {
    const admin = await createAdmin();
    const res = await request(app).get('/api/admin/reports').set(authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('analyses');
    expect(res.body.data).toHaveProperty('reviews');
    expect(res.body.data).toHaveProperty('users');
    expect(res.body.data.analyses).toHaveProperty('total');
    expect(res.body.data.analyses).toHaveProperty('successRate');
  });

  it('accepts a custom ?days= parameter and reflects it in period', async () => {
    const admin = await createAdmin();
    const res = await request(app).get('/api/admin/reports?days=7').set(authHeader(admin._id));
    expect(res.status).toBe(200);
    // period is { days, since } — controller clamps 1..90, returns 200 either way
    expect(res.body.data.period.days).toBe(7);
  });

  it('treats days=0 as missing (falsy) and defaults to 30', async () => {
    const admin = await createAdmin();
    const res = await request(app).get('/api/admin/reports?days=0').set(authHeader(admin._id));
    expect(res.status).toBe(200);
    // parseInt('0') is 0 (falsy), so `0 || 30` evaluates to 30
    expect(res.body.data.period.days).toBe(30);
  });

  it('clamps days=91 to 90 and still returns 200', async () => {
    const admin = await createAdmin();
    const res = await request(app).get('/api/admin/reports?days=91').set(authHeader(admin._id));
    expect(res.status).toBe(200);
    expect(res.body.data.period.days).toBe(90);
  });
});

// ── GET /health ───────────────────────────────────────────────────────────────

describe('GET /api/admin/health', () => {
  it('returns server health with uptime for ADMIN', async () => {
    const admin = await createAdmin();
    const res = await request(app).get('/api/admin/health').set(authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // data is flat — no .health wrapper
    const d = res.body.data;
    expect(d).toHaveProperty('server');
    expect(d.server.uptimeSeconds).toBeGreaterThan(0);
    expect(d).toHaveProperty('analysisQueue');
    expect(d).toHaveProperty('throughput24h');
    expect(d).toHaveProperty('reviewQueue');
  });
});

// ── GET /users ────────────────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  it('returns the user list for ADMIN', async () => {
    const admin = await createAdmin();
    await createPatient();
    await createCardiologist();

    const res = await request(app).get('/api/admin/users').set(authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(3);
  });
});

// ── GET /audit-logs ───────────────────────────────────────────────────────────

describe('GET /api/admin/audit-logs', () => {
  it('returns empty audit log list on fresh DB', async () => {
    const admin = await createAdmin();
    const res = await request(app).get('/api/admin/audit-logs').set(authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.logs)).toBe(true);
  });
});
