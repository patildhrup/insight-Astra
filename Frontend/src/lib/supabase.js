import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nkzqqernqjjyjdvsshly.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5renFxZXJucWpqeWpkdnNzaGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDU4MjAsImV4cCI6MjA4NzM4MTgyMH0.yRenJHoL_SdGGXeL_U8lkiGcnaDcXU3Gx73y2nbTFVI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
