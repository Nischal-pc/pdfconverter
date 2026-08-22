'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { APP_NAME } from '@/lib/brand';

const sections = [
  {
    title: 'Files you upload',
    body: `When you use any PDF tool on ${APP_NAME ? APP_NAME : 'PdfFlow'}, your file is sent securely to our processing server. Files are held in temporary storage only for the duration of processing and your 1-hour download window, then permanently deleted by an automated cleanup job. We do not read, index, or analyze your document contents.`,
  },
  {
    title: 'Your download history',
    body: 'If you are not signed in, your conversion history (tool used, file names, download links) is stored only in your browser localStorage — it never leaves your device. We have no access to this data.',
  },
  {
    title: 'Accounts (optional)',
    body: 'Creating an account is entirely optional. If you register, your email address and display name are stored securely. Passwords are always hashed before storage and never stored in plain text. You can use every PDF tool on PdfFlow without an account.',
  },
  {
    title: 'No tracking or advertising',
    body: 'We do not use advertising trackers, sell your data, or share any information with third parties. All PDF processing happens on our own servers using open-source libraries.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="page-shell" style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div className="content-page">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: August 2026 — We believe privacy is a right, not a feature. Here's exactly what PdfFlow does (and doesn't do) with your data.</p>
          {sections.map((s) => (
            <section key={s.title} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{s.title}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>{s.body}</p>
            </section>
          ))}
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 24 }}>
            Have questions or concerns? PdfFlow is self-hostable — you can deploy your own instance and have full control over all data and infrastructure.
          </p>
          <div style={{ marginTop: 32 }}>
            <Link href="/" className="btn-secondary">← Back to home</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
