import { AdmissionKanbanBoard } from '@/components/admissions/AdmissionKanbanBoard';

export const metadata = {
  title: 'Admissions & CRM Pipeline | Krypton School ERP',
  description:
    'Platform Admin and School Head pipeline management for student admissions.',
};

export default function AdminAdmissionsPage() {
  return <AdmissionKanbanBoard />;
}
