'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { s3Client } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import AuthGuard from '@/components/AuthGuard';

const API_BASE =
  'https://tm5z2nlask.execute-api.ap-south-1.amazonaws.com/prod';

const S3_BUCKET = 'storagestack-complaintsbucket5c2042cb-lawhvbath5cl';
const S3_REGION = 'ap-south-1';

export default function NewComplaintPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('LOW');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const user = await getCurrentUser();
      const userEmail = user?.signInDetails?.loginId || '';

      let imageUrl = '';

      // ✅ Upload image to S3 if file selected
      if (file) {
        setUploadProgress('Uploading image...');
        const fileName = `${Date.now()}-${file.name}`;

        await s3Client.send(new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: fileName,
          Body: new Uint8Array(await file.arrayBuffer()),
          ContentType: file.type,
        }));

        imageUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${fileName}`;
        setUploadProgress('Image uploaded ✅');
      }

      // ✅ Submit complaint with imageUrl
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          userEmail,
          imageUrl,
        }),
      });

      if (!res.ok) throw new Error('Failed');

      setMessage('Complaint submitted successfully!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      console.error(err);
      setMessage('Failed to submit complaint. Please try again.');
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <AuthGuard>
      <div style={styles.page}>
        <div style={styles.container}>
          <button
            onClick={() => router.push('/dashboard')}
            style={styles.backBtn}
          >
            ← Back to Dashboard
          </button>

          <h1 style={styles.title}>Submit New Complaint</h1>
          <p style={styles.subtitle}>
            Fill in the details below. Your complaint will be reviewed by an admin.
          </p>

          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title of your complaint"
              style={styles.input}
            />

            <label style={styles.label}>Description *</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your complaint in detail..."
              style={styles.textarea}
            />

            <label style={styles.label}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.select}
            >
              <option value="GENERAL">GENERAL</option>
              <option value="ELECTRICAL">ELECTRICAL</option>
              <option value="WATER">WATER</option>
              <option value="INTERNET">INTERNET</option>
              <option value="SECURITY">SECURITY</option>
            </select>

            <label style={styles.label}>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={styles.select}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>

            {/* ✅ Image Upload */}
            <label style={styles.label}>
              Attach Image (Optional)
            </label>
            <div style={styles.uploadBox}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="fileInput"
              />
              <label htmlFor="fileInput" style={styles.uploadLabel}>
                {file ? `📎 ${file.name}` : '📷 Click to upload image'}
              </label>

              {uploadProgress && (
                <p style={{ color: '#16a34a', fontSize: '13px', margin: '8px 0 0' }}>
                  {uploadProgress}
                </p>
              )}
            </div>

            {/* ✅ Image Preview */}
            {previewUrl && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                  Preview:
                </p>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={styles.preview}
                />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreviewUrl(null); }}
                  style={styles.removeBtn}
                >
                  ✕ Remove image
                </button>
              </div>
            )}

            {message && (
              <p style={{
                color: message.includes('success') ? '#16a34a' : '#dc2626',
                marginBottom: '16px',
                fontWeight: 500,
                fontSize: '14px',
              }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '32px 24px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    marginBottom: '24px',
    color: '#374151',
    fontSize: '14px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '8px',
    marginTop: 0,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 600,
    color: '#374151',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    marginBottom: '16px',
    fontSize: '14px',
    boxSizing: 'border-box',
    color: '#111827',
  },
  textarea: {
    width: '100%',
    height: '120px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    marginBottom: '16px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
    color: '#111827',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  uploadBox: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  uploadLabel: {
    cursor: 'pointer',
    color: '#2563eb',
    fontSize: '14px',
    fontWeight: 500,
  },
  preview: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '8px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '13px',
    padding: 0,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
  },
};