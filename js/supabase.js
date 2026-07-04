// js/supabase.js
//
// Fill these in from Supabase → Project Settings → API:
//   SUPABASE_URL       = "Project URL"
//   SUPABASE_ANON_KEY  = "Publishable key" (safe to expose in frontend code —
//                         it only has the access your RLS policies grant it)
//
// Until real values are set below, every CMS fetch in cms-api.js fails
// gracefully and the site falls back to the content already hardcoded in
// script.js. Nothing breaks either way.

const SUPABASE_URL = "https://wefncrkzugezvduzejzf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dC3QHBaoJ7qb2jJUGXepsA_uKeQtofO";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
