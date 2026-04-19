'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm, useAuth } from '@inherenttech/ui';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (!loading && user) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: 32, backgroundColor: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>ATS</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Create your account</p>
        </div>
        <SignupForm
          onSuccess={() => {}}
          onSignInClick={() => router.push('/login')}
        />
      </div>
    </div>
  );
}
