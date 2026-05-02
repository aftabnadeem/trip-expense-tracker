// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────
// STEP 1: Replace the two values below with your Supabase project's
//         URL and anon (public) key.
//
//  Find them at: https://app.supabase.com → your project →
//                Settings → API → Project URL & anon key
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;   // e.g. https://xyzabc.supabase.co
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON; // e.g. abc123

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);