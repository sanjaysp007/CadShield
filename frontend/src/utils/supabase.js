import { createClient } from '@supabase/supabase-js'

// Support standard Vite env names, user-specified env variable keys, and safe production fallbacks
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env['VITE_SUPABASE_https://aytcdjhjxwixgrldzyaq.supabase.co'] ||
  'https://aytcdjhjxwixgrldzyaq.supabase.co'

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env['VITE_SUPABASE_sb_publishable_tgO6MPOd1ZYytpxJ4_DZCg_vBvOnN4B'] ||
  'sb_publishable_tgO6MPOd1ZYytpxJ4_DZCg_vBvOnN4B'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
