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
      <div className="page-container">
        {/* Header Section */}
        <div style={{ textAlign: 'center', padding: '36px 0 20px', maxWidth: 700, margin: '0 auto' }}>
          <span className="section-tagline">Utility Directory</span>
          <h1 className="nexacore-section-title" style={{ fontSize: 'clamp(28px, 4.5vw, 44px)' }}>
            Document & PDF Utilities
          </h1>
          <p className="nexacore-section-desc" style={{ margin: '0 auto 24px' }}>
            Convert, organize, sign, and OCR documents with zero permanent file storage.
          </p>

          {/* Search Box */}
          <div style={{ position: 'relative', maxWidth: 440, margin: '0 auto 28px' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter tools by keyword (e.g. Word, Excel, OCR, Sign)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="option-input"
              style={{ paddingLeft: 40, borderRadius: 'var(--radius-sm)' }}
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
        <motion.div layout className="tool-grid" style={{ marginBottom: 48 }}>
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
