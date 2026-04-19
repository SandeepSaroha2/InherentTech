'use client';

import React from 'react';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({
  children,
  requiredRoles,
  fallback,
  loadingComponent,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <>{loadingComponent || <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>}</>;
  }

  if (!user) {
    return <>{fallback || <div style={{ textAlign: 'center', padding: 48 }}>Please sign in to continue.</div>}</>;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <div style={{ textAlign: 'center', padding: 48 }}>You don&apos;t have permission to view this page.</div>;
  }

  return <>{children}</>;
}
