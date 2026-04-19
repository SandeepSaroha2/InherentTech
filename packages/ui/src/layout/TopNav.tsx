'use client';

import React, { useState, useRef, useEffect } from 'react';

export type TopNavProps = {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onBreadcrumbClick?: (href: string) => void;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  notifications?: number;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onSignOut?: () => void;
  actions?: React.ReactNode;
};

export function TopNav({
  title,
  breadcrumbs,
  onBreadcrumbClick,
  showSearch = true,
  onSearch,
  searchPlaceholder = 'Search...',
  userName,
  userEmail,
  userAvatar,
  notifications = 0,
  onNotificationsClick,
  onProfileClick,
  onSignOut,
  actions,
}: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header style={{
      height: 64,
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Breadcrumbs / Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {breadcrumbs ? (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: '#d1d5db' }}>/</span>}
                {crumb.href ? (
                  <button
                    onClick={() => onBreadcrumbClick?.(crumb.href!)}
                    style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0 }}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span style={{ color: '#111827', fontWeight: 600 }}>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : title ? (
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h1>
        ) : null}
      </div>

      {/* Search */}
      {showSearch && onSearch && (
        <form onSubmit={handleSearch} style={{ width: 320 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 14,
              backgroundColor: '#f9fafb',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </form>
      )}

      {/* Actions */}
      {actions}

      {/* Notifications */}
      {onNotificationsClick && (
        <button
          onClick={onNotificationsClick}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            fontSize: 18,
          }}
        >
          🔔
          {notifications > 0 && (
            <span style={{
              position: 'absolute',
              top: 2,
              right: 2,
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: 10,
              fontWeight: 700,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {notifications > 99 ? '99+' : notifications}
            </span>
          )}
        </button>
      )}

      {/* User Menu */}
      {userName && (
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 8,
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              overflow: 'hidden',
            }}>
              {userAvatar ? (
                <img src={userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              )}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{userName}</span>
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              backgroundColor: 'white',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              minWidth: 200,
              padding: '4px 0',
              zIndex: 50,
            }}>
              {userEmail && (
                <div style={{ padding: '8px 16px', fontSize: 12, color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>
                  {userEmail}
                </div>
              )}
              {onProfileClick && (
                <button onClick={() => { onProfileClick(); setShowUserMenu(false); }} style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14 }}>
                  Profile Settings
                </button>
              )}
              {onSignOut && (
                <button onClick={() => { onSignOut(); setShowUserMenu(false); }} style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, color: '#ef4444' }}>
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
