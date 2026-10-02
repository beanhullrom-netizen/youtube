import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bcxdcsosinlycsrfgwfw.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeGRjc29zaW5seWNzcmZnd2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5Mjk1NDQsImV4cCI6MjEwNjUwNTU0NH0.GlrvbbC3PtufRZ5o1lDmtvAjzXFKE1guFASkmyZK3DU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
