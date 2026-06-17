'use client';
import { AdminUsers } from '@/components/admin/users/admin-users';
import { usePss } from '@/hooks/use-pss';
import { useAuth } from '@/hooks/use-auth';

export default function UsersPage() {
  const { pss }  = usePss();
  const { user } = useAuth();

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="p-6 text-sm text-[#6B7280]">
        Access restricted to Admin and above.
      </div>
    );
  }

  return <AdminUsers pss={pss} />;
}
