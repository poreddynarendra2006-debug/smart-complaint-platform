'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  getCurrentUser,
} from 'aws-amplify/auth';

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const checkAuth =
      async () => {
        try {
          await getCurrentUser();

          setLoading(false);
        } catch {
          router.push('/');
        }
      };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div
        style={{
          padding: '40px',
        }}
      >
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}