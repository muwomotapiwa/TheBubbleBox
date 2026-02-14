import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqppcsvpqoamxspkesbe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcHBjc3ZwcW9hbXhzcGtlc2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzIxNDAsImV4cCI6MjA4NjQwODE0MH0.qhIMQnFRob6rbSp1KXNFK1Lr_7LFLPv-E_pfW0Jg1S0';

// Create Supabase client without strict typing until database is set up
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
};

// Helper function to get session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};
