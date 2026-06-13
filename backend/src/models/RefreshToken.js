import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  revokedAt: {
    type: Date,
    default: null
  },
  replacedByTokenHash: {
    type: String,
    default: null
  }
}, { timestamps: true });

// MongoDB's TTL monitor periodically removes documents once expiresAt is in
// the past, so rotated/expired refresh tokens don't accumulate indefinitely.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', refreshTokenSchema);
