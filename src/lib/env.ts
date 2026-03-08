const readEnv = (...values: Array<string | undefined>) =>
  values.find((value) => value && value.trim().length > 0)?.trim();

export const env = {
  supabaseUrl: readEnv(
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: readEnv(
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  ),
  supabaseServiceRoleKey: readEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  ),
  siteUrl: readEnv(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000",
};

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey,
);
