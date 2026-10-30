import { assertAllowedOrigin, getClientIp, getUserAgent, HttpError, jsonResponse, normalizeDisplayName, normalizeEmail, optionsResponse, parseJson, requirePost, safeErrorResponse } from '../_shared/http.ts';
import { createPublicAuthClient, createServiceClient } from '../_shared/supabase.ts';
import { getMemberSettings, safeRedirect, siteUrl } from '../_shared/member.ts';
import { consumeRateLimit } from '../_shared/rate-limit.ts';
import { recordMemberEvent } from '../_shared/audit.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return optionsResponse(request);

  try {
    assertAllowedOrigin(request);
    requirePost(request);

    const body = await parseJson<{
      email?: unknown;
      password?: unknown;
      displayName?: unknown;
      termsAccepted?: unknown;
      privacyAccepted?: unknown;
      termsVersion?: unknown;
      privacyVersion?: unknown;
      captchaToken?: unknown;
      returnTo?: unknown;
    }>(request);

    const email = normalizeEmail(body.email);
    const displayName = normalizeDisplayName(body.displayName);
    const password = String(body.password || '');
    const captchaToken = String(body.captchaToken || '').trim();
    const clientIp = getClientIp(request);
    const userAgent = getUserAgent(request);

    if (password.length < 8 || password.length > 128) {
      throw new HttpError(400, 'invalid_password', 'Password must be between 8 and 128 characters.');
    }

    const service = createServiceClient();
    const settings = await getMemberSettings(service);
    if (!settings.enabled || !settings.public_registration) {
      throw new HttpError(403, 'registration_disabled', 'Public member registration is not enabled.');
    }

    if (body.termsAccepted !== true || body.privacyAccepted !== true) {
      throw new HttpError(400, 'consent_required', 'Terms of Service and Privacy Policy acceptance is required.');
    }

    const termsVersion = String(body.termsVersion || '').trim();
    const privacyVersion = String(body.privacyVersion || '').trim();
    if (termsVersion !== settings.terms_version || privacyVersion !== settings.privacy_version) {
      throw new HttpError(409, 'policy_version_changed', 'The Terms or Privacy Policy has changed. Review and accept the current version.');
    }

    if (settings.captcha_enabled && !captchaToken) {
      throw new HttpError(400, 'captcha_required', 'Complete the bot-protection challenge.');
    }

    await consumeRateLimit(service, 'register_ip', clientIp, 8, 3600, 3600);
    await consumeRateLimit(service, 'register_email', email, 3, 3600, 3600);

    await recordMemberEvent(service, 'member_registration_requested', {
      actorEmail: email,
      userAgent,
      details: { source: 'self_registration' },
    });

    const auth = createPublicAuthClient();
    const returnPath = safeRedirect(body.returnTo, '/account/verify-email.html');
    const redirectTo = `${siteUrl()}${returnPath}`;

    const { data, error } = await auth.auth.signUp({
      email,
      password,
      options: {
        captchaToken: captchaToken || undefined,
        emailRedirectTo: redirectTo,
        data: {
          display_name: displayName,
          member_registration_source: 'self_registration',
        },
      },
    });

    // Supabase intentionally obscures duplicate-account outcomes. Preserve that
    // behavior and return the same public response for duplicates.
    const identities = data.user?.identities || [];
    if (!error && data.user && identities.length > 0) {
      const { error: finalizeError } = await service.rpc('member_finalize_registration', {
        p_user_id: data.user.id,
        p_display_name: displayName,
        p_terms_version: termsVersion,
        p_privacy_version: privacyVersion,
        p_registration_source: 'self_registration',
      });
      if (finalizeError) {
        console.error('Registration profile finalization failed:', finalizeError.message);
        // This branch applies only to a newly-created Auth identity. Remove the
        // orphan rather than leaving an account that can never obtain a profile.
        await service.auth.admin.deleteUser(data.user.id, false);
        throw new HttpError(500, 'registration_incomplete', 'The account could not be prepared.');
      }

      await recordMemberEvent(service, 'member_registered', {
        actorId: data.user.id,
        actorEmail: email,
        subjectId: data.user.id,
        subjectEmail: email,
        userAgent,
        details: { status: data.user.email_confirmed_at ? 'verified' : 'pending_verification' },
      });
    } else if (error) {
      // Do not expose duplicate-account state. CAPTCHA/configuration errors remain
      // actionable; other Auth errors receive a generic response.
      const code = String((error as { code?: string }).code || '');
      if (code.includes('captcha')) {
        throw new HttpError(400, 'captcha_failed', 'The bot-protection challenge was not accepted.');
      }
      if (code === 'weak_password') {
        throw new HttpError(400, 'password_rejected', 'Choose a stronger password.');
      }
      console.warn('Registration Auth response:', code || error.message);
    }

    return jsonResponse(request, {
      ok: true,
      status: 'verification_required',
      message: 'If the address can be registered, a verification email will be sent.',
    }, 202);
  } catch (error) {
    return safeErrorResponse(request, error);
  }
});
