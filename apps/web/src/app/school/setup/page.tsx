import { SchoolSetupWorkspace } from '@/components/SchoolSetupWorkspace';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { preschoolManagers } from '@/lib/preschool';

export default function Page() {
  return <ProtectedRoute allowedRoles={preschoolManagers}><SchoolSetupWorkspace /></ProtectedRoute>;
}
