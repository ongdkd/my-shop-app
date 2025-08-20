import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client for frontend authentication
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth helper functions
export const authHelpers = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return session;
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return user;
  },

  // Refresh session
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Get user role from metadata
  getUserRole(user: any): string {
    return user?.user_metadata?.role || user?.app_metadata?.role || 'user';
  },

  // Check if user has required role
  hasRole(user: any, requiredRole: string): boolean {
    const userRole = this.getUserRole(user);
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Check specific role
    return userRole === requiredRole;
  },

  // Check if user has any of the required roles
  hasAnyRole(user: any, requiredRoles: string[]): boolean {
    const userRole = this.getUserRole(user);
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Check if user has any of the required roles
    return requiredRoles.includes(userRole);
  },
};

export default supabase;