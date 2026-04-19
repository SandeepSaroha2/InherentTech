'use client';

import React, { useState } from 'react';
import { Sidebar, type NavItem } from './Sidebar';
import { TopNav, type TopNavProps } from './TopNav';

export type AppShellProps = {
  appName: string;
  appIcon?: React.ReactNode;
  navItems: NavItem[];
  currentPath: string;
  onNavigate: (href: string) => void;
  children: React.ReactNode;
  topNavProps?: Omit<TopNavProps, 'userName' | 'userEmail'>;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  onSignOut?: () => void;
  sidebarFooter?: React.ReactNode;
};

export function AppShell({
  appName,
  appIcon,
  navItems,
  currentPath,
  onNavigate,
  children,
  topNavProps,
  userName,
  userEmail,
  userAvatar,
  onSignOut,
  sidebarFooter,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        appName={appName}
        appIcon={appIcon}
        navItems={navItems}
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        footer={sidebarFooter}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopNav
          {...topNavProps}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
          onSignOut={onSignOut}
        />
        <main style={{ flex: 1, overflow: 'auto', padding: 24, backgroundColor: '#f8fafc' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
