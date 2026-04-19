'use client';

import React, { useState } from 'react';

export type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
};

export type SidebarProps = {
  appName: string;
  appIcon?: React.ReactNode;
  navItems: NavItem[];
  currentPath: string;
  onNavigate: (href: string) => void;
  footer?: React.ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Sidebar({ appName, appIcon, navItems, currentPath, onNavigate, footer, collapsed = false, onToggleCollapse }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + '/');

  return (
    <aside style={{
      width: collapsed ? 64 : 256,
      height: '100vh',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: collapsed ? '16px 12px' : '16px 20px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 64,
      }}>
        {appIcon && <div style={{ flexShrink: 0 }}>{appIcon}</div>}
        {!collapsed && <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{appName}</span>}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4,
              fontSize: 16,
            }}
          >
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {navItems.map(item => (
          <div key={item.label}>
            <button
              onClick={() => item.children ? toggleGroup(item.label) : onNavigate(item.href)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 20px' : '10px 20px',
                border: 'none',
                background: isActive(item.href) ? '#1e293b' : 'transparent',
                color: isActive(item.href) ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: isActive(item.href) ? 600 : 400,
                textAlign: 'left',
                borderLeft: isActive(item.href) ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive(item.href)) (e.currentTarget.style.backgroundColor = '#1e293b');
              }}
              onMouseLeave={e => {
                if (!isActive(item.href)) (e.currentTarget.style.backgroundColor = 'transparent');
              }}
            >
              {item.icon && <span style={{ flexShrink: 0, width: 20, textAlign: 'center' }}>{item.icon}</span>}
              {!collapsed && (
                <>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 10,
                      minWidth: 20,
                      textAlign: 'center',
                    }}>
                      {item.badge}
                    </span>
                  )}
                  {item.children && <span style={{ fontSize: 10 }}>{expandedGroups.has(item.label) ? '▼' : '▶'}</span>}
                </>
              )}
            </button>

            {/* Submenu */}
            {!collapsed && item.children && expandedGroups.has(item.label) && (
              <div style={{ paddingLeft: 20 }}>
                {item.children.map(child => (
                  <button
                    key={child.href}
                    onClick={() => onNavigate(child.href)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 20px',
                      border: 'none',
                      background: isActive(child.href) ? '#1e293b' : 'transparent',
                      color: isActive(child.href) ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                      fontSize: 13,
                      textAlign: 'left',
                    }}
                  >
                    <span>{child.label}</span>
                    {child.badge && (
                      <span style={{ backgroundColor: '#334155', fontSize: 10, padding: '1px 5px', borderRadius: 8 }}>{child.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {footer && !collapsed && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1e293b' }}>
          {footer}
        </div>
      )}
    </aside>
  );
}
