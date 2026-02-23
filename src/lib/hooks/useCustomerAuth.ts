'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface CustomerSession {
  id: string;
  companyName: string;
  taxId: string;
}

interface CustomerAuthState {
  customer: CustomerSession | null;
  accessToken: string | null;
  isLoading: boolean;
}

export function useCustomerAuth() {
  const [state, setState] = useState<CustomerAuthState>({
    customer: null,
    accessToken: null,
    isLoading: true,
  });
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('customerAccessToken');
    const storedCustomer = localStorage.getItem('customer');

    if (storedToken && storedCustomer) {
      try {
        const parsed = JSON.parse(storedCustomer) as CustomerSession;
        setState({ customer: parsed, accessToken: storedToken, isLoading: false });
      } catch {
        localStorage.removeItem('customerAccessToken');
        localStorage.removeItem('customer');
        setState({ customer: null, accessToken: null, isLoading: false });
      }
    } else {
      setState({ customer: null, accessToken: null, isLoading: false });
    }
  }, []);

  const login = (token: string, customer: CustomerSession) => {
    localStorage.setItem('customerAccessToken', token);
    localStorage.setItem('customer', JSON.stringify(customer));
    setState({ customer, accessToken: token, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('customerAccessToken');
    localStorage.removeItem('customer');
    setState({ customer: null, accessToken: null, isLoading: false });
    router.push('/portal/login');
  };

  return {
    ...state,
    login,
    logout,
  };
}

