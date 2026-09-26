'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AmbassadorLeaderboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/ambassador/dashboard');
  }, [router]);

  return null;
}
