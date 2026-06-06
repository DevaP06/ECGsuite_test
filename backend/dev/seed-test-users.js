/**
 * Seed script — creates one test account per platform role.
 * Safe to re-run: uses upsert so existing accounts are updated, not duplicated.
 *
 * Usage:
 *   node dev/seed-test-users.js
 *
 * Requires MONGO_URI to be set in backend/.env (or as an env var).
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('\n[seed] ERROR: MONGO_URI is not set.');
  console.error('[seed] Add MONGO_URI=<your-connection-string> to backend/.env\n');
  process.exit(1);
}

const SALT_ROUNDS = 10;
const PASSWORD    = 'Test@1234!';

const TEST_USERS = [
  { username: 'dr_test',      email: 'doctor@ecgenius.test',  role: 'PHC_DOCTOR'   },
  { username: 'cardio_test',  email: 'cardio@ecgenius.test',  role: 'CARDIOLOGIST' },
  { username: 'patient_test', email: 'patient@ecgenius.test', role: 'PATIENT'      },
  { username: 'admin_test',   email: 'admin@ecgenius.test',   role: 'ADMIN'        },
];

// Inline schema — mirrors User.js exactly for the fields we need.
// Using mongoose.models guard to avoid OverwriteModelError on re-runs.
const userSchema = new mongoose.Schema(
  {
    username:     { type: String, required: true, unique: true, trim: true },
    email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:     { type: String, select: false },
    role:         { type: String, enum: ['PATIENT', 'PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'], default: 'PHC_DOCTOR' },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    status:       { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    isVerified:   { type: Boolean, default: false },
    lastLogin:    { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model('User', userSchema);

async function seed() {
  console.log('\n[seed] Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log('[seed] Connected.\n');

  const hashed = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  for (const u of TEST_USERS) {
    await User.findOneAndUpdate(
      { email: u.email },
      {
        $set: {
          username:     u.username,
          email:        u.email,
          password:     hashed,
          role:         u.role,
          authProvider: 'local',
          status:       'active',
          isVerified:   true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓  ${u.role.padEnd(14)}  ${u.username.padEnd(16)}  ${u.email}`);
  }

  console.log(`\n[seed] Done. Shared password: ${PASSWORD}\n`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] Fatal error:', err.message);
  process.exit(1);
});
