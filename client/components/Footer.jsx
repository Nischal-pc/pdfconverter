'use client';
import Link from 'next/link';
import Logo from './Logo';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

const links = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/history', label: 'History' },
];

const editLinks = [
  { href: '/tools/add-text', label: 'Type on PDF' },
  { href: '/tools/sign-pdf', label: 'Sign PDF' },
  { href: '/tools/highlight', label: 'Highlight' },
  { href: '/tools/watermark', label: 'Watermark' },
];

const convertLinks = [
  { href: '/tools/word-to-pdf', label: 'Word to PDF' },
  { href: '/tools/pdf-to-excel', label: 'PDF to Excel' },
  { href: '/tools/pdf-to-word', label: 'PDF to Word' },
  { href: '/tools/image-to-text', label: 'Image to Text (OCR)' },
  { href: '/tools/jpg-to-png', label: 'JPG to PNG' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size={32} textSize={18} />
          </Link>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {APP_TAGLINE}. {APP_NAME} is your complete, all-in-one PDF, Word, Excel, and Image converter — process files securely in your browser with zero data retention.
          </p>
        </div>

        <div className="footer-columns">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Quick Links
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {links.map((l) => (
                <Link key={l.href} href={l.href} style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Convert & OCR
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {convertLinks.map((l) => (
                <Link key={l.href} href={l.href} style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Edit & Sign
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {editLinks.map((l) => (
                <Link key={l.href} href={l.href} style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        © {year} {APP_NAME}. Open source PDF utilities.
      </div>
    </footer>
  );
}
