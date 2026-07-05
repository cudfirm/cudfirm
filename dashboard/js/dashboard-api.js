/**
 * dashboard/js/dashboard-api.js
 * ------------------------------------------------------------------
 * Admin-side data-access layer. Mirrors the spirit of js/cms-api.js
 * (single place that knows table names/shapes) but for the dashboard:
 *
 *  - Selects `*` (including inactive rows — admins need to see everything)
 *  - Does NOT swallow errors; returns { data, error } so the UI can
 *    show a real message (e.g. "row-level security policy" if the
 *    admin write policies from supabase/003_admin_write_policies.sql
 *    haven't been applied yet)
 *  - Knows nothing about rendering — crud-engine.js / page scripts
 *    own the DOM.
 *
 * Reuses the same `supabaseClient` from ../js/supabase.js. Nothing
 * about the existing public connection is modified.
 * ------------------------------------------------------------------
 */

const AdminApi = (() => {
  const db = supabaseClient;

  async function list(table, orderCol = "sort_order", ascending = true) {
    return await db.from(table).select("*").order(orderCol, { ascending });
  }

  async function getById(table, id) {
    return await db.from(table).select("*").eq("id", id).single();
  }

  async function create(table, payload) {
    return await db.from(table).insert(payload).select().single();
  }

  async function update(table, id, payload) {
    return await db.from(table).update(payload).eq("id", id).select().single();
  }

  async function remove(table, id) {
    return await db.from(table).delete().eq("id", id);
  }

  async function count(table) {
    const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
    return { count, error };
  }

  return { list, getById, create, update, remove, count };
})();
