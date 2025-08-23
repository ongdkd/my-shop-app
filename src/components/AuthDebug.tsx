"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';

export default function AuthDebug() {
  const { user, isAuthenticated } = useAuth();
  
  const handleTestAuth = async () => {
    console.log('=== AUTH DEBUG ===');
    console.log('User:', user);
    console.log('Is Authenticated:', isAuthenticated());
    console.log('API Client Token:', apiClient.getAuthToken());
    console.log('API Base URL:', apiClient.getBaseURL());
    
    // Test API call
    try {
      const result = await apiClient.healthCheck();
      console.log('Health Check Result:', result);
    } catch (error) {
      console.error('Health Check Error:', error);
    }
    
    // Test POS terminals call
    try {
      const terminals = await apiClient.getPOSTerminals();
      console.log('POS Terminals Result:', terminals);
    } catch (error) {
      console.error('POS Terminals Error:', error);
    }
  };
  
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">Auth Debug Info</h3>
      <div className="text-xs text-yellow-700 space-y-1">
        <p>User: {user?.email || 'Not logged in'}</p>
        <p>Role: {user?.role || 'No role'}</p>
        <p>Authenticated: {isAuthenticated() ? 'Yes' : 'No'}</p>
        <p>API Token: {apiClient.getAuthToken() ? 'Present' : 'Missing'}</p>
      </div>
      <button
        onClick={handleTestAuth}
        className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
      >
        Test API Connection
      </button>
    </div>
  );
}