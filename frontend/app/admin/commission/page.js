'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

export default function AdminCommission() {
  return (
    <AdminLayout title="Commission Settings" subtitle="Commission disabled">
      <div className="bg-white rounded-lg shadow-soft border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-dark-800 mb-2">Commission Removed</h2>
        <p className="text-gray-700 mb-4">
          Platform ab sirf Platform Fee (percentage) use karta hai. Commission hatt chuka hai.
        </p>
        <Link
          href="/admin/platform-settings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
        >
          Go to Platform Settings
        </Link>
      </div>
    </AdminLayout>
  );
}
