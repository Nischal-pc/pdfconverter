'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { TOOL_CATEGORIES, ALL_TOOLS } from '@/lib/tools';
import ToolCard from '@/components/ToolCard';
import HeroPerspectiveFan from '@/components/HeroPerspectiveFan';
import {
  FileText,
  Table,
  PenTool,
  Minimize,
  Image as ImageIcon,
  Wand2,
  Shield,
  Zap,
  CheckCircle2,
  HardDrive,
  Cpu,
  Lock,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('popular');

  const popularToolIds = [
    'word-to-pdf',
    'merge',
    'compress',
    'sign-pdf',
    'pdf-to-excel',
    'split',
    'jpg-to-pdf',
    'image-to-text',
  ];

  const popularTools = popularToolIds
    .map((id) => ALL_TOOLS.find((t) => t.id === id))
    .filter(Boolean);

  const filteredTools = activeCategory === 'popular'
    ? popularTools
    : activeCategory === 'all'
    ? ALL_TOOLS
    : ALL_TOOLS.filter((t) => t.categoryId === activeCategory);

  // Quick Action Launchers in Hero (Symmetrical 6 items for 3x2 grid)
  const heroQuickChips = [
    { label: 'Word to PDF', icon: <FileText size={14} />, href: '/tools/word-to-pdf' },
    { label: 'PDF to Excel', icon: <Table size={14} />, href: '/tools/pdf-to-excel' },
    { label: 'Sign & Fill PDF', icon: <PenTool size={14} />, href: '/tools/sign-pdf' },
    { label: 'Compress PDF', icon: <Minimize size={14} />, href: '/tools/compress' },
    { label: 'JPG to PDF', icon: <ImageIcon size={14} />, href: '/tools/jpg-to-pdf' },
    { label: 'Image OCR Text', icon: <Wand2 size={14} />, href: '/tools/image-to-text' },
  ];

  // Technical Supported Formats Matrix
  const formatMatrix = [
    { format: 'PDF (.pdf)', type: 'Document Standard', operations: 'Merge, Split, Compress, Sign, Watermark, Protect, Reorder', engine: 'pdf-lib & MuPDF' },
    { format: 'Word (.docx, .doc)', type: 'Office Document', operations: 'Convert to PDF, Extract Plain Text, Convert to HTML', engine: 'docx & mammoth' },
    { format: 'Excel (.xlsx, .xls)', type: 'Spreadsheet Grid', operations: 'Convert PDF tables to Excel, Convert Excel sheets to PDF', engine: 'xlsx' },
    { format: 'Images (JPG, PNG, WebP)', type: 'Raster Graphics', operations: 'JPG to PDF, PNG to PDF, Multi-Image Assembly, WebP Conversion', engine: 'sharp' },
    { format: 'Scanned Documents', type: 'OCR Image/PDF', operations: 'Extract text from scanned files into .txt across 8 languages', engine: 'tesseract.js' },
    { format: 'Plain Text (.txt)', type: 'Raw Text File', operations: 'Compile text to formatted PDF or editable Word (.docx)', engine: 'docx & pdf-lib' },
  ];

  return (
    <div className="page-shell">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION — Clear Focal Point & Balanced Launchers                  */}
      {/* ========================================================================= */}
      <section className="hero-section">
        <HeroPerspectiveFan />

        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="hero-badge"
          >
            <span className="hero-badge--gradient">
              <span className="hero-live-dot" />
              30+ Utilitarian File Tools • Ephemeral Memory Processing • Zero Tracking
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="hero-title"
          >
            Convert, edit, compress, and sign
            <br />
            PDFs directly in your browser.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="hero-subtitle"
          >
            Fast, private document tools with zero file retention. Process files in ephemeral memory and directly on your device — no accounts, no file limits, no paywalls.
          </motion.p>

          {/* Primary Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{ marginBottom: 20 }}
          >
            <Link href="/tools/word-to-pdf" className="btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>
              <span>Convert Word to PDF Free →</span>
            </Link>
          </motion.div>

          {/* Quick Action Symmetrical 3x2 Grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="hero-quick-chips-wrap"
            aria-label="Popular Quick Actions"
          >
            {heroQuickChips.map((chip, i) => (
              <Link key={i} href={chip.href} className="hero-quick-chip">
                {chip.icon}
                <span>{chip.label}</span>
              </Link>
            ))}
          </motion.div>

          {/* Technical Guarantees */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="hero-trust-bar"
          >
            <div className="hero-trust-item">
              <Zap size={14} color="#10b981" />
              <span>In-Memory RAM Execution</span>
            </div>
            <div className="hero-trust-item">
              <Shield size={14} color="#10b981" />
              <span>Zero Permanent Storage</span>
            </div>
            <div className="hero-trust-item">
              <CheckCircle2 size={14} color="#10b981" />
              <span>ISO 32000-1 PDF Compliant</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="page-container">

        {/* ========================================================================= */}
        {/* 2. COMPLETE UTILITY DIRECTORY & CATEGORY MATRIX                           */}
        {/* ========================================================================= */}
        <section className="bento-explorer-section" id="tools">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span className="section-tagline">Utility Directory</span>
            <h2 className="nexacore-section-title">Document &amp; PDF Tools</h2>
            <p className="nexacore-section-desc" style={{ margin: '0 auto', maxWidth: 580 }}>
              Select a module below to start processing files immediately.
            </p>
          </div>

          {/* Horizontal Scrollable Filter Bar */}
          <div className="bento-filter-wrap">
            <div className="bento-filter-bar" role="tablist" aria-label="Tool Categories">
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'popular'}
                className={`bento-filter-btn ${activeCategory === 'popular' ? 'active' : ''}`}
                onClick={() => setActiveCategory('popular')}
              >
                Popular Tools ({popularTools.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'all'}
                className={`bento-filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All Tools ({ALL_TOOLS.length})
              </button>
              {TOOL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                  className={`bento-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label} ({cat.tools.length})
                </button>
              ))}
            </div>
          </div>

          {/* Grouped Category Sections when 'all' is selected vs Focused Grid for Specific Category */}
          {activeCategory === 'all' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {TOOL_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{cat.label}</h3>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      ({cat.tools.length} tools)
                    </span>
                  </div>
                  <div className="tool-grid">
                    {cat.tools.map((tool, idx) => (
                      <ToolCard key={tool.id} tool={tool} index={idx} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div layout className="tool-grid">
              <AnimatePresence>
                {filteredTools.map((tool, idx) => (
                  <ToolCard key={tool.id} tool={tool} index={idx} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 3. TECHNICAL SPECIFICATIONS & FORMAT MATRIX                               */}
        {/* ========================================================================= */}
        <section className="format-matrix-section">
          <div style={{ textAlign: 'center' }}>
            <span className="section-tagline">Technical Specifications</span>
            <h2 className="nexacore-section-title">Supported File Formats &amp; Processing Engines</h2>
            <p className="nexacore-section-desc" style={{ margin: '0 auto', maxWidth: 620 }}>
              PdfFlow utilizes optimized binary processing routines for lossless document conversion and restructuring.
            </p>
          </div>

          <div className="matrix-table-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Format</th>
                  <th style={{ width: '20%' }}>Classification</th>
                  <th style={{ width: '38%' }}>Supported Operations</th>
                  <th style={{ width: '20%' }}>Underlying Engine</th>
                </tr>
              </thead>
              <tbody>
                {formatMatrix.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="format-label">{row.format}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{row.type}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.operations}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {row.engine}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. PRIVACY & ARCHITECTURE BLUEPRINT                                       */}
        {/* ========================================================================= */}
        <section className="privacy-blueprint-section">
          <div style={{ textAlign: 'center' }}>
            <span className="section-tagline">Security Architecture</span>
            <h2 className="nexacore-section-title">Zero-Retention Privacy Guarantee</h2>
            <p className="nexacore-section-desc" style={{ margin: '0 auto', maxWidth: 580 }}>
              How our ephemeral in-memory processing and browser-native tools protect your confidential documents.
            </p>
          </div>

          <div className="privacy-grid">
            <div className="privacy-card">
              <div className="privacy-card-icon">
                <HardDrive size={20} />
              </div>
              <h3 className="privacy-card-title">In-Memory Execution</h3>
              <p className="privacy-card-desc">
                When you upload a file, it is processed strictly in temporary serverless RAM buffers. No files are ever written to permanent hard drives.
              </p>
            </div>

            <div className="privacy-card">
              <div className="privacy-card-icon">
                <Cpu size={20} />
              </div>
              <h3 className="privacy-card-title">Client-Side Canvas Signing</h3>
              <p className="privacy-card-desc">
                Visual signing and annotations render directly inside your browser canvas. Your signatures never pass through external ad tracking networks.
              </p>
            </div>

            <div className="privacy-card">
              <div className="privacy-card-icon">
                <Lock size={20} />
              </div>
              <h3 className="privacy-card-title">Immediate Stream Purge</h3>
              <p className="privacy-card-desc">
                The moment your processed download stream completes, the buffer is instantly wiped from memory. Zero document retention.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. DIRECT ACTION CTA BANNER                                               */}
        {/* ========================================================================= */}
        <section className="nexacore-cta-banner">
          <span className="section-tagline">No Sign-up Required</span>
          <h2 className="nexacore-cta-heading">Ready to Process Your Document?</h2>
          <p className="nexacore-cta-desc">
            Select a tool to get started immediately. Free to use with no file watermarks.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tools/word-to-pdf" className="btn-primary">
              <span>Convert Word to PDF →</span>
            </Link>
            <Link href="/tools/sign-pdf" className="btn-secondary">
              Sign & Fill PDF
            </Link>
            <Link href="/tools/merge" className="btn-secondary">
              Merge PDFs
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
