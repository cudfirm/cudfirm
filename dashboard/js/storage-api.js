/**
 * dashboard/js/storage-api.js
 * ------------------------------------------------------------------
 * Thin wrapper around Supabase Storage (bucket: "media") plus the
 * `media_library` table that tracks metadata for everything
 * uploaded. Every uploaded file gets ONE storage object AND one
 * media_library row — the row is what the Media Library page and
 * the image picker widget actually query against; the object is
 * the source of truth for bytes.
 *
 * All methods return { data, error } like the rest of the admin API
 * so callers can use DashError.friendly() uniformly.
 * ------------------------------------------------------------------
 */

const StorageApi = (() => {
  const BUCKET = "media";
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];

  function safeFileName(file) {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const base = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
    const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    return `${base}-${unique}.${ext}`;
  }

  function validate(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please choose an image file (JPG, PNG, WEBP, GIF, SVG, or ICO).";
    }
    if (file.size > MAX_BYTES) {
      return "That file is too large. Please choose an image under 5MB.";
    }
    return null;
  }

  async function upload(file, category = "general") {
    const validationError = validate(file);
    if (validationError) {
      return { data: null, error: { message: validationError } };
    }

    const path = `${category}/${safeFileName(file)}`;

    try {
      const { error: uploadError } = await supabaseClient.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) return { data: null, error: uploadError };

      const { data: urlData } = supabaseClient.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = urlData && urlData.publicUrl;

      const record = {
        file_name: file.name,
        storage_path: path,
        public_url: publicUrl,
        bucket: BUCKET,
        category,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: (window.dashUser && window.dashUser.email) || null,
      };

      const { data: row, error: insertError } = await supabaseClient.from("media_library").insert(record).select().single();
      if (insertError) return { data: null, error: insertError };

      return { data: row, error: null };
    } catch (err) {
      return { data: null, error: { message: err && err.message ? err.message : "Upload failed" } };
    }
  }

  async function list(category = null) {
    try {
      let query = supabaseClient.from("media_library").select("*").order("created_at", { ascending: false });
      if (category) query = query.eq("category", category);
      return await query;
    } catch (err) {
      return { data: null, error: { message: err && err.message ? err.message : "Could not load media" } };
    }
  }

  async function updateMeta(id, payload) {
    try {
      return await supabaseClient.from("media_library").update(payload).eq("id", id).select().single();
    } catch (err) {
      return { data: null, error: { message: err && err.message ? err.message : "Could not update file" } };
    }
  }

  async function remove(row) {
    try {
      const { error: storageError } = await supabaseClient.storage.from(row.bucket || BUCKET).remove([row.storage_path]);
      // Even if the storage object is already gone, still remove the
      // metadata row so the library doesn't show a dead entry.
      if (storageError) console.warn("[storage] object removal warning:", storageError.message);

      const { error: dbError } = await supabaseClient.from("media_library").delete().eq("id", row.id);
      if (dbError) return { error: dbError };
      return { error: null };
    } catch (err) {
      return { error: { message: err && err.message ? err.message : "Delete failed" } };
    }
  }

  return { upload, list, updateMeta, remove, MAX_BYTES, ALLOWED_TYPES };
})();
