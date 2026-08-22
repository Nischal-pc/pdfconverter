'use client';
import { useEffect, useState } from 'react';
import { fetchServerHealth } from '@/lib/api';

export default function ServerStatus() {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      fetchServerHealth()
        .then(() => { if (!cancelled) setOk(true); })
        .catch(() => { if (!cancelled) setOk(false); });
    };
    check();
    const id = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (ok !== false) return null;

  return (
    <div
      role="alert"
      className="server-status-banner"
      style={{
        background: 'rgba(239, 68, 68, 0.12)',
        borderBottom: '1px solid rgba(239, 68, 68, 0.35)',
        zIndex: 150,
      }}
    >
      <strong>Backend offline.</strong> PDF tools need the API server. Run{' '}
      <code>node index.js</code> in <code>server</code> or use <code>start.bat</code>.
    </div>
  );
}
