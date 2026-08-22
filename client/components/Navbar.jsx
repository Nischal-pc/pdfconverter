'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { TOOL_CATEGORIES } from '@/lib/tools';
import Logo from './Logo';

// SVG icon components — no emojis per ui-ux-pro-max rules
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isDesktop, setIsDesktop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toolsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setScrolled(scrollPos > 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('pdf_theme') || 'dark';
    Promise.resolve().then(() => setTheme(saved));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!isDesktop) Promise.resolve().then(() => setToolsOpen(false));
  }, [isDesktop]);

  useEffect(() => {
    const handler = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('pdf_theme', next);
    document.documentElement.classList.toggle('light', next === 'light');
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMobileToolsOpen(false);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo" onClick={closeMenu}>
            <Logo />
          </Link>

          {/* Desktop navigation */}
          <div className="navbar-desktop">
            <Link href="/tools" className="navbar-text-link">PDF Tools</Link>
            <Link href="/tools" className="navbar-text-link">How It Works</Link>
            <Link href="/about" className="navbar-text-link">About Us</Link>
            <Link href="/history" className="navbar-text-link">My History</Link>

            <button
              type="button"
              className="navbar-search-trigger"
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              title="Quick Search (Ctrl + K)"
              aria-label="Quick Search"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--border)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px',
                color: 'var(--text-secondary)',
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              <SearchIcon />
              <span style={{ fontSize: 12 }}>Search</span>
              <kbd style={{
                fontSize: 10.5,
                fontFamily: 'JetBrains Mono, monospace',
                padding: '1px 5px',
                borderRadius: 4,
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              className="navbar-theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {user ? (
              <div className="navbar-auth">
                <div className="navbar-avatar" title={user.name}>{user.name?.[0]?.toUpperCase()}</div>
                <button type="button" onClick={logout} className="navbar-btn-cta" style={{ padding: '6px 16px', fontSize: '13px' }}>Logout</button>
              </div>
            ) : (
              <div className="navbar-auth">
                <Link href="/signup" className="navbar-btn-cta">Try Free</Link>
              </div>
            )}
          </div>



          <div className="navbar-mobile-controls">
            <button
              type="button"
              className="navbar-icon-btn"
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              title="Search tools"
              aria-label="Search tools"
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              className="navbar-theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              className="navbar-toggle"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <motion.span
                animate={{ rotate: menuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'inline-flex' }}
              >
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </motion.span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="navbar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
            />
            <motion.div
              className="navbar-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div className="navbar-drawer-header">
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Menu</span>
                <button type="button" className="navbar-toggle" onClick={closeMenu} aria-label="Close">
                  <CloseIcon />
                </button>
              </div>

              <button
                type="button"
                className="navbar-drawer-accordion"
                onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
              >
                PDF Tools
                <motion.span animate={{ rotate: mobileToolsOpen ? 180 : 0 }} style={{ display: 'inline-flex' }}>
                  <ChevronDownIcon />
                </motion.span>
              </button>

              <AnimatePresence>
                {mobileToolsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="navbar-drawer-tools"
                  >
                    {TOOL_CATEGORIES.map((cat) => (
                      <div key={cat.id} className="navbar-drawer-cat">
                        <div className="tools-dropdown-cat">{cat.label}</div>
                        {cat.tools.map((tool) => (
                          <Link
                            key={tool.id}
                            href={`/tools/${tool.id}`}
                            className="tools-dropdown-item"
                            onClick={closeMenu}
                          >
                            {tool.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <Link href="/history" className="navbar-drawer-link" onClick={closeMenu}>My History</Link>
              <Link href="/about" className="navbar-drawer-link" onClick={closeMenu}>About Us</Link>
              <Link href="/privacy" className="navbar-drawer-link" onClick={closeMenu}>Privacy</Link>
              <Link href="/terms" className="navbar-drawer-link" onClick={closeMenu}>Terms</Link>

              <div className="navbar-drawer-auth">
                {user ? (
                  <>
                    <div className="navbar-drawer-user">Signed in as {user.name}</div>
                    <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={() => { logout(); closeMenu(); }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-secondary navbar-drawer-btn" onClick={closeMenu}>Login</Link>
                    <Link href="/signup" className="btn-primary navbar-drawer-btn" onClick={closeMenu}><span>Try Free</span></Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
