'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ScrollText,
  Settings,
  LogOut,
} from 'lucide-react';
import { AppShell, useAuth } from '@inherenttech/ui';

const adminNavItems = [
  {
    label: 'Overview',
    href: '/admin',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Organizations',
    href: '/admin/orgs',
    icon: <Building2 size={18} />,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <Users size={18} />,
  },
  {
    label: 'Billing',
    href: '/admin/billing',
    icon: <CreditCard size={18} />,
  },
  {
    label: 'Audit Log',
    href: '/admin/audit',
    icon: <ScrollText size={18} />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings size={18} />,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <AppShell
      appName="InherentTech"
      navItems={adminNavItems}
      currentPath={pathname}
      onNavigate={(href) => router.push(href)}
      userName={user?.name || 'Admin User'}
      userEmail={user?.email || 'admin@inherenttech.com'}
      onSignOut={() => router.push('/login')}
      sidebarFooter={
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition w-full"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      }
    >
      {children}
    </AppShell>
  );
}
