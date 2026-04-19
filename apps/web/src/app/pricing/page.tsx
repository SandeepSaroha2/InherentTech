'use client';

import { useState } from 'react';
import { Button } from '@inherenttech/ui';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface PricingTier {
  name: string;
  price: number;
  period: string;
  description: string;
  cta: string;
  highlighted?: boolean;
  features: string[];
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    period: 'Forever Free',
    description: 'Perfect for getting started',
    cta: 'Start Free',
    features: [
      'Up to 5 users',
      '5,000 API calls/month',
      'Basic reporting',
      'Community support',
      'Core features only',
    ],
  },
  {
    name: 'Starter',
    price: 49,
    period: '/month',
    description: 'For small teams',
    cta: 'Start Free Trial',
    features: [
      'Up to 25 users',
      '100,000 API calls/month',
      'Advanced reporting',
      'Email support',
      'All core features',
      'Basic integrations',
      'Custom branding',
    ],
  },
  {
    name: 'Professional',
    price: 149,
    period: '/month',
    description: 'For growing companies',
    cta: 'Start Free Trial',
    highlighted: true,
    features: [
      'Up to 100 users',
      'Unlimited API calls',
      'Advanced analytics',
      'Priority support',
      'All Starter features',
      'Custom integrations',
      'Advanced security',
      'White-label options',
      'API webhooks',
    ],
  },
  {
    name: 'Enterprise',
    price: 0,
    period: 'Custom',
    description: 'For large organizations',
    cta: 'Contact Sales',
    features: [
      'Unlimited users',
      'Unlimited API calls',
      'Custom analytics',
      'Dedicated support',
      'All Professional features',
      'Custom development',
      'SSO & SAML',
      'Compliance certifications',
      'SLA guarantees',
    ],
  },
];

const FEATURES_COMPARISON = [
  { category: 'Users', free: 'Up to 5', starter: 'Up to 25', professional: 'Up to 100', enterprise: 'Unlimited' },
  { category: 'API Calls/month', free: '5K', starter: '100K', professional: 'Unlimited', enterprise: 'Unlimited' },
  { category: 'Reporting', free: 'Basic', starter: 'Advanced', professional: 'Advanced', enterprise: 'Custom' },
  { category: 'Support', free: 'Community', starter: 'Email', professional: 'Priority', enterprise: 'Dedicated' },
  { category: 'Integrations', free: 'Limited', starter: 'Basic', professional: 'Custom', enterprise: 'Custom' },
  { category: 'White-label', free: 'No', starter: 'Yes', professional: 'Yes', enterprise: 'Yes' },
  { category: 'SSO & SAML', free: 'No', starter: 'No', professional: 'No', enterprise: 'Yes' },
  { category: 'SLA', free: 'No', starter: 'No', professional: 'No', enterprise: '99.9% uptime' },
];

const FAQS = [
  {
    question: 'Can I change plans anytime?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.',
  },
  {
    question: 'Is there a contract requirement?',
    answer: 'No contracts required for any plan. Monthly plans can be cancelled anytime. Annual plans include a 30-day money-back guarantee.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), bank transfers, and digital wallets.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes! Annual plans include a 20% discount compared to monthly billing. Even better discounts available for Enterprise customers.',
  },
  {
    question: 'What is included in support?',
    answer: 'Free plans get community support via forums. Starter includes email support (24-48hr response). Professional gets priority email support (2-4hr). Enterprise includes dedicated account management and phone support.',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  const getPrice = (basePrice: number) => {
    if (basePrice === 0) return 0;
    return billingCycle === 'annual' ? Math.floor(basePrice * 12 * 0.8) : basePrice;
  };

  const getPeriod = (period: string) => {
    if (period === 'Forever Free') return 'Forever Free';
    if (period === 'Custom') return 'Custom';
    if (billingCycle === 'annual') return '/year';
    return '/month';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Choose the perfect plan for your business. Always flexible. No hidden fees.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-600'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 transition-colors duration-200"
            style={{
              backgroundColor: billingCycle === 'annual' ? '#3b82f6' : '#e5e7eb',
            }}
          >
            <span
              className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200"
              style={{
                transform: billingCycle === 'annual' ? 'translateX(1.75rem)' : 'translateX(0.25rem)',
              }}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-600'}`}>
            Annual
          </span>
          {billingCycle === 'annual' && (
            <span className="ml-2 inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
              Save 20%
            </span>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_TIERS.map((tier: PricingTier, idx: number) => (
            <div
              key={idx}
              className={`relative rounded-2xl transition-all duration-200 ${
                tier.highlighted
                  ? 'ring-2 ring-blue-600 shadow-2xl scale-105 md:scale-110'
                  : 'bg-white border border-gray-200 shadow-lg'
              } ${!tier.highlighted ? 'bg-white' : 'bg-gradient-to-br from-blue-50 to-white'}`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 text-sm mb-6">{tier.description}</p>

                <div className="mb-6">
                  {tier.price === 0 && tier.period === 'Custom' ? (
                    <div className="text-3xl font-bold text-gray-900">Custom</div>
                  ) : (
                    <>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">${getPrice(tier.price)}</span>
                        <span className="text-gray-600 ml-2">{getPeriod(tier.period)}</span>
                      </div>
                      {billingCycle === 'annual' && tier.price > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          ${Math.floor(getPrice(tier.price) / 12)}/month billed annually
                        </p>
                      )}
                    </>
                  )}
                </div>

                <Button
                  className={`w-full mb-8 font-semibold transition-all duration-200 ${
                    tier.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                  size="lg"
                >
                  {tier.cta}
                </Button>

                <div className="space-y-4">
                  {tier.features.map((feature: string, fidx: number) => (
                    <div key={fidx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Detailed Feature Comparison</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                {['Free', 'Starter', 'Professional', 'Enterprise'].map((plan: string) => (
                  <th key={plan} className="text-center py-4 px-6 font-semibold text-gray-900">
                    {plan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES_COMPARISON.map((row: typeof FEATURES_COMPARISON[0], idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-4 px-6 text-gray-900 font-medium">{row.category}</td>
                  <td className="text-center py-4 px-6 text-gray-600">{row.free}</td>
                  <td className="text-center py-4 px-6 text-gray-600">{row.starter}</td>
                  <td className="text-center py-4 px-6 text-gray-600">{row.professional}</td>
                  <td className="text-center py-4 px-6 text-gray-600">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {FAQS.map((faq: typeof FAQS[0], idx: number) => (
            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 text-left">{faq.question}</span>
                {expandedFAQ === idx ? (
                  <ChevronUp className="h-5 w-5 text-gray-600 flex-shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600 flex-shrink-0 ml-4" />
                )}
              </button>

              {expandedFAQ === idx && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of companies using InherentTech to streamline their operations.
          </p>
          <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg">
            Start Your Free Trial Today
          </Button>
        </div>
      </div>
    </div>
  );
}
