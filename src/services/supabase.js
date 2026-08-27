import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oydegnghvaeyqfckcvfz.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZGVnbmdodmFleXFmY2tjdmZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMjMyMTAsImV4cCI6MjA5OTY5OTIxMH0.0ihIZf1h-ovYm-F4DVfSsAtyQLSmO7cQL9gcqtQYaU8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
