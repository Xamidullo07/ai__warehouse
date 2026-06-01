import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_key_for_build';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase environment variables yo\'q. .env faylingizni tekshiring:');
  console.warn('VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY kerak.');
  console.warn('https://app.supabase.com dan oling va .env fayliga qo\'shing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
