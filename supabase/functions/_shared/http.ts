export class HttpError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function configuredOrigins(): string[] {
  return (Deno.env.get('MEMBER_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowed = configuredOrigins();
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };

  if (!origin) return headers;
  if (allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

export function assertAllowedOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin) return;

  const allowed = configuredOrigins();
  if (!allowed.includes(origin)) {
    throw new HttpError(403, 'origin_not_allowed', 'This origin is not allowed.');
  }
}

export function jsonResponse(
  request: Request,
  body: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...getCorsHeaders(request),
      ...extraHeaders,
    },
  });
}

export function optionsResponse(request: Request): Response {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function parseJson<T extends Record<string, unknown>>(request: Request): Promise<T> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new HttpError(415, 'json_required', 'A JSON request body is required.');
  }

  const raw = await request.text();
  if (!raw || raw.length > 32768) {
    throw new HttpError(400, 'invalid_body', 'The request body is missing or too large.');
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('Expected an object.');
    }
    return parsed as T;
  } catch {
    throw new HttpError(400, 'invalid_json', 'The request body is not valid JSON.');
  }
}

export function requirePost(request: Request): void {
  if (request.method !== 'POST') {
    throw new HttpError(405, 'method_not_allowed', 'Only POST requests are accepted.');
  }
}

export function normalizeEmail(value: unknown): string {
  const email = String(value || '').trim().toLowerCase();
  if (email.length < 3 || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'invalid_email', 'Enter a valid email address.');
  }
  return email;
}

export function normalizeDisplayName(value: unknown): string {
  const displayName = String(value || '').trim().replace(/\s+/g, ' ');
  if (displayName.length < 2 || displayName.length > 80) {
    throw new HttpError(400, 'invalid_display_name', 'Display name must be between 2 and 80 characters.');
  }
  return displayName;
}

export function normalizeReason(value: unknown, required = false): string | null {
  const reason = String(value || '').trim().replace(/\s+/g, ' ');
  if (required && reason.length < 3) {
    throw new HttpError(400, 'reason_required', 'A short reason is required.');
  }
  if (reason.length > 1000) {
    throw new HttpError(400, 'reason_too_long', 'The reason cannot exceed 1000 characters.');
  }
  return reason || null;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown';
}

export function getUserAgent(request: Request): string {
  return (request.headers.get('user-agent') || '').slice(0, 500);
}

export function safeErrorResponse(request: Request, error: unknown): Response {
  if (error instanceof HttpError) {
    const headers: Record<string, string> = {};
    const retryAfter = error.details?.retryAfter;
    if (typeof retryAfter === 'number' && retryAfter > 0) {
      headers['Retry-After'] = String(Math.ceil(retryAfter));
    }
    return jsonResponse(request, {
      ok: false,
      code: error.code,
      message: error.message,
    }, error.status, headers);
  }

  console.error('Unhandled member function error:', error);
  return jsonResponse(request, {
    ok: false,
    code: 'server_error',
    message: 'The request could not be completed.',
  }, 500);
}
