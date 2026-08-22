'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FolderOpen, FileText, Download, Trash2, ArrowRight } from 'lucide-react';
import { getToolById } from '@/lib/tools';
import api from '@/lib/api';
import { triggerFileDownload } from '@/lib/download';

function loadLocalHistory() {
  try {
    const saved = localStorage.getItem('pdf_history');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

const isDownloadExpired = (createdAt) => {
  try {
    const age = Date.now() - new Date(createdAt).getTime();
    return age > 60 * 60 * 1000; // 1 hour
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
      <div className="page-container page-container--narrow" style={{ padding: '40px var(--page-gutter) 48px' }}>
        <div className="history-header">
          <div>
            <span className="section-tagline">Activity &amp; Logs</span>
            <h1 className="nexacore-section-title" style={{ fontSize: 'clamp(24px, 4vw, 36px)', marginBottom: 6 }}>
              Document History
            </h1>
            <p className="nexacore-section-desc" style={{ fontSize: 13.5, maxWidth: 540 }}>
              {user ? `Signed in as ${user.name}. Cloud and browser history synchronized. ` : 'History stored in local browser memory. '}
              Processed files remain downloadable for 1 hour.
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="btn-danger"
              style={{ padding: '7px 14px', fontSize: 12.5 }}
            >
              Clear All History
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
            Loading history…
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {history.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '64px 24px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--text-muted)'
                }}>
                  <FolderOpen size={24} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  No Conversion History Yet
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 24, maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.6 }}>
                  When you convert, compress, sign, or edit files, your download links and file details will appear here.
                </p>
                <Link href="/tools" className="btn-primary">
                  <span>Browse All PDF Tools</span>
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map((item, index) => {
                  const tool = getToolById(item.toolId);
                  const expired = item.downloadUrl && isDownloadExpired(item.createdAt);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14,
                        flexWrap: 'wrap',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-sm)',
                          flexShrink: 0,
                          background: 'var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)'
                        }}>
                          {tool?.icon || <FileText size={18} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {tool?.label || item.toolLabel}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                              {formatTime(item.createdAt)}
                            </span>
                            {expired && (
                              <span style={{
                                fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                                color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em'
                              }}>
                                Expired
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Input:</span> {item.inputFiles}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {item.downloadUrl && !expired && (
                          <button
                            type="button"
                            onClick={() => triggerFileDownload(item.downloadUrl, item.outputFile)}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: 12.5 }}
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>
                        )}
                        {expired && tool && (
                          <Link href={`/tools/${item.toolId}`} style={{ textDecoration: 'none' }}>
                            <span className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }}>
                              Re-run Tool →
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
                          <Trash2 size={13} />
                          <span>Delete</span>
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
