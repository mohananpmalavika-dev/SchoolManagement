import { CheckInWorkspace } from '@/components/CheckInWorkspace';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
  return <ProtectedRoute allowedRoles={['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN']}><CheckInWorkspace /></ProtectedRoute>;
}
