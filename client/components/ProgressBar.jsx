'use client';
import { motion } from 'framer-motion';

export default function ProgressBar({ progress, label }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label || 'Processing...'}
        </span>
        <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
          {Math.round(progress)}%
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          className="progress-bar"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 3 }}
        />
      </div>
    </div>
  );
}
