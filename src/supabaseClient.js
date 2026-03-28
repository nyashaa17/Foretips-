import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// PASTE YOUR SUPABASE URL AND ANON KEY DIRECTLY HERE:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qyebxlyciijxdwapvyiy.supabase.co";
const SUPABASE_PUBLIC_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_IwNd9nv2nnTF-b7LsV7gSg_fCFxcdgC";

if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY || SUPABASE_URL === 'https://your-project.supabase.co') {
  console.warn('Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}
// ---------------------

/**
 * The Supabase client instance.
 * Use this to interact with your database, auth, and storage.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token-v2',
    lock: async (...args) => {
      // The last argument is the function to execute
      const fn = args[args.length - 1];
      if (typeof fn === 'function') {
        return await fn();
      }
    }
  }
});
