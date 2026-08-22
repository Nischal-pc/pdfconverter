'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, CornerDownLeft, Sparkles, FileText, Lock, Layers, Zap } from 'lucide-react';
import { ALL_TOOLS } from '@/lib/tools';

const STATIC_PAGES = [
  { id: 'page-tools', label: 'All PDF Tools Directory', desc: 'Browse the complete 35+ document tools directory', path: '/tools', category: 'Pages' },
  { id: 'page-history', label: 'Document Conversion History', desc: 'View previously processed files & downloads', path: '/history', category: 'Pages' },
  { id: 'page-about', label: 'About PdfFlow & Privacy Guarantees', desc: 'Learn about zero-retention memory processing', path: '/about', category: 'Pages' },
  { id: 'page-privacy', label: 'Privacy Policy', desc: 'Read our zero-data-collection policy', path: '/privacy', category: 'Pages' },
  { id: 'page-terms', label: 'Terms of Service', desc: 'Review terms and usage guidelines', path: '/terms', category: 'Pages' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Listen for custom trigger from navbar
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Filter tools and pages
  const q = query.trim().toLowerCase();
  const filteredTools = ALL_TOOLS.filter((tool) => {
    if (!q) return true;
    return (
      tool.label.toLowerCase().includes(q) ||
      tool.desc.toLowerCase().includes(q) ||
      tool.id.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const filteredPages = STATIC_PAGES.filter((page) => {
    if (!q) return true;
    return (
      page.label.toLowerCase().includes(q) ||
      page.desc.toLowerCase().includes(q)
    );
  }).slice(0, 3);

  const allResults = [
    ...filteredTools.map((t) => ({ type: 'tool', item: t, path: `/tools/${t.id}` })),
    ...filteredPages.map((p) => ({ type: 'page', item: p, path: p.path })),
  ];

  // Navigate with keyboard
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % Math.max(1, allResults.length));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      const target = allResults[selectedIndex];
      setOpen(false);
      router.push(target.path);
    }
  };

  const handleSelect = (path) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12vh 16px 24px' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Palette Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 580,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1,
            }}
          >
            {/* Search Input Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}>
              <Search size={18} color="var(--text-muted)" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search PDF tools, actions, or pages..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 14.5,
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                }}
              />
              <kbd style={{
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                padding: '2px 6px',
                borderRadius: 4,
                background: 'var(--border)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div ref={listRef} style={{ maxHeight: 360, overflowY: 'auto', padding: '8px' }}>
              {allResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: 13.5 }}>
                  No tools or pages matching &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredTools.length > 0 && (
                    <div style={{ padding: '6px 10px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                      PDF Tools
                    </div>
                  )}
                  {filteredTools.map((tool, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={tool.id}
                        onClick={() => handleSelect(`/tools/${tool.id}`)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'var(--border)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.1s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span style={{ color: isSelected ? 'var(--color-blue)' : 'var(--text-muted)', display: 'inline-flex' }}>
                            {tool.icon || <FileText size={16} />}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {tool.label}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {tool.desc}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 4 }}>
                            {tool.category}
                          </span>
                          {isSelected && <CornerDownLeft size={13} color="var(--text-muted)" />}
                        </div>
                      </div>
                    );
                  })}

                  {filteredPages.length > 0 && (
                    <div style={{ padding: '10px 10px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                      Pages &amp; Info
                    </div>
                  )}
                  {filteredPages.map((page, idx) => {
                    const globalIdx = filteredTools.length + idx;
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <div
                        key={page.id}
                        onClick={() => handleSelect(page.path)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'var(--border)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.1s ease',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {page.label}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {page.desc}
                          </div>
                        </div>
                        {isSelected && <CornerDownLeft size={13} color="var(--text-muted)" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer keyboard hints */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              fontSize: 11.5,
              color: 'var(--text-muted)',
            }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <span><kbd style={{ fontFamily: 'JetBrains Mono, monospace' }}>↑↓</kbd> Navigate</span>
                <span><kbd style={{ fontFamily: 'JetBrains Mono, monospace' }}>↵</kbd> Select</span>
                <span><kbd style={{ fontFamily: 'JetBrains Mono, monospace' }}>ESC</kbd> Close</span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>PdfFlow Spotlight</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
