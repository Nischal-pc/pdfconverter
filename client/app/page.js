'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { TOOL_CATEGORIES, ALL_TOOLS } from '@/lib/tools';
import ToolCard from '@/components/ToolCard';
import HeroPerspectiveFan from '@/components/HeroPerspectiveFan';
import {
  FolderTree,
  RefreshCw,
  Repeat,
  Lock,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  FileCheck,
  HardDrive,
  Layers,
  Cpu,
  FileText,
  Table,
  PenTool,
  Image as ImageIcon,
  Minimize,
  Wand2,
  Shield,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTools = activeCategory === 'all'
    ? ALL_TOOLS
    : ALL_TOOLS.filter((t) => t.categoryId === activeCategory);

  // Quick Action Launchers in Hero for instant high-intent conversions
  const heroQuickChips = [
    { label: 'Word to PDF', icon: <FileText size={15} color="#38bdf8" />, href: '/tools/word-to-pdf' },
    { label: 'PDF to Excel', icon: <Table size={15} color="#34d399" />, href: '/tools/pdf-to-excel' },
    { label: 'Sign PDF', icon: <PenTool size={15} color="#f472b6" />, href: '/tools/sign-pdf' },
    { label: 'Compress PDF', icon: <Minimize size={15} color="#fbbf24" />, href: '/tools/compress' },
    { label: 'JPG ↔ PNG', icon: <ImageIcon size={15} color="#818cf8" />, href: '/tools/jpg-to-png' },
    { label: 'Image to Text (OCR)', icon: <Wand2 size={15} color="#c084fc" />, href: '/tools/image-to-text' },
  ];

  // Engineering capabilities mapped to PdfFlow's core engine
  const pillars = [
    {
      badge: 'Core Engine',
      title: 'Organize & Repair',
      icon: <FolderTree size={18} color="#38bdf8" />,
      accentColor: '#38bdf8',
      bullets: [
        'Merge multi-document streams with page control',
        'Lossless & compressed DPI quantization',
        'Extract, reorder, or strip individual pages',
        'ISO-32000 XRef table structural repair'
      ],
      link: '/tools/merge',
      actionText: 'Open Organize Tools'
    },
    {
      badge: 'Ingestion',
      title: 'Document & Image to PDF',
      icon: <Layers size={18} color="#818cf8" />,
      accentColor: '#818cf8',
      bullets: [
        'Word (.docx, .doc) layout conversion',
        'Excel (.xlsx, .xls) table grid rendering',
        'PowerPoint (.pptx) presentation compilation',
        'JPG, PNG & WebP multi-image PDF assembly',
        'Plain text (.txt) formatted document engine'
      ],
      link: '/tools/word-to-pdf',
      actionText: 'Open Document Converters'
    },
    {
      badge: 'Export Engine',
      title: 'PDF to Office & Media',
      icon: <FileText size={18} color="#c084fc" />,
      accentColor: '#c084fc',
      bullets: [
        'Export PDF text to structured Word (.docx)',
        'Parse tabular datasets directly to Excel (.xlsx)',
        'Render high-DPI JPG & transparent PNG pages',
        'Semantic HTML & raw text extraction'
      ],
      link: '/tools/pdf-to-word',
      actionText: 'Open Export Converters'
    },
    {
      badge: 'Image & Security',
      title: 'Media Matrix & Signing',
      icon: <PenTool size={18} color="#fb923c" />,
      accentColor: '#fb923c',
      bullets: [
        'Bi-directional JPG ↔ PNG ↔ WebP converter',
        '8-language OCR engine for scanned files',
        'Multi-page visual & cryptographic signing',
        '256-bit AES encryption & security removal'
      ],
      link: '/tools/sign-pdf',
      actionText: 'Open Security & Signing'
    }
  ];

  return (
    <div className="page-shell">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION — Senior Engineer Clean Minimalist Style                  */}
      {/* ========================================================================= */}
      <div className="hero-section">
        <HeroPerspectiveFan />

        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hero-badge"
          >
            <span className="hero-badge--gradient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="hero-live-dot" />
              Private In-Memory Engine • 30+ File Tools • Zero Registration
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="hero-title"
            style={{ fontSize: 'clamp(36px, 5.5vw, 60px)', lineHeight: 1.12, letterSpacing: '-0.03em' }}
          >
            The Document Utility Platform.
            <br />
            <span className="hero-highlight-gradient">
              Fast. Private. Open.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hero-subtitle"
            style={{ maxWidth: 720, fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.6, color: 'var(--text-secondary)' }}
          >
            Process, convert, edit, and sign PDFs, Office files, and images directly in your browser. Engineered for privacy with zero permanent disk storage and zero paywalls.
          </motion.p>

          {/* Quick Launch Chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="hero-quick-chips-wrap"
          >
            {heroQuickChips.map((chip, i) => (
              <Link key={i} href={chip.href} className="hero-quick-chip">
                {chip.icon}
                <span>{chip.label}</span>
              </Link>
            ))}
          </motion.div>

          {/* Technical Guarantee Metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="hero-trust-bar"
          >
            <div className="hero-trust-item">
              <Zap size={14} color="#38bdf8" />
              <span>In-Memory Pipeline Execution</span>
            </div>
            <div className="hero-trust-item">
              <Shield size={14} color="#10b981" />
              <span>Zero Server Tracking</span>
            </div>
            <div className="hero-trust-item">
              <CheckCircle2 size={14} color="#a855f7" />
              <span>ISO-Compliant PDF Standard</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="page-container">

        {/* ========================================================================= */}
        {/* 2. CORE CAPABILITIES GRID                                                 */}
        {/* ========================================================================= */}
        <section className="nexacore-pillars-section">
          {/* Ambient Lighting & Central Upward Glow Flare */}
          <div className="pillars-center-glow" />
          <div className="pillars-side-glow-left" />
          <div className="pillars-side-glow-right" />

          <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
            <span className="section-tagline">Architected for Speed & Precision</span>
            <h2 className="nexacore-section-title">Core Processing Modules</h2>
            <p className="nexacore-section-desc" style={{ margin: '0 auto', maxWidth: 620 }}>
              Purpose-built tools for document restructuring, multi-format conversion, text extraction, and digital signatures.
            </p>
          </div>

          <div className="pillar-cards-grid">
            {pillars.map((pillar, idx) => (
              <motion.div
                key={pillar.title}
                className="pillar-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {pillar.icon}
                    </div>
                    <div className="pillar-card-badge" style={{ margin: 0, borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <span className="pillar-card-badge-ring" style={{ color: pillar.accentColor }} />
                      {pillar.badge}
                    </div>
                  </div>
                  <h3 className="pillar-card-title">{pillar.title}</h3>
                  <ul className="pillar-bullet-list">
                    {pillar.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="pillar-bullet-item">
                        <span className="pillar-bullet-dot" style={{ background: pillar.accentColor }} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={pillar.link} className="pillar-card-link" style={{ color: pillar.accentColor, borderColor: `${pillar.accentColor}33`, background: `${pillar.accentColor}10` }}>
                  <span>{pillar.actionText}</span>
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. STRUCTURED DELIVERY: "FROM CHAOS TO CONTROL" SPLIT SECTION             */}
        {/* ========================================================================= */}
        <section className="nexacore-control-section">
          <div className="control-split-wrap">
            {/* Left Column: Mission & Capabilities */}
            <motion.div
              className="control-left-col"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
            >
              <div className="control-pill-tag">
                <ShieldCheck size={14} />
                <span>Security & Architecture</span>
              </div>
              <h2 className="control-heading">
                Designed for Privacy.
                Built for Speed.
              </h2>
              <p className="control-desc">
                Direct browser-based execution powered by stream processing and MuPDF normalization engines. No third-party ad scripts, no background file retaining.
              </p>

              <div className="control-features-list">
                <div className="control-feature-item">
                  <div className="control-feature-icon-box">
                    <HardDrive size={20} />
                  </div>
                  <div className="control-feature-text">
                    <h4>In-Memory Stream Purging</h4>
                    <p>Files are processed strictly in RAM and purged immediately upon response stream completion. Zero data retention.</p>
                  </div>
                </div>

                <div className="control-feature-item">
                  <div className="control-feature-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.3)', color: '#c084fc' }}>
                    <Zap size={20} />
                  </div>
                  <div className="control-feature-text">
                    <h4>High-Throughput Native Pipeline</h4>
                    <p>Engineered binary routines process multi-page documents, OCR extractions, and batch image conversions instantly.</p>
                  </div>
                </div>

                <div className="control-feature-item">
                  <div className="control-feature-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}>
                    <Sparkles size={20} />
                  </div>
                  <div className="control-feature-text">
                    <h4>Zero Registration Required</h4>
                    <p>Unrestricted access to all 30+ conversion, editing, and security utilities without account creation or paywalls.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Live Interactive Glassmorphic Stage */}
            <motion.div
              className="control-preview-stage"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
            >
              <div className="stage-top-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="hero-live-dot" style={{ width: 7, height: 7 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Stream Pipelines</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Engine: MuPDF 1.28</span>
              </div>

              {/* Workflow Pipeline 1 */}
              <Link href="/tools/word-to-pdf" style={{ textDecoration: 'none' }}>
                <div className="stage-file-pill" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <FileText size={20} color="#38bdf8" />
                  <div className="stage-file-info">
                    <div className="stage-file-name">Word (.docx) ➔ Standardized PDF</div>
                    <div className="stage-file-meta">Layout & Font Vector Stream Preserved</div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, background: 'rgba(56,189,248,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Launch →</span>
                </div>
              </Link>

              {/* Workflow Pipeline 2 */}
              <Link href="/tools/pdf-to-excel" style={{ textDecoration: 'none' }}>
                <div className="stage-file-pill" style={{ borderColor: 'rgba(52, 211, 153, 0.2)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <Table size={20} color="#34d399" />
                  <div className="stage-file-info">
                    <div className="stage-file-name">PDF ➔ Excel (.xlsx Spreadsheet)</div>
                    <div className="stage-file-meta">Tabular Stream Extraction & Multi-Column Mapping</div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, background: 'rgba(52,211,153,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Launch →</span>
                </div>
              </Link>

              {/* Workflow Pipeline 3 */}
              <Link href="/tools/compress" style={{ textDecoration: 'none' }}>
                <div className="stage-file-pill" style={{ borderColor: 'rgba(251, 191, 36, 0.2)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <Minimize size={20} color="#fbbf24" />
                  <div className="stage-file-info">
                    <div className="stage-file-name">Smart PDF Compression</div>
                    <div className="stage-file-meta">Adaptive DPI Downsampling • Average -75% Size</div>
                  </div>
                  <span className="stage-compression-badge">-75% Size</span>
                </div>
              </Link>

              <div className="stage-action-grid">
                <Link href="/tools/sign-pdf" className="stage-action-btn primary">
                  Sign PDF Online
                </Link>
                <Link href="/tools" className="stage-action-btn">
                  View All 30+ Tools
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. ALL TOOLS BENTO EXPLORER SECTION                                       */}
        {/* ========================================================================= */}
        <section className="bento-explorer-section">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span className="section-tagline">Browse by Category</span>
            <h2 className="nexacore-section-title">Complete Utility Directory</h2>
            <p className="nexacore-section-desc" style={{ margin: '0 auto', maxWidth: 600 }}>
              Select from 30+ document conversion, restructuring, OCR, and security modules.
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div className="bento-filter-bar">
            <button
              type="button"
              className={`bento-filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All Tools ({ALL_TOOLS.length})
            </button>
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`bento-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label} ({cat.tools.length})
              </button>
            ))}
          </div>

          {/* Filtered Tool Grid */}
          <motion.div
            layout
            className="tool-grid"
          >
            <AnimatePresence>
              {filteredTools.map((tool, idx) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* ========================================================================= */}
        {/* 5. NEXACORE LARGE GLOWING CTA BANNER                                      */}
        {/* ========================================================================= */}
        <motion.section
          className="nexacore-cta-banner"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-tagline" style={{ color: '#c084fc' }}>Open Source & Private</span>
          <h2 className="nexacore-cta-heading">Ready to Process Your Documents?</h2>
          <p className="nexacore-cta-desc">
            Instant stream processing directly in your browser. Zero registration, zero data retention.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tools" className="btn-primary" style={{ padding: '14px 36px', fontSize: '15px' }}>
              <span>Browse All 30+ Tools →</span>
            </Link>
            <Link href="/tools/word-to-pdf" className="btn-secondary" style={{ padding: '14px 28px', fontSize: '15px' }}>
              Convert Word to PDF
            </Link>
          </div>
        </motion.section>

      </div>
    </div>
  );
}

