const SUPABASE_URL = "https://wefncrkzugezvduzejzf.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_dC3QHBaoJ7qb2jJUGXepsA_uKeQtofO";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

window.supabaseClient = supabase;