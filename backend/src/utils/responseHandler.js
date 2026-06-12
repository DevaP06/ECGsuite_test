const ERROR_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE'
};

// Maps an HTTP status to a stable machine-readable error code so every
// {success:false} response carries `code` the frontend can branch on
// without parsing `message`. Falls back to a generic code for anything
// not in the table above (e.g. unmapped 4xx/5xx statuses).
export const errorCodeForStatus = (statusCode) => ERROR_CODES[statusCode] ?? 'ERROR';

export const sendResponse = (
  res,
  statusCode,
  success,
  message,
  data = null,
  code
) => {
  const body = { success, message, data };
  if (!success) {
    body.code = code ?? errorCodeForStatus(statusCode);
  }
  return res.status(statusCode).json(body);
};
