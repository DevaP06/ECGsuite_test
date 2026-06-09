import request from 'supertest';
import app from '../testApp.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';
import { createCardiologist, createPatient, authHeader } from '../helpers/auth.js';
import ECGAnalysis from '../../src/models/ECGAnalysis.js';

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

const FAKE_OID = '507f1f77bcf86cd799439011';

// ── POST /feedback ────────────────────────────────────────────────────────────

describe('POST /api/analytics/feedback', () => {
  it('returns 403 for non-CARDIOLOGIST', async () => {
    const patient = await createPatient();
    const res = await request(app)
      .post('/api/analytics/feedback')
      .set(authHeader(patient._id))
      .send({ analysisId: FAKE_OID, feedbackType: 'accurate' });
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid analysisId format', async () => {
    const cardio = await createCardiologist();
    const res = await request(app)
      .post('/api/analytics/feedback')
      .set(authHeader(cardio._id))
      .send({ analysisId: 'not-an-oid', feedbackType: 'accurate' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid feedbackType', async () => {
    const cardio = await createCardiologist();
    const res = await request(app)
      .post('/api/analytics/feedback')
      .set(authHeader(cardio._id))
      .send({ analysisId: FAKE_OID, feedbackType: 'banana' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when analysis does not exist', async () => {
    const cardio = await createCardiologist();
    const res = await request(app)
      .post('/api/analytics/feedback')
      .set(authHeader(cardio._id))
      .send({ analysisId: FAKE_OID, feedbackType: 'model_correct' });
    expect(res.status).toBe(404);
  });

  it('creates feedback for a valid completed analysis', async () => {
    const cardio = await createCardiologist();
    const analysis = await ECGAnalysis.create({
      userId: cardio._id,
      fileName: 'test.csv',
      originalName: 'test.csv',
      filePath: '/tmp/test.csv',
      fileSize: 1000,
      patientInfo: { name: 'Test Patient', age: 45, gender: 'male' },
      status: 'completed',
    });

    const res = await request(app)
      .post('/api/analytics/feedback')
      .set(authHeader(cardio._id))
      .send({ analysisId: analysis._id.toString(), feedbackType: 'model_correct', notes: 'Confirmed' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.feedback.feedbackType).toBe('model_correct');
  });
});

// ── GET /review-metrics ───────────────────────────────────────────────────────

describe('GET /api/analytics/review-metrics', () => {
  it('returns 403 for PATIENT', async () => {
    const patient = await createPatient();
    const res = await request(app).get('/api/analytics/review-metrics').set(authHeader(patient._id));
    expect(res.status).toBe(403);
  });

  it('returns zeroed metrics for CARDIOLOGIST on empty DB', async () => {
    const cardio = await createCardiologist();
    const res = await request(app).get('/api/analytics/review-metrics').set(authHeader(cardio._id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('metrics');
    const m = res.body.data.metrics;
    expect(m).toHaveProperty('totalReviewed');
    expect(m).toHaveProperty('accuracy');
    expect(m.totalReviewed).toBe(0);
  });
});

// ── GET /insights ─────────────────────────────────────────────────────────────

describe('GET /api/analytics/insights', () => {
  it('returns empty insight arrays on empty DB', async () => {
    const cardio = await createCardiologist();
    const res = await request(app).get('/api/analytics/insights').set(authHeader(cardio._id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('insights');
    const i = res.body.data.insights;
    expect(Array.isArray(i.diagnosisDistribution)).toBe(true);
    expect(Array.isArray(i.topAbnormalities)).toBe(true);
  });
});
