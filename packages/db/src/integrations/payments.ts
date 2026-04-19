/**
 * InherentPayments — Unified Payment Processing
 * https://inherentpayments.com
 *
 * Centralized payment layer for all InherentTech products.
 * Currently integrates: Stripe
 * Future: PayPal, ACH/bank transfers, international wire
 *
 * Used by:
 * - ATS: Invoice billing, client payments, contractor payroll
 * - AIOCRM: Deal payment tracking, retainer billing
 * - KudoDoc: Document signing fees
 * - JobPlatform: Premium listings, featured jobs
 * - eCafy: Campaign credits, usage-based billing
 */

// ─── Configuration ───

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
const INHERENT_PAYMENTS_WEBHOOK_SECRET = process.env.INHERENT_PAYMENTS_WEBHOOK_SECRET || '';

// ─── Types ───

export type PaymentProvider = 'stripe' | 'paypal' | 'ach' | 'wire';

export interface PaymentCustomer {
  id?: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export interface PaymentInvoice {
  id?: string;
  customerId: string;
  items: PaymentLineItem[];
  currency?: string;
  dueDate?: string;
  memo?: string;
  metadata?: Record<string, string>;
}

export interface PaymentLineItem {
  description: string;
  quantity: number;
  unitAmount: number; // in cents
  taxRate?: number; // percentage
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
  customerId?: string;
}

export interface PaymentSubscription {
  id: string;
  customerId: string;
  priceId: string;
  status: string;
  currentPeriodEnd: string;
}

export interface PaymentPayout {
  id?: string;
  recipientEmail: string;
  recipientName: string;
  amount: number; // in cents
  currency?: string;
  description?: string;
  method: 'ach' | 'wire' | 'check';
  bankAccount?: {
    routingNumber: string;
    accountNumber: string;
    accountType: 'checking' | 'savings';
  };
}

export interface PaymentWebhookEvent {
  type: string;
  provider: PaymentProvider;
  data: any;
  timestamp: string;
}

// ─── Stripe Integration (Primary Provider) ───

async function stripeFetch(path: string, options: RequestInit = {}) {
  const url = `https://api.stripe.com/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Stripe error: ${err.error?.message || res.statusText}`);
  }

  return res.json();
}

