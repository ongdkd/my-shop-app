"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, authHelpers } from '@/lib/supabase';
import { User } from '@/lib/api/types';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session } | null>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert Supabase user to our User type
  const convertSupabaseUser = useCallback((supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      role: authHelpers.getUserRole(supabaseUser),
      name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
      created_at: supabaseUser.created_at,
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (mounted) {
          if (initialSession?.user) {
            const userData = convertSupabaseUser(initialSession.user);
            setUser(userData);
            setSession(initialSession);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          if (session?.user) {
            const userData = convertSupabaseUser(session.user);
            setUser(userData);
            setSession(session);
          } else {
            setUser(null);
            setSession(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [convertSupabaseUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const authData = await authHelpers.signIn(email, password);
      
      if (authData.user && authData.session) {
        const userData = convertSupabaseUser(authData.user);
        setUser(userData);
        setSession(authData.session);
        return { user: userData, session: authData.session };
      }
      
      return null;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [convertSupabaseUser]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await authHelpers.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      if (data.session?.user) {
        const userData = convertSupabaseUser(data.session.user);
        setUser(userData);
        setSession(data.session);
      }
    } catch (error) {
      console.error('Refresh session error:', error);
      // If refresh fails, sign out
      await signOut();
      throw error;
    }
  }, [convertSupabaseUser, signOut]);

  const isAuthenticated = useCallback(() => {
    return !!(user && session);
  }, [user, session]);

  const hasRole = useCallback((role: string) => {
    if (!user) return false;
    return authHelpers.hasRole(user, role);
  }, [user]);

  const hasAnyRole = useCallback((roles: string[]) => {
    if (!user) return false;
    return authHelpers.hasAnyRole(user, roles);
  }, [user]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    refreshSession,
    isAuthenticated,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};