'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import ServiceForm from '@/components/vendor/ServiceForm';
import VendorLayout from '@/components/vendor/VendorLayout';
import toast from 'react-hot-toast';

export default function NewService() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [hasService, setHasService] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    checkExistingService();
  }, [token]);

  const checkExistingService = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.services?.length >= 1) {
        setHasService(true);
        toast.error('You can only list a maximum of one service on this platform.');
        router.push('/vendor/services');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <VendorLayout title="My Services" subtitle="Checking limits...">
        <div className="flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </VendorLayout>
    );
  }

  if (hasService) return null;

  return <ServiceForm />;
}
