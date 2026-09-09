import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aytcdjhjxwixgrldzyaq.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_tgO6MPOd1ZYytpxJ4_DZCg_vBvOnN4B'

export const supabase = createClient(supabaseUrl, supabaseKey)
