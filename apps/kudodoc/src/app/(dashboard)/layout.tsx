import { DashboardShell } from './DashboardShell';

export const metadata = {
  title: 'KudoDoc — Digital Signatures',
  description: 'AI-Native Digital Signatures',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
