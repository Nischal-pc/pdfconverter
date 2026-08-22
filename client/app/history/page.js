'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FolderOpen, File, Eye, Download } from 'lucide-react';
import { getToolById } from '@/lib/tools';
import api from '@/lib/api';
import { getApiBase } from '@/lib/apiBase';
import { triggerFileDownload } from '@/lib/download';

function loadLocalHistory() {
  try {
    const saved = localStorage.getItem('pdf_history');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Files are deleted after 1 hour by the server cron job
const isDownloadExpired = (createdAt) => {
  try {
    const age = Date.now() - new Date(createdAt).getTime();
    return age > 60 * 60 * 1000; // 1 hour in ms
  } catch {
    return false;
  }
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const local = loadLocalHistory();

    if (user) {
      try {
        const res = await api.get('/api/history');
        const server = res.data.history || [];
        const merged = [...server];
        const serverKeys = new Set(server.map((s) => `${s.toolId}-${s.createdAt}`));
        local.forEach((item) => {
          if (!serverKeys.has(`${item.toolId}-${item.createdAt}`)) {
            merged.push(item);
          }
        });
        merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistory(merged.slice(0, 50));
      } catch {
        setHistory(local);
      }
    } else {
      setHistory(local);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    Promise.resolve().then(() => refresh());
  }, [refresh]);

  const handleDelete = async (id) => {
    const isServerId = /^[a-f0-9]{24}$/i.test(String(id));
    if (user && isServerId) {
      try {
        await api.delete(`/api/history/${id}`);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to delete.');
        return;
      }
    }
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(
      'pdf_history',
      JSON.stringify(updated.filter((i) => !/^[a-f0-9]{24}$/i.test(String(i.id))))
    );
    setHistory(updated);
    toast.success('History item removed.');
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      return;
    }
    if (user) {
      try {
        await api.delete('/api/history');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Could not clear cloud history.');
      }
    }
    localStorage.removeItem('pdf_history');
    setHistory([]);
    await refresh();
    toast.success('All history cleared.');
  };

  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="page-shell" style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div className="page-container" style={{ maxWidth: 850 }}>
        <div className="history-header">
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
              My Conversion History
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {user ? `Signed in as ${user.name}. Your cloud and local history are shown. ` : 'Sign in to sync your history across devices. '}
              Processed files are available for 1 hour, then automatically deleted for privacy.
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading history…</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {history.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '80px 24px',
                  background: 'var(--bg-secondary)',
                  border: '1px dashed var(--border)',
                  borderRadius: 20,
                }}
              >
                <div style={{ marginBottom: 16 }}><FolderOpen size={48} color="var(--text-muted)" /></div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No conversions yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  Use any PDF tool — merge, compress, convert, sign — and your processed files will appear here with a download link.
                </p>
                <Link href="/tools" className="btn-primary navbar-btn-link">
                  <span>Browse All PDF Tools</span>
                </Link>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {history.map((item, index) => {
                  const tool = getToolById(item.toolId);
                  const expired = item.downloadUrl && isDownloadExpired(item.createdAt);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.25, delay: index * 0.03 }}
                      className="history-item"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                      }}
                    >
                      <div className="history-item-body">
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20, color: 'var(--accent)'
                        }}>
                          {tool?.icon || <File size={20} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {tool?.label || item.toolLabel}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {formatTime(item.createdAt)}
                            </span>
                            {expired && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                                color: '#f59e0b',
                              }}>
                                Expired
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Input:</span> {item.inputFiles}
                          </div>
                        </div>
                      </div>
                      <div className="history-item-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {item.downloadUrl && !expired && (
                          <>
                            <button
                              type="button"
                              onClick={() => triggerFileDownload(item.downloadUrl, item.outputFile)}
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: 12.5 }}
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </button>
                          </>
                        )}
                        {expired && tool && (
                          <Link href={`/tools/${item.toolId}`} style={{ textDecoration: 'none' }}>
                            <span className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }}>
                              Re-process →
                            </span>
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 12.5, color: '#ef4444' }}
                          title="Remove item"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
