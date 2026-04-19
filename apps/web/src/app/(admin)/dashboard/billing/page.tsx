'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  tier: string;
  price: number;
  annualPrice?: number;
  description?: string;
  features: string[];
  limits: {
    maxUsers: number;
    maxCandidates: number;
    maxJobOrders: number;
    maxDocuments: number;
    maxEmailsMonth: number;
    maxAgentRuns: number;
    storageGb: number;
  };
  stripePriceId?: string;
  stripeAnnualPriceId?: string;
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
}

interface BillingData {
  subscription: Subscription;
  plan: Plan;
  usage: Record<string, number>;
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Check for success/canceled query params
  useEffect(() => {
    if (searchParams.get('success')) {
      setSuccess('Subscription updated successfully!');
      // Refresh billing data
      fetchBillingData();
    }
    if (searchParams.get('canceled')) {
      setError('Checkout was cancelled.');
    }
  }, [searchParams]);

  // Fetch plans and current billing info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [plansRes, billingRes] = await Promise.all([
          fetch('/api/billing/plans'),
          fetch('/api/billing'),
        ]);

        if (!plansRes.ok) {
          throw new Error('Failed to fetch plans');
        }

        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);

        if (billingRes.ok) {
          const billingData = await billingRes.json();
          setBilling(billingData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load billing information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const res = await fetch('/api/billing');
      if (res.ok) {
        const data = await res.json();
        setBilling(data);
      }
    } catch (err) {
      console.error('Error refreshing billing data:', err);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setCheckoutLoading(true);
      setError(null);

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setCheckoutLoading(true);
      setError(null);

      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create portal session');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open subscription management');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-green-800">{success}</div>
        </div>
      )}

      {/* Current Subscription */}
      {billing && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Plan</p>
              <p className="text-2xl font-bold">{billing.plan.name}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <p className="text-2xl font-bold capitalize">
                {billing.subscription.status.toLowerCase()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Monthly Price</p>
              <p className="text-2xl font-bold">
                ${billing.plan.price.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Current Period</p>
              <p className="text-sm">
                {new Date(
                  billing.subscription.currentPeriodStart
                ).toLocaleDateString()}{' '}
                -{' '}
                {new Date(
                  billing.subscription.currentPeriodEnd
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          {billing.subscription.status && (
            <button
              onClick={handleManageSubscription}
              disabled={checkoutLoading}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {checkoutLoading && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Manage Subscription
            </button>
          )}
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="mb-8 flex items-center gap-4">
        <span className="text-gray-600">Billing Cycle:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg border ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-lg border ${
              billingCycle === 'annual'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent =
            billing?.plan.id === plan.id;
          const price =
            billingCycle === 'annual' && plan.annualPrice
              ? plan.annualPrice
              : plan.price;

          return (
            <div
              key={plan.id}
              className={`rounded-lg border-2 p-6 flex flex-col ${
                isCurrent
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
              {plan.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {plan.description}
                </p>
              )}

              <div className="mb-4">
                <span className="text-3xl font-bold">${price.toFixed(0)}</span>
                <span className="text-gray-600 text-sm">
                  /{billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>

              {isCurrent && (
                <div className="mb-4 px-3 py-1 bg-blue-600 text-white text-sm rounded text-center">
                  Current Plan
                </div>
              )}

              <div className="space-y-2 mb-6 flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Features
                </p>
                {plan.features && plan.features.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="text-gray-700">
                        • {feature}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-gray-700">
                        • +{plan.features.length - 3} more
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>• {plan.limits.maxUsers} Users</p>
                    <p>• {plan.limits.maxCandidates} Candidates</p>
                    <p>• {plan.limits.maxJobOrders} Job Orders</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || checkoutLoading}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  isCurrent
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Usage Information */}
      {billing && Object.keys(billing.usage).length > 0 && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Usage This Month</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(billing.usage).map(([metric, value]) => (
              <div key={metric}>
                <p className="text-gray-600 text-sm capitalize">
                  {metric.replace(/_/g, ' ')}
                </p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
