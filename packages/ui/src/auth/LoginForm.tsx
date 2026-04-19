'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export function LoginForm({
  onSuccess,
  onSignUpClick,
  onForgotPasswordClick,
  showGoogleLogin = true,
  showMagicLink = true,
}: {
  onSuccess?: () => void;
  onSignUpClick?: () => void;
  onForgotPasswordClick?: () => void;
  showGoogleLogin?: boolean;
  showMagicLink?: boolean;
}) {
  const { signIn, signInWithGoogle, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    setLoading(true);
    try {
      await signInWithMagicLink(email);
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', padding: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: '#666', marginBottom: 16 }}>
          We sent a login link to <strong>{email}</strong>
        </p>
        <button
          onClick={() => setMagicLinkSent(false)}
          style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Sign In</h2>

      {error && (
        <div style={{ padding: '8px 12px', marginBottom: 16, backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            placeholder="you@company.com"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            placeholder="••••••••"
          />
        </div>

        {onForgotPasswordClick && (
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <button type="button" onClick={onForgotPasswordClick} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {(showGoogleLogin || showMagicLink) && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: 12 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>OR</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {showGoogleLogin && (
              <button
                onClick={handleGoogleLogin}
                style={{ width: '100%', padding: '10px 16px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}
              >
                Continue with Google
              </button>
            )}
            {showMagicLink && (
              <button
                onClick={handleMagicLink}
                style={{ width: '100%', padding: '10px 16px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}
              >
                Send Magic Link
              </button>
            )}
          </div>
        </>
      )}

      {onSignUpClick && (
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          Don&apos;t have an account?{' '}
          <button onClick={onSignUpClick} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Sign Up
          </button>
        </p>
      )}
    </div>
  );
}
