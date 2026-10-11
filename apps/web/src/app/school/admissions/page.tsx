import { AdmissionKanbanBoard } from '@/components/admissions/AdmissionKanbanBoard';

export const metadata = {
  title: 'Digital Admissions & Lead Management CRM | School Admin',
  description:
    'Kanban pipeline board for processing school admission leads from Inquiry Received to Admitted.',
};

export default function SchoolAdmissionsPage() {
  return <AdmissionKanbanBoard />;
}
