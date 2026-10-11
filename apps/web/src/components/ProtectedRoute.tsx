'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui';
import { homeForRole } from '@/lib/session';
export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const permitted = !!user && (!allowedRoles || allowedRoles.includes(user.role));
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    else if (!isLoading && user && !permitted) router.replace(homeForRole(user.role));
  }, [isLoading, user, permitted, router]);
  if (isLoading) return <PageLoader />;
  return permitted ? <>{children}</> : null;
}