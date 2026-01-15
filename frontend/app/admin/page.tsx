'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Show 404 instead of redirecting to login
    router.replace('/not-found');
  }, [router]);

  return null;
}
