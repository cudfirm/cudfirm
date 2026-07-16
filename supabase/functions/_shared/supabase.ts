import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.110.7';
import { HttpError } from './http.ts';

function requiredEnv(name: string, fallbacks: string[] = []): string {
  const names = [name, ...fallbacks];
  for (const key of names) {
    const value = Deno.env.get(key)?.trim();
    if (value) return value;
  }
  throw new Error(`Missing required Edge Function secret: ${name}`);
}

export function supabaseUrl(): string {
  return requiredEnv('SUPABASE_URL');
}

export function publishableKey(): string {
  return requiredEnv('SUPABASE_PUBLISHABLE_KEY', ['SUPABASE_ANON_KEY']);
}

export function secretKey(): string {
  return requiredEnv('SUPABASE_SECRET_KEY', ['SUPABASE_SERVICE_ROLE_KEY']);
}

const baseAuthOptions = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
};

export function createServiceClient(): SupabaseClient {
  return createClient(supabaseUrl(), secretKey(), { auth: baseAuthOptions });
}

export function createPublicAuthClient(): SupabaseClient {
  return createClient(supabaseUrl(), publishableKey(), { auth: baseAuthOptions });
}

export function bearerToken(request: Request): string {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    throw new HttpError(401, 'authentication_required', 'Authentication is required.');
  }
  const token = authorization.slice(7).trim();
  if (!token) throw new HttpError(401, 'authentication_required', 'Authentication is required.');
  return token;
}

export function createCallerClient(request: Request): SupabaseClient {
  const token = bearerToken(request);
  return createClient(supabaseUrl(), publishableKey(), {
    auth: baseAuthOptions,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function requireAuthenticatedUser(request: Request): Promise<User> {
  const token = bearerToken(request);
  const service = createServiceClient();
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) {
    throw new HttpError(401, 'invalid_session', 'Your session is invalid or has expired.');
  }
  return data.user;
}

export async function requireModulePermission(request: Request, permission: string): Promise<User> {
  const user = await requireAuthenticatedUser(request);
  const caller = createCallerClient(request);
  const { data, error } = await caller.rpc('has_module_permission', {
    p_module_id: 'member-accounts',
    p_permission_id: permission,
  });

  if (error || data !== true) {
    throw new HttpError(403, 'permission_denied', 'You are not authorized to perform this action.');
  }
  return user;
}

export function userEmail(user: User): string {
  return String(user.email || '').trim().toLowerCase();
}
