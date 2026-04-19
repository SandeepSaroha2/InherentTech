'use client';

import React from 'react';
import { AuthProvider, getSupabaseBrowserClient } from '@inherenttech/ui';

const supabaseClient = getSupabaseBrowserClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider supabaseClient={supabaseClient}>
      {children}
    </AuthProvider>
  );
}
