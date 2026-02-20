import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

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
        const apiUser = data.data as {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          role: string;
          language?: string;
          is_active?: boolean;
          last_login_at?: string | null;
        };

        const uiUser = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.first_name ?? undefined,
          role: apiUser.role.toUpperCase() as User['role'],
        };

        setAuthState({
          user: uiUser,
          accessToken: token,
          isLoading: false,
        });
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      logout();
    }
  };

  const login = (token: string, user: User) => {
    localStorage.setItem('accessToken', token);
    setAuthState({
      user,
      accessToken: token,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setAuthState({
      user: null,
      accessToken: null,
      isLoading: false,
    });
    router.push('/login');
  };

  return {
    ...authState,
    login,
    logout,
  };
}
