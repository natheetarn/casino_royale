'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface ClientUser {
  id: string;
  username: string;
  email: string;
  chip_balance: number;
  is_admin: boolean;
}

interface UserContextValue {
  user: ClientUser | null;
  loading: boolean;
  setUser: (user: ClientUser | null) => void;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data.user) {
        setUser(data.user as ClientUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value: UserContextValue = {
    user,
    loading,
    setUser,
    refresh: fetchUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}


