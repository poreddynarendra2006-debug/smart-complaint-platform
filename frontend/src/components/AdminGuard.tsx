'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  getUserRole,
} from '@/lib/auth';

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const checkRole =
      async () => {
        const role =
          await getUserRole();

        if (role !== 'ADMIN') {
          router.push('/');
          return;
        }

        setLoading(false);
      };

    checkRole();
  }, [router]);

  if (loading) {
    return (
      <div
        style={{
          padding: '40px',
        }}
      >
        Checking admin access...
      </div>
    );
  }

  return <>{children}</>;
}