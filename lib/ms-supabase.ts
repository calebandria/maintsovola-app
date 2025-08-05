import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gtqpgewedhbprmebghhr.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cXBnZXdlZGhicHJtZWJnaGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4ODc3ODIsImV4cCI6MjA1ODQ2Mzc4Mn0.VXGqqNep5bU5BDuQE1NCrm2xQYz0I1uBiEipUBY0ODg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);