import request from 'supertest';
import app from '../testApp.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';
import { createPatient, createCardiologist, createAdmin, authHeader } from '../helpers/auth.js';
import ECGAnalysis from '../../src/models/ECGAnalysis.js';

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

const FAKE_OID = '507f1f77bcf86cd799439011';

const baseAnalysis = (userId) => ({
  userId,
  fileName: 'ecg.csv',
  originalName: 'ecg.csv',
  filePath: '/tmp/ecg.csv',
  fileSize: 2048,
  patientInfo: { name: 'Test Patient', age: 35, gender: 'female' },
  status: 'uploaded',
});

// ── GET /my-analyses ──────────────────────────────────────────────────────────

describe('GET /api/ecg/my-analyses', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/ecg/my-analyses');
    expect(res.status).toBe(401);
  });

  it('returns empty array for a new user', async () => {
    const patient = await createPatient();
    const res = await request(app).get('/api/ecg/my-analyses').set(authHeader(patient._id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.analyses)).toBe(true);
    expect(res.body.data.analyses).toHaveLength(0);
  });

  it('returns only the authenticated users own analyses', async () => {
    const p1 = await createPatient();
    const p2 = await createPatient();
    await ECGAnalysis.create(baseAnalysis(p1._id));
    await ECGAnalysis.create(baseAnalysis(p2._id));

    const res = await request(app).get('/api/ecg/my-analyses').set(authHeader(p1._id));

    expect(res.status).toBe(200);
    expect(res.body.data.analyses).toHaveLength(1);
  });
});

// ── GET /analysis/:id ─────────────────────────────────────────────────────────

describe('GET /api/ecg/analysis/:id', () => {
  it('returns 400 for a malformed ID', async () => {
    const patient = await createPatient();
    const res = await request(app).get('/api/ecg/analysis/not-an-id').set(authHeader(patient._id));
    expect(res.status).toBe(400);
  });

  it('returns 404 for a valid but nonexistent ID', async () => {
    const patient = await createPatient();
    const res = await request(app).get(`/api/ecg/analysis/${FAKE_OID}`).set(authHeader(patient._id));
    expect(res.status).toBe(404);
  });

  it('returns the analysis to its owner', async () => {
    const patient = await createPatient();
    const analysis = await ECGAnalysis.create(baseAnalysis(patient._id));

    const res = await request(app).get(`/api/ecg/analysis/${analysis._id}`).set(authHeader(patient._id));

    expect(res.status).toBe(200);
    expect(res.body.data.analysis._id.toString()).toBe(analysis._id.toString());
  });

  it('returns 404 when a different patient tries to access another patients analysis', async () => {
    // Controller queries { _id, userId } for non-clinical roles — if ownership
    // does not match, findOne returns null, giving 404 instead of 403.
    // This prevents ID enumeration by non-privileged users.
    const owner = await createPatient();
    const other = await createPatient();
    const analysis = await ECGAnalysis.create(baseAnalysis(owner._id));

    const res = await request(app).get(`/api/ecg/analysis/${analysis._id}`).set(authHeader(other._id));
    expect(res.status).toBe(404);
  });

  it('allows CARDIOLOGIST to access any analysis', async () => {
    const patient = await createPatient();
    const cardio = await createCardiologist();
    const analysis = await ECGAnalysis.create(baseAnalysis(patient._id));

    const res = await request(app).get(`/api/ecg/analysis/${analysis._id}`).set(authHeader(cardio._id));
    expect(res.status).toBe(200);
  });
});

// ── GET /analysis/:id/report (PDF) ────────────────────────────────────────────

describe('GET /api/ecg/analysis/:id/report', () => {
  it('returns 422 when analysis is not completed', async () => {
    const patient = await createPatient();
    const analysis = await ECGAnalysis.create({ ...baseAnalysis(patient._id), status: 'pending' });

    const res = await request(app)
      .get(`/api/ecg/analysis/${analysis._id}/report`)
      .set(authHeader(patient._id));

    expect(res.status).toBe(422);
  });

  it('returns 404 for a nonexistent analysis', async () => {
    const patient = await createPatient();
    const res = await request(app)
      .get(`/api/ecg/analysis/${FAKE_OID}/report`)
      .set(authHeader(patient._id));

    expect(res.status).toBe(404);
  });

  it('returns 404 for a different patients analysis (ownership hidden, not 403)', async () => {
    const owner = await createPatient();
    const other = await createPatient();
    const analysis = await ECGAnalysis.create({ ...baseAnalysis(owner._id), status: 'completed' });

    const res = await request(app)
      .get(`/api/ecg/analysis/${analysis._id}/report`)
      .set(authHeader(other._id));

    expect(res.status).toBe(404);
  });
});

// ── PATCH /analysis/:id/notes ─────────────────────────────────────────────────

describe('PATCH /api/ecg/analysis/:id/notes', () => {
  it('returns 400 when notes field is missing', async () => {
    const patient = await createPatient();
    const analysis = await ECGAnalysis.create(baseAnalysis(patient._id));

    const res = await request(app)
      .patch(`/api/ecg/analysis/${analysis._id}/notes`)
      .set(authHeader(patient._id))
      .send({});

    expect(res.status).toBe(400);
  });

  it('updates notes successfully', async () => {
    const patient = await createPatient();
    const analysis = await ECGAnalysis.create(baseAnalysis(patient._id));

    const res = await request(app)
      .patch(`/api/ecg/analysis/${analysis._id}/notes`)
      .set(authHeader(patient._id))
      .send({ notes: 'Feels like palpitations after exercise' });

    expect(res.status).toBe(200);
    expect(res.body.data.analysis.notes).toBe('Feels like palpitations after exercise');
  });
});
