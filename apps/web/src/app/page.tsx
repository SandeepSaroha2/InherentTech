'use client';

import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Users,
  FileText,
  Briefcase,
  Globe,
  Shield,
  BarChart3,
  Bot,
  ArrowRight,
  Star,
  CheckCircle,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const products = [
  {
    name: 'AIOCRM',
    icon: BarChart3,
    description:
      'AI-powered CRM for managing client relationships and sales pipeline with intelligent insights.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    name: 'ATS',
    icon: Users,
    description:
      'Advanced applicant tracking system to streamline recruitment and hiring workflows.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    name: 'KudoDoc',
    icon: FileText,
    description:
      'Digital document management and e-signature solution for seamless workflows.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    name: 'JobPlatform',
    icon: Briefcase,
    description:
      'Full-featured job board and career portal to attract top talent for your clients.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    name: 'Web Portal',
    icon: Globe,
    description:
      'Self-service portal for employees, clients, and candidates with real-time dashboards.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    name: 'AI Agents',
    icon: Bot,
    description:
      'Autonomous AI agents to automate repetitive IT staffing tasks and improve efficiency.',
    color: 'bg-indigo-50 text-indigo-600',
  },
];

const features = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'SOC 2 compliant, end-to-end encryption, and role-based access control to keep your data secure.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Automation',
    description:
      'Leverage advanced AI to match candidates, automate screening, and predict hiring success.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description:
      'Centralized dashboards with real-time insights across all your recruitment operations.',
  },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'VP of Talent, TechForce Solutions',
    quote:
      'InherentTech reduced our time-to-fill by 40%. The AI matching alone has transformed how we source candidates.',
    rating: 5,
  },
  {
    name: 'James Park',
    role: 'CEO, Apex Staffing Group',
    quote:
      'We consolidated 5 separate tools into one platform. The ROI was visible within the first quarter.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Director of Operations, NovaTech',
    quote:
      'The document management and e-signature features saved our team 15 hours per week on compliance paperwork.',
    rating: 5,
  },
];

const stats = [
  { value: '500+', label: 'Staffing Companies' },
  { value: '2M+', label: 'Candidates Placed' },
  { value: '40%', label: 'Faster Time-to-Fill' },
  { value: '99.9%', label: 'Platform Uptime' },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-blue-600">
              InherentTech
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Products</a>
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Testimonials</a>
              <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Pricing</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            <a href="#products" className="block text-sm font-medium text-gray-600 py-2">Products</a>
            <a href="#features" className="block text-sm font-medium text-gray-600 py-2">Features</a>
            <a href="#testimonials" className="block text-sm font-medium text-gray-600 py-2">Testimonials</a>
            <Link href="/pricing" className="block text-sm font-medium text-gray-600 py-2">Pricing</Link>
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Link href="/login" className="text-center px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg">Sign In</Link>
              <Link href="/signup" className="text-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg">Get Started Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2dyaWQpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
              AI-Powered IT Staffing{' '}
              <span className="text-blue-200">Platform</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Automate your entire recruiting workflow with our unified AI-powered
              platform. From lead generation to placement management, we have got you
              covered.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-blue-700 bg-white rounded-lg hover:bg-gray-50 transition shadow-lg shadow-blue-900/20"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition"
              >
                View Pricing
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Our Product Suite
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to streamline your staffing operations on one
              integrated platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, idx) => {
              const Icon = product.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group"
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${product.color} mb-5`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Why Choose InherentTech?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built for IT staffing companies that demand performance, security,
              and intelligence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-5">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Trusted by Industry Leaders
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              See what our customers have to say about InherentTech.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-md transition"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-blue-600 to-indigo-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Staffing Operations?
          </h2>
          <p className="text-lg text-blue-100 mb-10">
            Join hundreds of staffing companies already using InherentTech to
            streamline their workflows and boost revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-blue-700 bg-white rounded-lg hover:bg-gray-50 transition shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition"
            >
              View Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-lg font-bold text-white mb-3">InherentTech</h4>
              <p className="text-sm leading-relaxed">
                AI-powered staffing platform for modern recruitment teams.
              </p>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white mb-3">Product</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white mb-3">Company</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white mb-3">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 InherentTech Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
