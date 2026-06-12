import rateLimit from 'express-rate-limit';

const make = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    skip: () => process.env.NODE_ENV === 'test',
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'RATE_LIMITED', message, data: null }
  });

// Strict: login / register / google — brute-force targets
export const authLimiter = make(
  15 * 60 * 1000,   // 15 min window
  20,               // 20 attempts per window
  'Too many authentication attempts. Please try again in 15 minutes.'
);

// Moderate: GET /me and other reads
export const readLimiter = make(
  60 * 1000,        // 1 min window
  60,               // 60 req/min
  'Too many requests. Please slow down.'
);

// ECG upload — expensive operation
export const uploadLimiter = make(
  60 * 60 * 1000,   // 1 hour window
  30,               // 30 uploads/hour per IP
  'Upload limit reached. You can upload up to 30 ECG files per hour.'
);

// ML inference and specialist review
export const mlLimiter = make(
  60 * 1000,        // 1 min window
  30,               // 30 req/min
  'Too many requests to ML service. Please slow down.'
);
