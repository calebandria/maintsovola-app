
// lib/supabase-server.ts

import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL_SERVER = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!; // Use service role or anon key depending on needs

export const supabaseAdmin = createClient(
  SUPABASE_URL_SERVER,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
