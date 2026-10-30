/**
 * CUDFIRM Phase 6.1 — Backup data access layer.
 * Backs up database records only. Storage objects, authentication,
 * environment variables, and Supabase project settings are excluded.
 */
const BackupApi = (() => {
  const APP_ID = "cudfirm-cms";
  const FORMAT_VERSION = 1;
  const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

  const SECTIONS = [
    { key: "hero", table: "hero", label: "Hero Section", icon: "bi-flag", singleton: true, primaryKey: "id" },
    { key: "services", table: "services", label: "Services", icon: "bi-grid-3x3-gap", primaryKey: "id", identity: true },
    { key: "portfolio", table: "portfolio_projects", label: "Portfolio", icon: "bi-briefcase", primaryKey: "id", identity: true },
    { key: "testimonials", table: "testimonials", label: "Testimonials", icon: "bi-chat-quote", primaryKey: "id", identity: true },
    { key: "faq", table: "faq", label: "FAQ", icon: "bi-question-circle", primaryKey: "id", identity: true },
    { key: "navigation", table: "navigation", label: "Navigation", icon: "bi-list-ul", primaryKey: "id", identity: true },
    { key: "settings", table: "site_settings", label: "Site Settings", icon: "bi-gear", singleton: true, primaryKey: "id" },
    { key: "seo", table: "seo_meta", label: "SEO Entries", icon: "bi-search", primaryKey: "id", identity: true },
    { key: "media", table: "media_library", label: "Media Metadata", icon: "bi-images", primaryKey: "id", identity: true, note: "Storage files are not included." },
    { key: "messages", table: "messages", label: "Messages", icon: "bi-envelope", primaryKey: "id", identity: true, sensitive: true },
    { key: "subscribers", table: "subscribers", label: "Subscribers", icon: "bi-people", primaryKey: "id", identity: true, sensitive: true },
    { key: "activity", table: "activity_log", label: "Activity Log", icon: "bi-clock-history", primaryKey: "id", identity: true },
  ];

  function getSection(key) {
    return SECTIONS.find((section) => section.key === key) || null;
  }

  async function fetchSection(section) {
    try {
      const { data, error } = await supabaseClient.from(section.table).select("*");
      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  async function createBackup(selectedKeys, options = {}) {
    const chosen = SECTIONS.filter((section) => selectedKeys.includes(section.key));
    const sections = {};
    const errors = [];

    for (const section of chosen) {
      const result = await fetchSection(section);
      if (result.error) {
        errors.push({ key: section.key, message: result.error.message || "Could not read section." });
        continue;
      }
      sections[section.key] = result.data;
    }

    return {
      backup: {
        format: APP_ID,
        format_version: FORMAT_VERSION,
        created_at: new Date().toISOString(),
        created_by: (window.dashUser && window.dashUser.email) || null,
        site_origin: window.location.origin,
        scope: "database-content-only",
        notes: [
          "Supabase Auth users, passwords, project secrets, and environment variables are excluded.",
          "Media Library records are included, but the actual Supabase Storage files are not.",
        ],
        sections,
        section_counts: Object.fromEntries(Object.entries(sections).map(([key, rows]) => [key, rows.length])),
        reason: options.reason || "manual",
      },
      errors,
    };
  }

  function validateBackup(value) {
    const errors = [];
    if (!value || typeof value !== "object" || Array.isArray(value)) errors.push("The file does not contain a valid backup object.");
    if (value && value.format !== APP_ID) errors.push("This file is not a CUDFIRM CMS backup.");
    if (value && Number(value.format_version) !== FORMAT_VERSION) errors.push("This backup format version is not supported.");
    if (!value || !value.sections || typeof value.sections !== "object" || Array.isArray(value.sections)) errors.push("The backup does not contain any sections.");

    const availableKeys = [];
    if (value && value.sections && typeof value.sections === "object") {
      Object.entries(value.sections).forEach(([key, rows]) => {
        if (!getSection(key)) return;
        if (!Array.isArray(rows)) errors.push(`${key} is not a valid record list.`);
        else availableKeys.push(key);
      });
    }

    if (!availableKeys.length) errors.push("The backup contains no restorable CUDFIRM sections.");
    return { valid: errors.length === 0, errors, availableKeys };
  }

  function sanitizeRows(section, rows) {
    return rows.map((source) => {
      const row = { ...source };
      if (section.identity) delete row[section.primaryKey];
      return row;
    });
  }

  async function clearSection(section) {
    try {
      return await supabaseClient.from(section.table).delete().not(section.primaryKey, "is", null);
    } catch (error) {
      return { error };
    }
  }

  async function insertInChunks(section, rows) {
    const clean = sanitizeRows(section, rows);
    if (!clean.length) return { error: null, count: 0 };
    const chunkSize = 250;
    let count = 0;
    for (let index = 0; index < clean.length; index += chunkSize) {
      const chunk = clean.slice(index, index + chunkSize);
      let result;
      try {
        result = await supabaseClient.from(section.table).insert(chunk);
      } catch (error) {
        return { error, count };
      }
      if (result.error) return { error: result.error, count };
      count += chunk.length;
    }
    return { error: null, count };
  }

  async function restoreSection(section, rows) {
    if (section.singleton) {
      if (!rows.length) return { error: null, count: 0, skipped: true };
      const row = { ...rows[0], id: 1 };
      try {
        const { error } = await supabaseClient.from(section.table).upsert(row, { onConflict: "id" });
        return { error, count: error ? 0 : 1 };
      } catch (error) {
        return { error, count: 0 };
      }
    }

    const cleared = await clearSection(section);
    if (cleared.error) return { error: cleared.error, count: 0 };
    return insertInChunks(section, rows);
  }

  async function restoreBackup(backup, selectedKeys, onProgress) {
    const results = [];
    const chosen = SECTIONS.filter((section) => selectedKeys.includes(section.key));
    for (let index = 0; index < chosen.length; index += 1) {
      const section = chosen[index];
      if (onProgress) onProgress({ section, index, total: chosen.length });
      const rows = Array.isArray(backup.sections[section.key]) ? backup.sections[section.key] : [];
      const result = await restoreSection(section, rows);
      results.push({ key: section.key, label: section.label, count: result.count || 0, skipped: !!result.skipped, error: result.error || null });
      if (result.error) break;
    }
    return results;
  }

  function filename(prefix = "cudfirm-backup") {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${prefix}-${stamp}.json`;
  }

  function download(backup, customName) {
    const body = JSON.stringify(backup, null, 2);
    DashDownload.blob(new Blob([body], { type: "application/json;charset=utf-8" }), customName || filename());
  }

  async function readFile(file) {
    if (!file) throw new Error("Choose a backup file first.");
    if (file.size > MAX_IMPORT_BYTES) throw new Error("The backup file is larger than the 25 MB safety limit.");
    const text = await file.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error("The selected file is not valid JSON.");
    }
  }

  return {
    APP_ID,
    FORMAT_VERSION,
    MAX_IMPORT_BYTES,
    SECTIONS,
    createBackup,
    validateBackup,
    restoreBackup,
    download,
    filename,
    readFile,
  };
})();
