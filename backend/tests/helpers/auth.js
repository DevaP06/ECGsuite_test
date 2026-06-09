import jwt from 'jsonwebtoken';
import User from '../../src/models/User.js';

let _counter = 0;
function uid() { return `${++_counter}`; }
function roleSlug(role) { return role.slice(0, 3).toLowerCase(); }

export async function createUser({ role = 'PATIENT', username, email, password = 'Password123!' } = {}) {
  const id = uid();
  return User.create({
    username: username || `t_${roleSlug(role)}_${id}`,
    email:    email    || `t_${roleSlug(role)}_${id}@test.ecgenius`,
    password,
    role,
    status: 'active',
    authProvider: 'local',
    onboardingStep: 'complete',
  });
}

export function makeToken(userId) {
  return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export function authHeader(userId) {
  return { Authorization: `Bearer ${makeToken(userId)}` };
}

export async function createPatient(overrides = {}) {
  return createUser({ role: 'PATIENT', ...overrides });
}

export async function createCardiologist(overrides = {}) {
  return createUser({ role: 'CARDIOLOGIST', ...overrides });
}

export async function createAdmin(overrides = {}) {
  return createUser({ role: 'ADMIN', ...overrides });
}
