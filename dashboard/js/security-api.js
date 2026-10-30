/**
 * Small, isolated API wrapper for Phase 6.5 security events.
 * The database remains authoritative through RLS and security-definer RPCs.
 */
const SecurityApi = (() => {
  async function list(limit = 750) {
    return supabaseClient
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
  }

  async function record(eventType, options = {}) {
    return supabaseClient.rpc("record_auth_security_event", {
      p_event_type: eventType,
      p_email: options.email || null,
      p_success: options.success !== false,
      p_details: options.details || {},
      p_user_agent: navigator.userAgent || null,
    });
  }

  return { list, record };
})();
