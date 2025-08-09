
'use client';

import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Skeleton } from './ui/skeleton';

interface AuthContextType {
  user: User | null;
  refreshUser: () => void;
  userVersion: number;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  refreshUser: () => {},
  userVersion: 0 
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [userVersion, setUserVersion] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(() => {
    setUser(auth.currentUser);
    setUserVersion(v => v + 1);
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setUserVersion(v => v + 1);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!user && !isAuthPage && pathname !== '/') {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/dashboard');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
     return (
      <div className="flex flex-col space-y-3 p-8">
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, refreshUser, userVersion }}>{children}</AuthContext.Provider>
  );
}
