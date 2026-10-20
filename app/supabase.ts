import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rvgphlmuvwhgqcoydknc.supabase.co'
const supabaseKey = 'sb_publishable_1MKvaPPcFj4vvx3axsgigg_dEzaOIha'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
