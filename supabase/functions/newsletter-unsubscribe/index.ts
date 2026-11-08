// One-click unsubscribe from the link in every newsletter e-mail.
// Deploy WITHOUT JWT verification: supabase functions deploy newsletter-unsubscribe --no-verify-jwt
// Secret: UNSUBSCRIBE_SECRET (same as blog-notify)
import { createServiceClient } from '../_shared/supabase.ts';
import { verifyUnsubToken } from '../_shared/unsub.ts';

const page = (msg: string, status = 200) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CUDFIRM</title><body style="font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#F5F0E6;color:#1C2218"><div style="max-width:420px;padding:24px;text-align:center"><h1 style="color:#0B3D2E">${msg}</h1></div>`,
  { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

Deno.serve(async (request) => {
  const url = new URL(request.url);
  const email = (url.searchParams.get('e') || '').trim().toLowerCase();
  const token = (url.searchParams.get('t') || '').trim();
  const secret = (Deno.env.get('UNSUBSCRIBE_SECRET') || '').trim();
  if (!secret || !email || !token || !(await verifyUnsubToken(secret, email, token))) return page('This unsubscribe link is not valid.', 400);
  const { error } = await createServiceClient().from('subscribers').update({ status: 'unsubscribed' }).eq('email', email);
  if (error) return page('Something went wrong. Please try again later.', 500);
  return page('You have been unsubscribed.');
});
