'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { getUserRole } from '@/lib/auth';

const API_BASE =
  'https://tm5z2nlask.execute-api.ap-south-1.amazonaws.com/prod';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#2563eb',
  IN_PROGRESS: '#d97706',
  RESOLVED: '#16a34a',
};

const ACTION_ICONS: Record<string, string> = {
  COMPLAINT_CREATED: '🆕',
  STATUS_UPDATED: '🔄',
  COMPLAINT_DELETED: '🗑️',
  COMMENT_ADDED: '💬',
};

export default function ComplaintDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [complaint, setComplaint] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [role, setRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingComplaint, setDeletingComplaint] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  useEffect(() => {
    const load = async () => {
      try {
        const userRole = await getUserRole();
        if (userRole) setRole(userRole);

        const user = await getCurrentUser();
        if (user?.signInDetails?.loginId) {
          setUserEmail(user.signInDetails.loginId);
        }

        const res = await fetch(`${API_BASE}/complaints`);
        const data = await res.json();
        const found = data.find(
          (item: any) => item.complaintId === params.id
        );
        if (found) {
          setComplaint(found);
          setNewStatus(found.status);
        }

        const logsRes = await fetch(
          `${API_BASE}/activityLogs?complaintId=${params.id}`
        );
        const logsData = await logsRes.json();
        setActivityLogs(Array.isArray(logsData) ? logsData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === complaint?.status) return;
    setUpdatingStatus(true);
    try {
      await fetch(`${API_BASE}/complaints`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: complaint.complaintId,
          status: newStatus,
          userEmail,
        }),
      });

      setComplaint({ ...complaint, status: newStatus });

      const logsRes = await fetch(
        `${API_BASE}/activityLogs?complaintId=${params.id}`
      );
      const logsData = await logsRes.json();
      setActivityLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await fetch(`${API_BASE}/complaints`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: complaint.complaintId,
          text: comment,
        }),
      });

      setComplaint({
        ...complaint,
        comments: [
          ...(complaint.comments || []),
          { text: comment, createdAt: new Date().toISOString() },
        ],
      });
      setComment('');
    } catch (err) {
      console.error(err);
      alert('Failed to add comment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    setDeletingComplaint(true);
    try {
      await fetch(`${API_BASE}/complaints`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: complaint.complaintId,
          userEmail,
        }),
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to delete complaint');
      setDeletingComplaint(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.spinner} />
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading complaint...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div style={styles.loadingWrapper}>
        <p style={{ color: '#ef4444', fontSize: '18px' }}>Complaint not found.</p>
        <button onClick={() => router.push('/dashboard')} style={styles.backBtn}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => router.push('/dashboard')} style={styles.backBtn}>
          ← Back
        </button>
        <span style={styles.roleBadge}>{role}</span>
      </div>

      <div style={styles.card}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>{complaint.title}</h1>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: STATUS_COLORS[complaint.status] || '#6b7280',
          }}>
            {complaint.status}
          </span>
        </div>

        <p style={styles.meta}>
          Submitted by <strong>{complaint.userEmail}</strong> ·{' '}
          {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>

        <div style={styles.tagRow}>
          {complaint.category && (
            <span style={styles.tag}>📂 {complaint.category}</span>
          )}
          {complaint.priority && (
            <span style={{
              ...styles.tag,
              color: complaint.priority === 'HIGH' ? '#dc2626'
                : complaint.priority === 'MEDIUM' ? '#d97706' : '#16a34a',
              borderColor: complaint.priority === 'HIGH' ? '#dc2626'
                : complaint.priority === 'MEDIUM' ? '#d97706' : '#16a34a',
            }}>
              🔥 {complaint.priority} Priority
            </span>
          )}
        </div>

        <p style={styles.description}>{complaint.description}</p>

        {/* Only show image if imageUrl exists and is not empty */}
        {complaint.imageUrl && complaint.imageUrl.trim() !== '' && (
          <div style={{ marginTop: '20px' }}>
            <p style={styles.sectionLabel}>Attached Image</p>
            <img
              src={complaint.imageUrl}
              alt="Complaint attachment"
              style={styles.image}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'details' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('details')}
        >
          💬 Comments
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'activity' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('activity')}
        >
          📋 Activity Timeline
        </button>
      </div>

      {activeTab === 'details' && (
        <div style={styles.card}>
          {role === 'ADMIN' && (
            <>
              <div style={styles.statusUpdateBox}>
                <p style={styles.sectionLabel}>Update Status</p>
                <div style={styles.statusRow}>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={styles.select}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus || newStatus === complaint.status}
                    style={{
                      ...styles.updateBtn,
                      opacity: updatingStatus || newStatus === complaint.status ? 0.5 : 1,
                    }}
                  >
                    {updatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <p style={styles.sectionLabel}>Add Admin Comment</p>
                <textarea
                  placeholder="Write a comment or resolution note..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={styles.textarea}
                />
                <button onClick={handleAddComment} style={styles.commentBtn}>
                  Post Comment
                </button>
              </div>

              <div style={{ marginTop: '24px', borderTop: '1px solid #fee2e2', paddingTop: '16px' }}>
                <button
                  onClick={handleDelete}
                  disabled={deletingComplaint}
                  style={styles.deleteBtn}
                >
                  {deletingComplaint ? 'Deleting...' : '🗑️ Delete Complaint'}
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: role === 'ADMIN' ? '32px' : '0' }}>
            <p style={styles.sectionLabel}>
              Comments ({complaint.comments?.length || 0})
            </p>
            {complaint.comments && complaint.comments.length > 0 ? (
              complaint.comments.map((item: any, i: number) => (
                <div key={i} style={styles.commentItem}>
                  <p style={{ color: '#111827', margin: 0 }}>{item.text}</p>
                  <p style={styles.commentMeta}>
                    {new Date(item.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                No comments yet
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div style={styles.card}>
          <p style={styles.sectionLabel}>
            Activity History ({activityLogs.length} events)
          </p>
          {activityLogs.length === 0 ? (
            <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>
              No activity logs found.
            </p>
          ) : (
            <div style={styles.timeline}>
              {activityLogs.map((log: any, i: number) => (
                <div key={log.logId || i} style={styles.timelineItem}>
                  {i < activityLogs.length - 1 && (
                    <div style={styles.timelineLine} />
                  )}
                  <div style={styles.timelineDot}>
                    {ACTION_ICONS[log.action] || '📌'}
                  </div>
                  <div style={styles.timelineContent}>
                    <p style={styles.timelineAction}>
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <p style={styles.timelineDetails}>{log.details}</p>
                    <p style={styles.timelineMeta}>
                      by {log.userEmail} ·{' '}
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '12px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    color: '#374151',
    fontSize: '14px',
  },
  roleBadge: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: '16px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    flex: 1,
  },
  statusBadge: {
    color: 'white',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  meta: {
    color: '#6b7280',
    fontSize: '14px',
    marginTop: '8px',
    marginBottom: '16px',
  },
  tagRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  tag: {
    border: '1px solid #d1d5db',
    color: '#374151',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
  },
  description: {
    color: '#374151',
    lineHeight: 1.6,
    fontSize: '15px',
  },
  image: {
    maxWidth: '480px',
    width: '100%',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  tab: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
  },
  activeTab: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: '1px solid #2563eb',
  },
  sectionLabel: {
    fontWeight: 600,
    color: '#111827',
    marginBottom: '12px',
    fontSize: '15px',
  },
  statusUpdateBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
  },
  statusRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: 'white',
  },
  updateBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  textarea: {
    width: '100%',
    height: '110px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
    color: '#111827',
  },
  commentBtn: {
    marginTop: '10px',
    backgroundColor: '#111827',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  deleteBtn: {
    backgroundColor: 'white',
    color: '#dc2626',
    border: '1px solid #dc2626',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  commentItem: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '12px',
  },
  commentMeta: {
    color: '#9ca3af',
    fontSize: '12px',
    marginTop: '6px',
    margin: '6px 0 0',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '16px',
  },
  timelineItem: {
    display: 'flex',
    gap: '16px',
    position: 'relative',
    paddingBottom: '24px',
  },
  timelineLine: {
    position: 'absolute',
    left: '20px',
    top: '36px',
    bottom: '0',
    width: '2px',
    backgroundColor: '#e5e7eb',
  },
  timelineDot: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
    border: '2px solid #dbeafe',
  },
  timelineContent: {
    paddingTop: '6px',
    flex: 1,
  },
  timelineAction: {
    fontWeight: 600,
    color: '#111827',
    fontSize: '14px',
    margin: '0 0 4px 0',
  },
  timelineDetails: {
    color: '#374151',
    fontSize: '14px',
    margin: '0 0 4px 0',
  },
  timelineMeta: {
    color: '#9ca3af',
    fontSize: '12px',
    margin: 0,
  },
};