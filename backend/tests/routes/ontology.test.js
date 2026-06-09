import request from 'supertest';
import app from '../testApp.js';
import { connect, closeDatabase, clearDatabase } from '../setup.js';
import { createPatient, createCardiologist, createAdmin, authHeader } from '../helpers/auth.js';
import OntologyRule from '../../src/models/OntologyRule.js';

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

const VALID_RULE = {
  code: 'SNO-427084000',
  display: 'Atrial fibrillation',
  system: 'snomed',
  urgencyTier: 'critical',
  confidenceThreshold: 80,
};

// ── GET /rules ───────────────────────────────────────────────────────────────

describe('GET /api/ontology/rules', () => {
  it('returns 403 for PATIENT role', async () => {
    const patient = await createPatient();
    const res = await request(app).get('/api/ontology/rules').set(authHeader(patient._id));
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/ontology/rules');
    expect(res.status).toBe(401);
  });

  it('returns empty array for CARDIOLOGIST when no rules exist', async () => {
    const cardio = await createCardiologist();
    const res = await request(app).get('/api/ontology/rules').set(authHeader(cardio._id));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rules).toEqual([]);
  });

  it('returns active rules sorted by urgency for ADMIN', async () => {
    const admin = await createAdmin();
    await OntologyRule.create([
      { ...VALID_RULE, code: 'LOW-001', urgencyTier: 'low', display: 'Low Rule' },
      { ...VALID_RULE, code: 'CRIT-001', urgencyTier: 'critical', display: 'Critical Rule' },
    ]);

    const res = await request(app).get('/api/ontology/rules').set(authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.data.rules).toHaveLength(2);
    expect(res.body.data.rules[0].urgencyTier).toBe('critical');
  });

  it('does not return inactive rules', async () => {
    const cardio = await createCardiologist();
    await OntologyRule.create({ ...VALID_RULE, active: false });

    const res = await request(app).get('/api/ontology/rules').set(authHeader(cardio._id));

    expect(res.status).toBe(200);
    expect(res.body.data.rules).toHaveLength(0);
  });
});

// ── GET /rules/:id ───────────────────────────────────────────────────────────

describe('GET /api/ontology/rules/:id', () => {
  it('returns 400 for a malformed ID', async () => {
    const cardio = await createCardiologist();
    const res = await request(app).get('/api/ontology/rules/not-an-id').set(authHeader(cardio._id));
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown valid ID', async () => {
    const cardio = await createCardiologist();
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app).get(`/api/ontology/rules/${fakeId}`).set(authHeader(cardio._id));
    expect(res.status).toBe(404);
  });

  it('returns the rule for a valid ID', async () => {
    const cardio = await createCardiologist();
    const rule = await OntologyRule.create(VALID_RULE);

    const res = await request(app).get(`/api/ontology/rules/${rule._id}`).set(authHeader(cardio._id));

    expect(res.status).toBe(200);
    expect(res.body.data.rule.code).toBe(VALID_RULE.code);
  });
});

// ── POST /rules ──────────────────────────────────────────────────────────────

describe('POST /api/ontology/rules', () => {
  it('returns 403 for CARDIOLOGIST', async () => {
    const cardio = await createCardiologist();
    const res = await request(app).post('/api/ontology/rules').set(authHeader(cardio._id)).send(VALID_RULE);
    expect(res.status).toBe(403);
  });

  it('returns 400 when code is missing', async () => {
    const admin = await createAdmin();
    const { code: _, ...noCode } = VALID_RULE;
    const res = await request(app).post('/api/ontology/rules').set(authHeader(admin._id)).send(noCode);
    expect(res.status).toBe(400);
  });

  it('returns 400 when system is invalid', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post('/api/ontology/rules')
      .set(authHeader(admin._id))
      .send({ ...VALID_RULE, system: 'invalid-system' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when urgencyTier is invalid', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post('/api/ontology/rules')
      .set(authHeader(admin._id))
      .send({ ...VALID_RULE, urgencyTier: 'extreme' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when confidenceThreshold is out of range', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post('/api/ontology/rules')
      .set(authHeader(admin._id))
      .send({ ...VALID_RULE, confidenceThreshold: 150 });
    expect(res.status).toBe(400);
  });

  it('creates a rule and returns 201 for ADMIN', async () => {
    const admin = await createAdmin();
    const res = await request(app).post('/api/ontology/rules').set(authHeader(admin._id)).send(VALID_RULE);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rule.code).toBe(VALID_RULE.code);
    expect(res.body.data.rule.active).toBe(true);
  });

  it('returns 409 on duplicate code', async () => {
    const admin = await createAdmin();
    await request(app).post('/api/ontology/rules').set(authHeader(admin._id)).send(VALID_RULE);
    const res = await request(app).post('/api/ontology/rules').set(authHeader(admin._id)).send(VALID_RULE);

    expect(res.status).toBe(409);
  });
});

// ── PATCH /rules/:id ─────────────────────────────────────────────────────────

describe('PATCH /api/ontology/rules/:id', () => {
  it('returns 400 for malformed ID', async () => {
    const cardio = await createCardiologist();
    const res = await request(app).patch('/api/ontology/rules/bad-id').set(authHeader(cardio._id)).send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 when rule does not exist', async () => {
    const cardio = await createCardiologist();
    const res = await request(app)
      .patch('/api/ontology/rules/507f1f77bcf86cd799439011')
      .set(authHeader(cardio._id))
      .send({ display: 'Updated' });
    expect(res.status).toBe(404);
  });

  it('returns 400 on invalid urgencyTier update', async () => {
    const admin = await createAdmin();
    const rule = await OntologyRule.create(VALID_RULE);
    const res = await request(app)
      .patch(`/api/ontology/rules/${rule._id}`)
      .set(authHeader(admin._id))
      .send({ urgencyTier: 'nonexistent' });
    expect(res.status).toBe(400);
  });

  it('updates display for CARDIOLOGIST', async () => {
    const cardio = await createCardiologist();
    const rule = await OntologyRule.create(VALID_RULE);
    const res = await request(app)
      .patch(`/api/ontology/rules/${rule._id}`)
      .set(authHeader(cardio._id))
      .send({ display: 'Updated Display' });

    expect(res.status).toBe(200);
    expect(res.body.data.rule.display).toBe('Updated Display');
  });
});

// ── DELETE /rules/:id ────────────────────────────────────────────────────────

describe('DELETE /api/ontology/rules/:id', () => {
  it('returns 403 for CARDIOLOGIST', async () => {
    const cardio = await createCardiologist();
    const rule = await OntologyRule.create(VALID_RULE);
    const res = await request(app).delete(`/api/ontology/rules/${rule._id}`).set(authHeader(cardio._id));
    expect(res.status).toBe(403);
  });

  it('soft-deactivates the rule for ADMIN', async () => {
    const admin = await createAdmin();
    const rule = await OntologyRule.create(VALID_RULE);
    const res = await request(app).delete(`/api/ontology/rules/${rule._id}`).set(authHeader(admin._id));

    expect(res.status).toBe(200);
    expect(res.body.data.rule.active).toBe(false);
  });

  it('returns 409 when rule is already inactive', async () => {
    const admin = await createAdmin();
    const rule = await OntologyRule.create({ ...VALID_RULE, active: false });
    const res = await request(app).delete(`/api/ontology/rules/${rule._id}`).set(authHeader(admin._id));

    expect(res.status).toBe(409);
  });

  it('returns 404 for non-existent ID', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .delete('/api/ontology/rules/507f1f77bcf86cd799439011')
      .set(authHeader(admin._id));
    expect(res.status).toBe(404);
  });
});
