/**
 * Safely extracts a human-readable error message from any thrown value.
 *
 * Handles:
 *  - Axios errors  (err.response.data.message / .error / .detail)
 *  - Native Error  (err.message)
 *  - Plain strings
 *  - Nested objects where .message or .error is itself an object (production API quirk)
 */
export function extractErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (!err) return fallback;

  // Plain string
  if (typeof err === 'string') return err || fallback;

  // Native Error or any object with a string .message
  if (err instanceof Error) return err.message || fallback;

  const e = err as Record<string, unknown>;

  // Axios-style: check response.data first
  const data = (e.response as Record<string, unknown> | undefined)?.data;

  if (data !== undefined && data !== null) {
    const s = safeString(data, fallback);
    if (s !== fallback) return s;
  }

  // Top-level .message or .error on the thrown value itself
  if (typeof e.message === 'string' && e.message) return e.message;

  return fallback;
}

/** Extract the HTTP status code from an Axios-style error, if present. */
export function getHttpStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as Record<string, unknown>;
  const status = (e.response as Record<string, unknown> | undefined)?.status;
  return typeof status === 'number' ? status : undefined;
}

/** Extract a safe string from an unknown value. */
function safeString(val: unknown, fallback: string): string {
  if (typeof val === 'string') return val || fallback;

  if (val && typeof val === 'object') {
    const v = val as Record<string, unknown>;

    // Prefer .message over .error
    const msg = v.message;
    if (typeof msg === 'string' && msg) return msg;
    // .message is itself an object (nested envelope) — go one level deeper
    if (msg && typeof msg === 'object') {
      const inner = (msg as Record<string, unknown>).message;
      if (typeof inner === 'string' && inner) return inner;
    }

    const err = v.error;
    if (typeof err === 'string' && err) return err;
    // .error is itself an object (nested envelope) — go one level deeper
    if (err && typeof err === 'object') {
      const inner = (err as Record<string, unknown>).message;
      if (typeof inner === 'string' && inner) return inner;
    }

    // Express / Spring detail field
    const detail = v.detail ?? v.details;
    if (typeof detail === 'string' && detail) return detail;
  }

  return fallback;
}
