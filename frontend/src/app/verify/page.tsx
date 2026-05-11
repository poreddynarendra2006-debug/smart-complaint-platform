'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmSignUp } from 'aws-amplify/auth';

export default function VerifyPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Auto-fill email from URL param
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      setMessage('Account verified! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (error: any) {
      setMessage(error.message || 'Verification failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-lg bg-gray-900 p-8 shadow-lg">
        <h1 className="mb-2 text-center text-3xl font-bold text-white">
          Verify Account
        </h1>
        <p className="mb-6 text-center text-sm text-gray-400">
          Enter the code sent to your email
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="email" placeholder="Email"
            className="w-full rounded bg-gray-800 p-3 text-white outline-none"
            value={email} onChange={(e) => setEmail(e.target.value)} required
          />
          <input
            type="text" placeholder="Verification Code"
            className="w-full rounded bg-gray-800 p-3 text-white outline-none tracking-widest text-center text-xl"
            value={code} onChange={(e) => setCode(e.target.value)} required
          />
          <button
            type="submit" disabled={loading}
            className="w-full rounded bg-green-600 p-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-green-400">{message}</p>
        )}
      </div>
    </div>
  );
}