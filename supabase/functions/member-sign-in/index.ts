import { assertAllowedOrigin, getClientIp, getUserAgent, HttpError, jsonResponse, normalizeEmail, optionsResponse, parseJson, requirePost, safeErrorResponse } from '../_shared/http.ts';
import { createPublicAuthClient, createServiceClient } from '../_shared/supabase.ts';
import { getMemberProfile, getMemberSettings, memberStatusMessage } from '../_shared/member.ts';
import { consumeRateLimit, emailIdentifierHash } from '../_shared/rate-limit.ts';
import { recordMemberEvent } from '../_shared/audit.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  try {
    assertAllowedOrigin(request);
    requirePost(request);

    const body = await parseJson<{ email?: unknown; password?: unknown; captchaToken?: unknown }>(request);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    const captchaToken = String(body.captchaToken || '').trim();
    const clientIp = getClientIp(request);
    const userAgent = getUserAgent(request);

    if (!password || password.length > 128) {
      throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect.');
    }

    const service = createServiceClient();
    const settings = await getMemberSettings(service);
    if (!settings.enabled) throw new HttpError(503, 'member_accounts_disabled', 'Member sign-in is unavailable.');
    if (settings.captcha_enabled && !captchaToken) {
      throw new HttpError(400, 'captcha_required', 'Complete the bot-protection challenge.');
    }

    await consumeRateLimit(service, 'signin_ip', clientIp, 30, 900, 900);
    const identifierHash = await emailIdentifierHash(email);

    const { data: lockData, error: lockError } = await service.rpc('member_auth_lock_check', {
      p_identifier_hash: identifierHash,
    });
    if (lockError) throw new HttpError(503, 'sign_in_protection_unavailable', 'Sign-in cannot be checked safely.');
    const lock = lockData as { locked?: boolean; retryAfter?: number };
    if (lock?.locked) {
      throw new HttpError(429, 'temporarily_locked', 'Too many failed attempts. Try again later.', {
        retryAfter: Number(lock.retryAfter || 900),
      });
    }

    const auth = createPublicAuthClient();
    const { data, error } = await auth.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captchaToken || undefined },
    });

    if (error || !data.user || !data.session) {
      const { data: failureData } = await service.rpc('member_auth_lock_record_failure', {
        p_identifier_hash: identifierHash,
      });
      const failure = failureData as { locked?: boolean; retryAfter?: number } | null;

      await recordMemberEvent(service, 'member_login_failed', {
        actorEmail: email,
        success: false,
        severity: 'warning',
        userAgent,
        details: { reason: 'invalid_credentials', locked: Boolean(failure?.locked) },
      });

      if (failure?.locked) {
        throw new HttpError(429, 'temporarily_locked', 'Too many failed attempts. Try again later.', {
          retryAfter: Number(failure.retryAfter || 900),
        });
      }
      throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect.');
    }

    const profile = await getMemberProfile(service, data.user.id);
    if (!profile || profile.status !== 'active') {
      await recordMemberEvent(service, 'member_access_denied', {
        actorId: data.user.id,
        actorEmail: email,
        subjectId: data.user.id,
        subjectEmail: email,
        success: false,
        severity: profile?.status === 'suspended' ? 'critical' : 'warning',
        userAgent,
        details: { status: profile?.status || 'missing_profile' },
      });
      throw new HttpError(403, 'member_access_blocked', memberStatusMessage(profile));
    }

    await service.rpc('member_auth_lock_clear', { p_identifier_hash: identifierHash });
    await recordMemberEvent(service, 'member_login_success', {
      actorId: data.user.id,
      actorEmail: email,
      subjectId: data.user.id,
      subjectEmail: email,
      userAgent,
    });

    return jsonResponse(request, {
      ok: true,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        expiresIn: data.session.expires_in,
        tokenType: data.session.token_type,
      },
      member: {
        userId: profile.user_id,
        displayName: profile.display_name,
        role: profile.member_role,
        status: profile.status,
      },
    });
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});
