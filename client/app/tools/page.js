'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { TOOL_CATEGORIES, ALL_TOOLS } from '@/lib/tools';
import ToolCard from '@/components/ToolCard';
import { Search, Wrench } from 'lucide-react';

export default function ToolsDirectoryPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = ALL_TOOLS.filter((tool) => {
    const matchesCat = activeCategory === 'all' || tool.categoryId === activeCategory;
    const matchesSearch = !searchQuery || 
      tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="page-shell" style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div className="orb orb--hero-left" style={{ opacity: 0.5 }} />
      <div className="orb orb--hero-right" style={{ opacity: 0.3, animationDelay: '-3s' }} />

      <div className="page-container">
        {/* Header Section */}
        <div style={{ textAlign: 'center', padding: '40px 0 20px', maxWidth: 720, margin: '0 auto' }}>
          <span className="section-tagline">Convert · Organize · OCR · Edit · Sign · Protect</span>
          <h1 className="nexacore-section-title" style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}>
            All Document & Image Tools, Free & Instant
          </h1>
          <p className="nexacore-section-desc" style={{ margin: '0 auto 28px' }}>
            Convert between Word, PDF, Excel, Text, and Images, run OCR, sign, and edit — no account, no watermarks, no file limits.
          </p>

          {/* Search Box */}
          <div style={{ position: 'relative', maxWidth: 440, margin: '0 auto 36px' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search tools (e.g. word, excel, ocr, png, sign)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 46, borderRadius: 9999 }}
              aria-label="Search PDF tools"
            />
          </div>

          {/* Filter Pills */}
          <div className="bento-filter-bar" style={{ marginBottom: 40 }}>
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
        </div>

        {/* Tools Bento Grid */}
        <motion.div layout className="tool-grid" style={{ marginBottom: 80 }}>
          <AnimatePresence>
            {filtered.map((tool, idx) => (
              <ToolCard key={tool.id} tool={tool} index={idx} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Wrench size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: 16, marginBottom: 8 }}>No tools match "{searchQuery}"</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', opacity: 0.7 }}>Try searching for "compress", "word", "sign", or "split".</p>
          </div>
        )}
      </div>
    </div>
  );
}
