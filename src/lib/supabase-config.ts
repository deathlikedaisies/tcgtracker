export const REQUIRED_SUPABASE_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

const FALLBACK_SUPABASE_KEY_ENV_NAME = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export class SupabaseConfigError extends Error {
  constructor() {
    super(
      `Missing Supabase configuration. Set ${REQUIRED_SUPABASE_ENV_NAMES.join(
        " and "
      )}. ${FALLBACK_SUPABASE_KEY_ENV_NAME} is accepted only as a legacy fallback.`
    );
    this.name = "SupabaseConfigError";
  }
}

export function getOptionalSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return {
    url: supabaseUrl,
    key: supabaseKey,
  };
}

export function getSupabaseConfig() {
  const config = getOptionalSupabaseConfig();

  if (!config) {
    throw new SupabaseConfigError();
  }

  return config;
}
