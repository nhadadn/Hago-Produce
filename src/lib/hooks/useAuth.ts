import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogger } from '@/lib/logger/client-logger';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'ACCOUNTING' | 'MANAGEMENT' | 'CUSTOMER';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
  });
  const router = useRouter();

  useEffect(() => {
    // Check local storage on mount
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      // In a real app, you might want to validate the token with /api/v1/auth/me here
      // For now, we'll optimistically assume it's valid or handle 401s in api calls
      fetchUser(storedToken);
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuthState({
          user: data.data.user,
          accessToken: token,
          isLoading: false,
        });
      } else {
        // Only logout if the token is invalid, but avoid immediate redirect loop if possible
        // Let components handle the redirect if needed
        localStorage.removeItem('accessToken');
        setAuthState({
          user: null,
          accessToken: null,
          isLoading: false,
        });
      }
    } catch (error) {
      clientLogger.error('Failed to fetch user', error);
      // Don't auto logout on network error to avoid bad UX
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = (token: string, user: User) => {
    localStorage.setItem('accessToken', token);
    setAuthState({
      user,
      accessToken: token,
      isLoading: false,
    });
    // Router push handled in component
  };

  const logout = async () => {
    const token = localStorage.getItem('refreshToken')
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ refreshToken: token }),
      })
    } catch {
      // Best effort — clear client state regardless
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setAuthState({ user: null, accessToken: null, isLoading: false })
    router.push('/login')
  };

  return {
    ...authState,
    login,
    logout,
  };
}
