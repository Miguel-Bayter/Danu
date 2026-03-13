import { createClient } from '@supabase/supabase-js'

// Browser-only client for Realtime subscriptions (uses anon key — safe for client)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
