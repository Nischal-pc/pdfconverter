'use client';
import { useEffect, useState } from 'react';
import { fetchServerHealth } from '@/lib/api';

export default function AuthDbBanner() {
  const [dbConnected, setDbConnected] = useState(null);

  useEffect(() => {
    fetchServerHealth()
      .then((data) => setDbConnected(data.dbConnected))
      .catch(() => setDbConnected(false));
  }, []);

  if (dbConnected === null || dbConnected) return null;

  return (
    <div
      style={{
        marginBottom: 20,
        padding: '12px 16px',
        borderRadius: 12,
        background: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}
    >
      Accounts are unavailable: the server has no database connection. All PDF tools still work without signing in.
    </div>
  );
}
