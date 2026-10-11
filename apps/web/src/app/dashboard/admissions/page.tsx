import { AdmissionKanbanBoard } from '@/components/admissions/AdmissionKanbanBoard';

export const metadata = {
  title: 'Admissions Pipeline | Staff Dashboard',
  description: 'Manage incoming student applications and interview schedules.',
};

export default function DashboardAdmissionsPage() {
  return <AdmissionKanbanBoard />;
}
