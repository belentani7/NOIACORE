'use client';

import { useEffect, useState } from 'react';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  tier: string | null;
  loading: boolean;
}

export function useAuth(): AuthState & { login: (email: string, password: string) => Promise<void>; logout: () => void } {
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    email: null,
    tier: null,
    loading: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const tier = localStorage.getItem('tier');

    setState({
      token,
      userId,
      email,
      tier,
      loading: false
    });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error('Login failed');

    const { token, user } = await res.json();
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user.id);
    localStorage.setItem('email', user.email);
    localStorage.setItem('tier', user.tier);

    setState({
      token,
      userId: user.id,
      email: user.email,
      tier: user.tier,
      loading: false
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('tier');
    setState({ token: null, userId: null, email: null, tier: null, loading: false });
  };

  return { ...state, login, logout };
}
