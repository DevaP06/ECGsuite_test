export const REFRESH_COOKIE_NAME = 'refreshToken';

// Scoped to /api/auth so the cookie is only ever sent to the auth endpoints
// that need it (login/register/google/refresh/logout), not on every request.
const COOKIE_PATH = '/api/auth';

const isProd = process.env.NODE_ENV === 'production';

// In production the frontend and backend are on different origins, so the
// cookie needs SameSite=None (+ Secure, which browsers require alongside it).
// In dev/test, localhost:5173 -> localhost:3000 is same-site, so Lax works
// without requiring HTTPS.
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: COOKIE_PATH
};

export const setRefreshCookie = (res, token, maxAgeMs) => {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...cookieOptions, maxAge: maxAgeMs });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions);
};
