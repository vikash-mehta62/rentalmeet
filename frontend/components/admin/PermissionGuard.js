'use client';

import { useAuthStore } from '@/lib/store';
import { hasPermission } from '@/lib/permissions';
import { Shield } from 'lucide-react';

export default function PermissionGuard({ permission, children }) {
  const { user } = useAuthStore();

  if (!hasPermission(user, permission)) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