function toFormData(obj: Record<string, any>, prefix = ''): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        parts.push(toFormData(value, fullKey));
      } else {
        parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`);
      }
    }
  }
  return parts.filter(Boolean).join('&');
}

// ─── Customer Management ───

export async function createCustomer(customer: PaymentCustomer): Promise<{ id: string; provider: PaymentProvider }> {
  const data = await stripeFetch('/customers', {
    method: 'POST',
    body: toFormData({
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      metadata: {
        company: customer.company || '',
        source: 'inherenttech-platform',
        ...customer.metadata,
      },
    }),
  });
  return { id: data.id, provider: 'stripe' };
}

export async function getCustomer(customerId: string): Promise<any> {
  return stripeFetch(`/customers/${customerId}`);
}

export async function updateCustomer(customerId: string, updates: Partial<PaymentCustomer>): Promise<any> {
  return stripeFetch(`/customers/${customerId}`, {
    method: 'POST',
    body: toFormData({
      ...(updates.email && { email: updates.email }),
      ...(updates.name && { name: updates.name }),
      ...(updates.phone && { phone: updates.phone }),
    }),
  });
}

// ─── Invoice Management ───

export async function createInvoice(invoice: PaymentInvoice): Promise<{ id: string; hostedUrl: string; pdfUrl: string }> {
  // Create invoice
  const inv = await stripeFetch('/invoices', {
    method: 'POST',
    body: toFormData({
      customer: invoice.customerId,
      currency: invoice.currency || 'usd',
      collection_method: 'send_invoice',
      days_until_due: 30,
      ...(invoice.memo && { description: invoice.memo }),
      metadata: invoice.metadata || {},
    }),
  });

  // Add line items
  for (const item of invoice.items) {
    await stripeFetch('/invoiceitems', {
      method: 'POST',
      body: toFormData({
        customer: invoice.customerId,
        invoice: inv.id,
        description: item.description,
        quantity: item.quantity,
        unit_amount: item.unitAmount,
        currency: invoice.currency || 'usd',
      }),
    });
  }

  return {
    id: inv.id,
    hostedUrl: inv.hosted_invoice_url || '',
    pdfUrl: inv.invoice_pdf || '',
  };
}

export async function sendInvoice(invoiceId: string): Promise<{ id: string; status: string }> {
  const inv = await stripeFetch(`/invoices/${invoiceId}/finalize`, { method: 'POST' });
  await stripeFetch(`/invoices/${invoiceId}/send`, { method: 'POST' });
  return { id: inv.id, status: inv.status };
}

export async function voidInvoice(invoiceId: string): Promise<void> {
  await stripeFetch(`/invoices/${invoiceId}/void`, { method: 'POST' });
}

// ─── Payment Intents (One-time payments) ───

export async function createPaymentIntent(
  amount: number,
  currency = 'usd',
  customerId?: string,
  metadata?: Record<string, string>,
): Promise<PaymentIntent> {
  const data = await stripeFetch('/payment_intents', {
    method: 'POST',
    body: toFormData({
      amount,
      currency,
      ...(customerId && { customer: customerId }),
      metadata: { source: 'inherenttech', ...metadata },
    }),
  });

  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    clientSecret: data.client_secret,
    customerId: data.customer,
  };
}

export async function getPaymentIntent(intentId: string): Promise<PaymentIntent> {
  const data = await stripeFetch(`/payment_intents/${intentId}`);
  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    customerId: data.customer,
  };
}

// ─── Subscriptions ───

export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata?: Record<string, string>,
): Promise<PaymentSubscription> {
  const data = await stripeFetch('/subscriptions', {
    method: 'POST',
    body: toFormData({
      customer: customerId,
      'items[0][price]': priceId,
      metadata: metadata || {},
    }),
  });

  return {
    id: data.id,
    customerId: data.customer,
    priceId,
    status: data.status,
    currentPeriodEnd: new Date(data.current_period_end * 1000).toISOString(),
  };
}

export async function cancelSubscription(subscriptionId: string, atPeriodEnd = true): Promise<void> {
  if (atPeriodEnd) {
    await stripeFetch(`/subscriptions/${subscriptionId}`, {
      method: 'POST',
      body: 'cancel_at_period_end=true',
    });
  } else {
    await stripeFetch(`/subscriptions/${subscriptionId}`, { method: 'DELETE' });
  }
}

// ─── Checkout Sessions (Hosted Payment Page) ───

export async function createCheckoutSession(params: {
  customerId?: string;
  lineItems: Array<{ priceId?: string; name?: string; amount?: number; quantity: number }>;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ id: string; url: string }> {
  const body: Record<string, any> = {
    mode: params.mode,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata || {},
  };

  if (params.customerId) body.customer = params.customerId;

  params.lineItems.forEach((item, i) => {
    if (item.priceId) {
      body[`line_items[${i}][price]`] = item.priceId;
    } else {
      body[`line_items[${i}][price_data][currency]`] = 'usd';
      body[`line_items[${i}][price_data][product_data][name]`] = item.name || 'Payment';
      body[`line_items[${i}][price_data][unit_amount]`] = item.amount || 0;
    }
    body[`line_items[${i}][quantity]`] = item.quantity;
  });

  const data = await stripeFetch('/checkout/sessions', {
    method: 'POST',
    body: toFormData(body),
  });

  return { id: data.id, url: data.url };
}

// ─── Payouts (Contractor payments) ───

export async function recordPayout(payout: PaymentPayout): Promise<{ id: string; status: string }> {
  // For now, record payout intent — actual ACH/wire requires Stripe Connect or Treasury
  // This creates a transfer record that can be fulfilled manually or via connected accounts
  console.log(`[InherentPayments] Payout recorded: $${payout.amount / 100} to ${payout.recipientEmail} via ${payout.method}`);
  return {
    id: `payout_${Date.now()}`,
    status: 'pending',
  };
}

// ─── Dashboard / Analytics ───

export async function getPaymentDashboard(): Promise<{
  balance: { available: number; pending: number };
  recentCharges: number;
  monthlyRevenue: number;
}> {
  const balance = await stripeFetch('/balance');

  return {
    balance: {
      available: balance.available?.[0]?.amount || 0,
      pending: balance.pending?.[0]?.amount || 0,
    },
    recentCharges: 0, // Would need charges list
    monthlyRevenue: 0, // Would need aggregation
  };
}

// ─── Publishable Key (for frontend) ───

export function getPublishableKey(): string {
  return STRIPE_PUBLISHABLE_KEY;
}

// ─── Webhook Verification ───

export function parseWebhookEvent(body: string, signature: string): PaymentWebhookEvent | null {
  // In production, verify with Stripe webhook secret
  // For now, parse the body directly
  try {
    const event = JSON.parse(body);
    return {
      type: event.type,
      provider: 'stripe',
      data: event.data?.object || event.data,
      timestamp: new Date(event.created * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}
