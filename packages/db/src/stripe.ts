import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazy-load and cache Stripe instance to avoid recreating on every call
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2024-04-10',
    });
  }
  return _stripe;
}

/**
 * Reset Stripe instance (useful for testing)
 */
export function resetStripe() {
  _stripe = null;
}
