'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { APP_NAME } from '@/lib/brand';

const sections = [
  {
    title: 'Acceptable use',
    body: `Use ${APP_NAME ? APP_NAME : 'PdfFlow'} only to process documents you own or have explicit permission to modify. Do not upload files containing illegal content, content that violates copyright, or sensitive data belonging to others without their consent.`,
  },
  {
    title: 'File size & fair use',
    body: 'PdfFlow is a free service. To keep it available for everyone, please avoid uploading very large batches repeatedly in quick succession. Files are auto-deleted after 1 hour and are not retained between sessions.',
  },
  {
    title: 'No guarantees on output quality',
    body: 'Conversion quality depends on the source document. While we strive for accurate results across all tools, we cannot guarantee perfect fidelity for every file. Always verify important documents after processing and keep backups of originals.',
  },
  {
    title: 'Service availability',
    body: 'PdfFlow is provided as-is, without uptime guarantees. We do our best to keep all tools operational but some conversions (e.g., Word to PDF) require server-side dependencies that may occasionally be unavailable.',
  },
  {
    title: 'Liability',
    body: 'We are not liable for data loss, corrupted outputs, or downstream damages caused by using PdfFlow. Always keep original backups of important files before editing, compressing, or converting.',
  },
];

export default function TermsPage() {
  return (
    <div className="page-shell" style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div className="content-page">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Terms of Use</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: August 2026 — By using PdfFlow, you agree to these terms.</p>
          {sections.map((s) => (
            <section key={s.title} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{s.title}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>{s.body}</p>
            </section>
          ))}
          <div style={{ marginTop: 32 }}>
            <Link href="/" className="btn-secondary">← Back to home</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
