'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterCustomerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/register?role=customer');
  }, []);
  return null;
}
