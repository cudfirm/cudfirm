import { assertAllowedOrigin, getClientIp, getUserAgent, HttpError, jsonResponse, normalizeEmail, optionsResponse, parseJson, requirePost, safeErrorResponse } from '../_shared/http.ts';
import { createPublicAuthClient, createServiceClient } from '../_shared/supabase.ts';
import { getMemberSettings, siteUrl } from '../_shared/member.ts';
import { consumeRateLimit } from '../_shared/rate-limit.ts';
import { recordMemberEvent } from '../_shared/audit.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  try {
    assertAllowedOrigin(request);
    requirePost(request);

    const body = await parseJson<{ email?: unknown; captchaToken?: unknown }>(request);
    const email = normalizeEmail(body.email);
    const captchaToken = String(body.captchaToken || '').trim();
    const clientIp = getClientIp(request);
    const userAgent = getUserAgent(request);

    const service = createServiceClient();
    const settings = await getMemberSettings(service);
    if (!settings.enabled) throw new HttpError(503, 'member_accounts_disabled', 'Member verification is unavailable.');
    if (settings.captcha_enabled && !captchaToken) {
      throw new HttpError(400, 'captcha_required', 'Complete the bot-protection challenge.');
    }

    await consumeRateLimit(service, 'resend_ip', clientIp, 10, 3600, 3600);
    await consumeRateLimit(service, 'resend_email', email, 3, 3600, 3600);

    const auth = createPublicAuthClient();
    const { error } = await auth.auth.resend({
      type: 'signup',
      email,
      options: {
        captchaToken: captchaToken || undefined,
        emailRedirectTo: `${siteUrl()}/account/verify-email.html`,
      },
    });

    if (error) {
      const code = String((error as { code?: string }).code || '');
      if (code.includes('captcha')) {
        throw new HttpError(400, 'captcha_failed', 'The bot-protection challenge was not accepted.');
      }
      console.warn('Verification resend Auth response:', code || error.message);
    }

    await recordMemberEvent(service, 'member_verification_resent', {
      actorEmail: email,
      userAgent,
    });

    return jsonResponse(request, {
      ok: true,
      message: 'If verification is available for that address, a new email will be sent.',
    }, 202);
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});
