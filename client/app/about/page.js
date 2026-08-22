'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { APP_NAME } from '@/lib/brand';
import { TOOL_CATEGORIES } from '@/lib/tools';
import { ShieldCheck, Zap, Code2, Lock, Cpu, HardDrive } from 'lucide-react';

export default function AboutPage() {
  const toolCount = TOOL_CATEGORIES.reduce((n, c) => n + c.tools.length, 0);

  const pillars = [
    {
      icon: <ShieldCheck size={22} />,
      title: 'Zero File Retention',
      desc: 'Documents you upload are processed entirely in serverless RAM and discarded immediately once your download stream finishes. PdfFlow never writes your files to disk.',
      badge: 'Privacy Guarantee'
    },
    {
      icon: <Cpu size={22} />,
      title: 'Optimized Binary Pipelines',
      desc: 'Powered by industry-standard document parsing engines (pdf-lib, MuPDF, docx, and Tesseract OCR) to handle multi-hundred-page documents and heavy compression routines quickly.',
      badge: 'Architecture'
    },
    {
      icon: <Code2 size={22} />,
      title: 'No Paywalls or Hidden Watermarks',
      desc: 'Every tool is completely unrestricted and free to use. No credit card, no account required, and no watermarks stamped onto your exported documents.',
      badge: 'Open Access'
    }
  ];

  return (
    <div className="page-shell" style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div className="page-container page-container--narrow" style={{ padding: '40px 20px 80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <span className="section-tagline">About {APP_NAME}</span>
          <h1 className="nexacore-section-title" style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', marginBottom: 14 }}>
            Fast, Private PDF & Document Utilities
          </h1>
          <p className="nexacore-section-desc" style={{ margin: '0 auto', maxWidth: 640 }}>
            {APP_NAME} provides {toolCount}+ browser-accessible document tools — merge, split, compress, convert, sign, and OCR — with zero mandatory logins and no file retention.
          </p>
        </motion.div>

        {/* 3 Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 48 }}>
          {pillars.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)'
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4 }}>
                  {item.badge}
                </span>
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                {item.title}
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="nexacore-cta-banner"
          style={{ margin: 0, padding: '36px 24px' }}
        >
          <span className="section-tagline">Open Standards</span>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Start Processing Documents
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Direct in-memory stream execution. Choose a tool below to begin.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tools" className="btn-primary">
              <span>View All {toolCount}+ Tools →</span>
            </Link>
            <Link href="/tools/word-to-pdf" className="btn-secondary">
              Word to PDF
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
