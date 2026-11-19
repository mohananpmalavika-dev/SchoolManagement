import { MeetingsWorkspace } from '@/components/MeetingsWorkspace';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Page() {
  return <ProtectedRoute allowedRoles={['PRINCIPAL', 'SCHOOL_ADMIN']}><MeetingsWorkspace /></ProtectedRoute>;
}
