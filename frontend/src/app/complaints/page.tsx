'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import AuthGuard from '@/components/AuthGuard';

const API_BASE = 'https://tm5z2nlask.execute-api.ap-south-1.amazonaws.com/prod';

export default function CreateComplaintPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('LOW');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await getCurrentUser();
      const userEmail = user?.signInDetails?.loginId || '';

      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, priority, userEmail }),
      });

      if (!res.ok) throw new Error('Failed');

      setMessage('Complaint submitted successfully!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setMessage('Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', marginBottom: '24px', color: '#374151' }}>
            ← Back
          </button>

          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>
            Submit New Complaint
          </h1>

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151' }}>Title</label>
            <input
              type="text" required value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title of your complaint"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' }}
            />

            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151' }}>Description</label>
            <textarea
              required value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your complaint in detail..."
              style={{ width: '100%', height: '120px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '16px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />

            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151' }}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '16px', fontSize: '14px' }}>
              <option value="GENERAL">GENERAL</option>
              <option value="ELECTRICAL">ELECTRICAL</option>
              <option value="WATER">WATER</option>
              <option value="INTERNET">INTERNET</option>
              <option value="SECURITY">SECURITY</option>
            </select>

            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151' }}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '24px', fontSize: '14px' }}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>

            {message && (
              <p style={{ color: message.includes('success') ? '#16a34a' : '#dc2626', marginBottom: '16px', fontWeight: 500 }}>
                {message}
              </p>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}