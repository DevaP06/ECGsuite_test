import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Short-lived access token — the refresh-token flow exists precisely so the
// frontend can silently mint a new one of these without re-prompting login.
export const ACCESS_TOKEN_TTL = '15m';

// Refresh tokens live much longer and are rotated on every use.
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment');
  }

  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_TTL
    }
  );
};

// Opaque, high-entropy refresh token (not a JWT) — it carries no decodable
// claims, so using it requires a DB lookup by hash, which is what makes
// server-side revocation and rotation possible.
export const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

export const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');