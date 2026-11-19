import { SchoolMessagingWorkspace } from '@/components/SchoolMessagingWorkspace';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
  return <ProtectedRoute allowedRoles={['SCHOOL_OWNER', 'PRINCIPAL', 'SCHOOL_ADMIN']}><SchoolMessagingWorkspace /></ProtectedRoute>;
}
