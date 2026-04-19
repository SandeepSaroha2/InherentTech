import { DashboardShell } from './DashboardShell';

export const metadata = {
  title: 'AIOCRM - InherentTech',
  description: 'AI-powered CRM for IT staffing',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
