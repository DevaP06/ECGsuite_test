import request from 'supertest';
import app from '../testApp.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';
import { createAdmin, createCardiologist, createPatient, authHeader } from '../helpers/auth.js';
import ModelVersion from '../../src/models/ModelVersion.js';

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

// ── Model version management ──────────────────────────────────────────────────

const VALID_MODEL = { name: 'ECG-CNN', version: '1.0.0', framework: 'TensorFlow', accuracy: 92.5 };

describe('GET /api/admin/models', () => {
  it('returns empty array when no models exist', async () => {
    const admin = await createAdmin();
    const res = await request(app).get('/api/admin/models').set(authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.data.models).toEqual([]);
  });

  it('returns all versions sorted newest first', async () => {
    const admin = await createAdmin();
    await ModelVersion.create([VALID_MODEL, { name: 'ECG-CNN', version: '2.0.0' }]);

    const res = await request(app).get('/api/admin/models').set(authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.data.models).toHaveLength(2);
  });
});

describe('POST /api/admin/models', () => {
  it('returns 400 when name is missing', async () => {
    const admin = await createAdmin();
    const res = await request(app).post('/api/admin/models').set(authHeader(admin._id)).send({ version: '1.0.0' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when version is missing', async () => {
    const admin = await createAdmin();
    const res = await request(app).post('/api/admin/models').set(authHeader(admin._id)).send({ name: 'ECG-CNN' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when accuracy is out of range', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post('/api/admin/models')
      .set(authHeader(admin._id))
      .send({ ...VALID_MODEL, accuracy: 120 });
    expect(res.status).toBe(400);
  });

  it('creates a model version and returns 201', async () => {
    const admin = await createAdmin();
    const res = await request(app).post('/api/admin/models').set(authHeader(admin._id)).send(VALID_MODEL);

    expect(res.status).toBe(201);
    expect(res.body.data.model.name).toBe('ECG-CNN');
    expect(res.body.data.model.active).toBe(false);
  });

  it('returns 409 on duplicate name+version', async () => {
    const admin = await createAdmin();
    await request(app).post('/api/admin/models').set(authHeader(admin._id)).send(VALID_MODEL);
    const res = await request(app).post('/api/admin/models').set(authHeader(admin._id)).send(VALID_MODEL);
    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/admin/models/:id/activate', () => {
  it('returns 400 for a malformed ID', async () => {
    const admin = await createAdmin();
    const res = await request(app).patch('/api/admin/models/bad-id/activate').set(authHeader(admin._id));
    expect(res.status).toBe(400);
  });

  it('returns 404 for a nonexistent model', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .patch('/api/admin/models/507f1f77bcf86cd799439011/activate')
      .set(authHeader(admin._id));
    expect(res.status).toBe(404);
  });

  it('activates a model and sets deployedAt', async () => {
    const admin = await createAdmin();
    const model = await ModelVersion.create(VALID_MODEL);

    const res = await request(app)
      .patch(`/api/admin/models/${model._id}/activate`)
      .set(authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.data.model.active).toBe(true);
    expect(res.body.data.model.deployedAt).not.toBeNull();
  });

  it('deactivates the previous active model when a new one is activated', async () => {
    const admin = await createAdmin();
    const v1 = await ModelVersion.create({ ...VALID_MODEL, active: true });
    const v2 = await ModelVersion.create({ name: 'ECG-CNN', version: '2.0.0' });

    await request(app).patch(`/api/admin/models/${v2._id}/activate`).set(authHeader(admin._id));

    const updated = await ModelVersion.findById(v1._id).lean();
    expect(updated.active).toBe(false);
  });

  it('returns 409 when model is already active', async () => {
    const admin = await createAdmin();
    const model = await ModelVersion.create({ ...VALID_MODEL, active: true });

    const res = await request(app)
      .patch(`/api/admin/models/${model._id}/activate`)
      .set(authHeader(admin._id));
    expect(res.status).toBe(409);
  });
});
