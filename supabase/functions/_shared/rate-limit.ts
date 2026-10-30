import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.110.7';
import { HttpError } from './http.ts';
import { sha256Hex } from './crypto.ts';

export type RateLimitScope =
  | 'register_ip' | 'register_email' | 'signin_ip'
  | 'resend_ip' | 'resend_email' | 'invite_email'
  | 'request_member' | 'export_download';

export async function consumeRateLimit(
  service: SupabaseClient,
  scope: RateLimitScope,
  identifier: string,
  limit: number,
  windowSeconds: number,
  blockSeconds: number,
): Promise<void> {
  const identifierHash = await sha256Hex(`${scope}:${identifier.toLowerCase()}`);
  const { data, error } = await service.rpc('member_rate_limit_consume', {
    p_scope: scope,
    p_identifier_hash: identifierHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
    p_block_seconds: blockSeconds,
  });

  if (error) throw new HttpError(503, 'rate_limit_unavailable', 'The request could not be checked safely.');
  const result = data as { allowed?: boolean; retryAfter?: number };
  if (!result?.allowed) {
    throw new HttpError(429, 'too_many_requests', 'Too many requests. Try again later.', {
      retryAfter: Number(result?.retryAfter || blockSeconds),
    });
  }
}

export async function emailIdentifierHash(email: string): Promise<string> {
  return sha256Hex(`member-email:${email.toLowerCase()}`);
}
