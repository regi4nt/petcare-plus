import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars belum diisi di file .env');
}

export const supabase = createClient(
  supabaseUrl     || 'https://vpytcguxghpvvsrqdsoc.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXRjZ3V4Z2hwdnZzcnFkc29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTIzMTIsImV4cCI6MjA5MjY4ODMxMn0.-98m71uyb_Uf1x7VC1LM6Q6dPlja-FDuQQl0wXOqfTQ',
  {
    auth: {
      detectSessionInUrl: true,   // Otomatis parse token dari URL hash (#access_token=...)
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,  // Cukup untuk data IoT tiap 5 detik
      },
    },
  }
);
