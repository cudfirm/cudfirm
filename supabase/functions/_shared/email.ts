import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.110.7';
import { recordMemberEvent } from './audit.ts';

export async function sendTransactionalEmail(
  service: SupabaseClient,
  input: {
    event: string;
    to: string;
    data?: Record<string, unknown>;
    actionUrl?: string;
    subjectId?: string | null;
    userAgent?: string | null;
    required?: boolean;
  },
): Promise<boolean> {
  const endpoint = (Deno.env.get('MEMBER_EMAIL_WEBHOOK_URL') || '').trim();
  const secret = (Deno.env.get('MEMBER_EMAIL_WEBHOOK_SECRET') || '').trim();

  if (!endpoint || !secret) {
    if (input.required) throw new Error('Transactional email webhook is not configured.');
    return false;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        event: input.event,
        to: input.to,
        actionUrl: input.actionUrl,
        data: input.data || {},
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`Email webhook returned ${response.status}.`);
    return true;
  } catch (error) {
    console.error('Transactional email delivery failed:', input.event, error);
    await recordMemberEvent(service, 'member_email_delivery_failed', {
      subjectId: input.subjectId || null,
      subjectEmail: input.to,
      success: false,
      severity: 'warning',
      details: { event: input.event },
      userAgent: input.userAgent || null,
    });
    if (input.required) throw error;
    return false;
  }
}
