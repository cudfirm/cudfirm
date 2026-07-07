/**
 * dashboard/js/dashboard-api.js
 * ------------------------------------------------------------------
 * Admin-side data-access layer. Mirrors the spirit of js/cms-api.js
 * (single place that knows table names/shapes) but for the dashboard:
 *
 *  - Selects `*` (including inactive rows — admins need to see everything)
 *  - Does NOT swallow errors; returns { data, error } so the UI can
 *    show a real message via DashError.friendly()
 *  - Knows nothing about rendering — crud-engine.js / page scripts
 *    own the DOM.
 *
 * Reuses the same `supabaseClient` from ../js/supabase.js. Nothing
 * about the existing public connection is modified.
 *
 * Every method is wrapped by `safely()`, which catches network-level
 * failures (offline, DNS, CORS) that the Supabase client throws
 * rather than returning as `{ error }`. Without this, a dropped
 * connection would surface as an uncaught exception instead of a
 * normal, handleable result — every caller would need its own
 * try/catch. Wrapping it once here means callers never have to.
 * ------------------------------------------------------------------
 */

const AdminApi = (() => {
  const db = supabaseClient;

  async function safely(fn) {
    try {
      return await fn();
    } catch (err) {
      // fetch()-level failure (offline, DNS, CORS) — normalize to the
      // same shape a Supabase/PostgREST error would have.
      return { data: null, error: { message: err && err.message ? err.message : "Network request failed" } };
    }
  }

  async function list(table, orderCol = "sort_order", ascending = true) {
    return safely(() => db.from(table).select("*").order(orderCol, { ascending }));
  }

  async function getById(table, id) {
    return safely(() => db.from(table).select("*").eq("id", id).single());
  }

  async function create(table, payload) {
    return safely(() => db.from(table).insert(payload).select().single());
  }

  async function update(table, id, payload) {
    return safely(() => db.from(table).update(payload).eq("id", id).select().single());
  }

  async function remove(table, id) {
    return safely(() => db.from(table).delete().eq("id", id));
  }

  async function count(table) {
    return safely(async () => {
      const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
      return { count, error };
    });
  }

  return { list, getById, create, update, remove, count };
})();
