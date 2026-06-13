import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True when both env vars are present. The UI uses this to show a friendly
 * "connect Supabase" message instead of crashing when the project isn't
 * configured yet.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

// Fall back to harmless placeholders so the client can be constructed even
// before configuration — calls will simply fail and be surfaced in the UI.
export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key'
);
