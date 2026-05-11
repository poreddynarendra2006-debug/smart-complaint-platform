'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { getUserRole } from '@/lib/auth';
import AuthGuard from '@/components/AuthGuard';

const API_BASE =
  'https://tm5z2nlask.execute-api.ap-south-1.amazonaws.com/prod';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#2563eb',
  IN_PROGRESS: '#d97706',
  RESOLVED: '#16a34a',
};

export default function DashboardPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [role, setRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const userRole = await getUserRole();
      if (userRole) setRole(userRole);

      const user = await getCurrentUser();
      const email = user?.signInDetails?.loginId || '';
      setUserEmail(email);

      let apiUrl = `${API_BASE}/complaints`;
      if (userRole !== 'ADMIN' && email) {
        apiUrl += `?userEmail=${encodeURIComponent(email)}`;
      }

      const res = await fetch(apiUrl);
      const data = await res.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const filtered =
    filter === 'ALL'
      ? complaints
      : complaints.filter((c) => c.status === filter);

  const counts = {
    ALL: complaints.length,
    OPEN: complaints.filter((c) => c.status === 'OPEN').length,
    IN_PROGRESS: complaints.filter((c) => c.status === 'IN_PROGRESS').length,
    RESOLVED: complaints.filter((c) => c.status === 'RESOLVED').length,
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.complaintId)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} complaint(s)? This cannot be undone.`)) return;

    setBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((complaintId) =>
          fetch(`${API_BASE}/complaints`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ complaintId, userEmail }),
          })
        )
      );

      setComplaints((prev) =>
        prev.filter((c) => !selectedIds.has(c.complaintId))
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      alert('Some deletions failed. Please try again.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const allFilteredSelected =
    filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <AuthGuard>
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Complaints Dashboard</h1>
            <p style={styles.subtitle}>
              Logged in as <strong>{userEmail}</strong> ·{' '}
              <span style={styles.rolePill}>{role}</span>
            </p>
          </div>
          <div style={styles.headerBtns}>
            <Link href="/complaints/new" style={styles.newBtn}>
              + New Complaint
            </Link>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setSelectedIds(new Set()); }}
              style={{
                ...styles.statCard,
                borderColor: filter === s ? '#2563eb' : '#e5e7eb',
                borderWidth: filter === s ? '2px' : '1px',
              }}
            >
              <span style={styles.statCount}>{counts[s]}</span>
              <span style={styles.statLabel}>{s.replace('_', ' ')}</span>
            </button>
          ))}
        </div>

        {/* Bulk actions bar — only for ADMIN */}
        {role === 'ADMIN' && filtered.length > 0 && (
          <div style={styles.bulkBar}>
            <label style={styles.selectAllLabel}>
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={selectAll}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>
                {allFilteredSelected
                  ? 'Deselect All'
                  : `Select All (${filtered.length})`}
              </span>
            </label>

            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                style={{
                  ...styles.bulkDeleteBtn,
                  opacity: bulkDeleting ? 0.6 : 1,
                }}
              >
                {bulkDeleting
                  ? 'Deleting...'
                  : `🗑️ Delete Selected (${selectedIds.size})`}
              </button>
            )}
          </div>
        )}

        {/* Complaint Cards */}
        {loading ? (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p style={{ color: '#6b7280', marginTop: '12px' }}>
              Loading complaints...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={{ fontSize: '40px' }}>📭</p>
            <p style={{ color: '#6b7280' }}>No complaints found.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.complaintId} style={styles.cardWrapper}>
              {/* Checkbox for ADMIN */}
              {role === 'ADMIN' && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.complaintId)}
                  onChange={() => toggleSelect(item.complaintId)}
                  style={styles.checkbox}
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              <Link
                href={`/complaints/${item.complaintId}`}
                style={{ textDecoration: 'none', flex: 1 }}
              >
                <div style={{
                  ...styles.card,
                  borderLeft: selectedIds.has(item.complaintId)
                    ? '4px solid #2563eb'
                    : '4px solid transparent',
                }}>
                  <div style={styles.cardHeader}>
                    <h2 style={styles.cardTitle}>{item.title}</h2>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: STATUS_COLORS[item.status] || '#6b7280',
                    }}>
                      {item.status}
                    </span>
                  </div>

                  <p style={styles.cardDesc}>{item.description}</p>

                  <div style={styles.cardMeta}>
                    {item.category && (
                      <span style={styles.metaTag}>📂 {item.category}</span>
                    )}
                    {item.priority && (
                      <span style={{
                        ...styles.metaTag,
                        color:
                          item.priority === 'HIGH' ? '#dc2626'
                          : item.priority === 'MEDIUM' ? '#d97706'
                          : '#16a34a',
                      }}>
                        🔥 {item.priority}
                      </span>
                    )}
                    <span style={{ ...styles.metaTag, marginLeft: 'auto' }}>
                      {item.userEmail}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
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
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 6px 0',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px',
    margin: 0,
  },
  rolePill: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  headerBtns: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  newBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
  },
  logoutBtn: {
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  statCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '4px',
  },
  statCount: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500,
  },
  bulkBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  selectAllLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    fontWeight: 500,
  },
  bulkDeleteBtn: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: 'white',
    borderRadius: '12px',
  },
  cardWrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    marginTop: '22px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    cursor: 'pointer',
    transition: 'border-left 0.15s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    flex: 1,
  },
  statusBadge: {
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  cardDesc: {
    color: '#6b7280',
    fontSize: '14px',
    margin: '0 0 12px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardMeta: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaTag: {
    fontSize: '13px',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: '3px 10px',
    borderRadius: '12px',
  },
};