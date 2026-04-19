import { DashboardShell } from './DashboardShell';

export const metadata = {
  title: 'ATS - InherentTech',
  description: 'Applicant Tracking System for IT staffing',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
