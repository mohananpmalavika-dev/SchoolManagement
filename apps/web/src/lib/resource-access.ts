import { schoolRoles, teacherRoles } from './session';

const managers = ['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'];
const administrators = managers.filter(role => role !== 'DEPUTY_PRINCIPAL');
// Keep these write roles aligned with workspace/records.ts and WorkspaceService.
const writers: Record<string, string[]> = {
  students: [...managers, 'RECEPTIONIST'],
  guardians: [...administrators, 'RECEPTIONIST'],
  'guardian-links': [...administrators, 'RECEPTIONIST'],
  staff: administrators,
  schools: managers, years: managers, terms: managers, classes: managers,
  streams: managers, subjects: managers, inventory: managers, events: managers,
  timetable: managers, examinations: managers, 'report-cards': managers,
  books: [...administrators, 'LIBRARIAN'], borrowings: [...administrators, 'LIBRARIAN'],
  vehicles: [...administrators, 'TRANSPORT_OFFICER'], routes: [...administrators, 'TRANSPORT_OFFICER'],
  invoices: [...administrators, 'ACCOUNTANT'], payments: [...administrators, 'ACCOUNTANT'],
  tickets: ['SUPER_ADMIN', ...schoolRoles],
  assignments: [...administrators, ...teacherRoles], materials: [...administrators, ...teacherRoles],
  submissions: [...managers, ...teacherRoles],
};

export function canWriteResource(role: string, endpoint: string): boolean {
  const workspace = /^\/workspace\/([^/]+)$/.exec(endpoint);
  if (workspace) return writers[workspace[1]]?.includes(role) ?? false;
  return role === 'SUPER_ADMIN' && /^\/admin\/[^/]+$/.test(endpoint);
}

export function canActOnResource(role: string, endpoint: string, action: string): boolean {
  if (endpoint === '/admin/announcements') return role === 'SUPER_ADMIN' && action === 'publish';
  const resource = /^\/workspace\/([^/]+)$/.exec(endpoint)?.[1];
  if (!resource || !canWriteResource(role, endpoint)) return false;
  return resource === 'borrowings' && action === 'return'
    || ['years', 'terms'].includes(resource) && action === 'current'
    || ['examinations', 'report-cards'].includes(resource) && action === 'publish';
}
