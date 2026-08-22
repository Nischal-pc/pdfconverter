'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { APP_NAME } from '@/lib/brand';
import { TOOL_CATEGORIES } from '@/lib/tools';
import { ShieldCheck, Zap, Code2, ArrowRight, Lock, Server } from 'lucide-react';

export default function AboutPage() {
  const toolCount = TOOL_CATEGORIES.reduce((n, c) => n + c.tools.length, 0);

  const pillars = [
    {
      icon: <ShieldCheck size={28} color="#38bdf8" />,
      title: 'Your Files Stay Private',
      desc: 'Every document you upload is processed in memory and deleted immediately after your download is ready. PdfFlow never stores, reads, or shares your files — period.',
      badge: 'Privacy First'
    },
    {
      icon: <Zap size={28} color="#c084fc" />,
      title: 'Fast on Any File Size',
      desc: 'Built on optimized PDF pipelines (pdf-lib, MuPDF) that can handle multi-hundred-page documents, batch conversions, and heavy compressions without breaking a sweat.',
      badge: 'High Performance'
    },
    {
      icon: <Code2 size={28} color="#fb923c" />,
      title: 'Free. No Watermarks. No Tricks.',
      desc: 'Every tool on PdfFlow is completely free to use. No credit card, no account required, no watermarks on your exported files. Built with Next.js and open web standards.',
      badge: 'Always Free'
    }
  ];

  return (
    <div className="page-shell" style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div className="orb orb--hero-left" style={{ opacity: 0.5 }} />
      <div className="orb orb--hero-right" style={{ opacity: 0.35, animationDelay: '-3s' }} />

      <div className="page-container page-container--narrow" style={{ padding: '60px 24px 100px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <span className="section-tagline">About PdfFlow</span>
          <h1 className="nexacore-section-title" style={{ fontSize: 'clamp(32px, 5.5vw, 54px)', marginBottom: 18 }}>
            The PDF Toolkit Built for Everyone
          </h1>
          <p className="nexacore-section-desc" style={{ margin: '0 auto', fontSize: 17 }}>
            {APP_NAME} gives you {toolCount}+ free PDF tools — merge, split, compress, convert, edit, watermark, sign, and more — right in your browser with no installs and no hidden costs.
          </p>
        </motion.div>

        {/* 3 Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 56 }}>
          {pillars.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-md)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 9999 }}>
                  {item.badge}
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.02em' }}>
                {item.title}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="nexacore-cta-banner"
          style={{ margin: 0 }}
        >
          <span className="section-tagline" style={{ color: '#c084fc' }}>Open & Private</span>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
            Ready to process your documents?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Browse all 30+ conversion, editing, and optimization utilities. Fast stream execution with zero permanent disk storage.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tools" className="btn-primary" style={{ padding: '14px 32px' }}>
              <span>Explore All Tools →</span>
            </Link>
            <Link href="/tools/word-to-pdf" className="btn-secondary" style={{ padding: '14px 24px' }}>
              Word to PDF
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


