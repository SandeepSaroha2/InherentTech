// Primitives
export { Button } from './primitives/Button';
export { Input } from './primitives/Input';
export { Card, CardHeader, CardTitle, CardContent, CardDescription } from './primitives/Card';
export { Modal } from './primitives/Modal';
export { Badge } from './primitives/Badge';
export { DataTable } from './data-display/DataTable';
export { KPICard } from './data-display/KPICard';
export { StatusBadge } from './data-display/StatusBadge';
export { AgentActivityFeed } from './data-display/AgentActivityFeed';
export type { AgentActivity } from './data-display/AgentActivityFeed';
export { NotificationBell } from './data-display/NotificationBell';

// Auth
export { AuthProvider, useAuth } from './auth';
export { LoginForm } from './auth';
export { SignupForm } from './auth';
export { ProtectedRoute } from './auth';
export { getSupabaseBrowserClient } from './auth';

// Layout
export { Sidebar, TopNav, AppShell } from './layout';
export type { NavItem, SidebarProps, TopNavProps, AppShellProps } from './layout';

// i18n
export * from './i18n';
