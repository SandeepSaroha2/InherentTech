/**
 * Resend Client Initialization
 *
 * Provides a singleton instance of the Resend email service client.
 * Uses RESEND_API_KEY from environment variables.
 *
 * Usage:
 * ```
 * import { getResend } from '@inherenttech/db';
 * const resend = getResend();
 * const result = await resend.emails.send({ ... });
 * ```
 */

import { Resend } from 'resend';

let _resend: Resend | null = null;

/**
 * Get or initialize the Resend client singleton
 * @throws Error if RESEND_API_KEY is not set
 */
export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    _resend = new Resend(key);
  }
  return _resend;
}

/**
 * Reset the Resend client instance (useful for testing)
 */
export function resetResend(): void {
  _resend = null;
}

/**
 * Check if Resend API key is configured
 */
export function hasResendKey(): boolean {
  return !!process.env.RESEND_API_KEY;
}
