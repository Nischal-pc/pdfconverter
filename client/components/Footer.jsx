'use client';
import Link from 'next/link';
import Logo from './Logo';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

const links = [
  { href: '/tools', label: 'All Tools' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/history', label: 'Document History' },
];

const editLinks = [
  { href: '/tools/sign-pdf', label: 'Sign & Fill PDF' },
  { href: '/tools/merge', label: 'Merge PDF' },
  { href: '/tools/split', label: 'Split PDF' },
  { href: '/tools/compress', label: 'Compress PDF' },
  { href: '/tools/watermark', label: 'Watermark PDF' },
  { href: '/tools/protect', label: 'Protect PDF' },
];

const convertLinks = [
  { href: '/tools/word-to-pdf', label: 'Word to PDF (.docx)' },
  { href: '/tools/pdf-to-word', label: 'PDF to Word' },
  { href: '/tools/pdf-to-excel', label: 'PDF to Excel (.xlsx)' },
  { href: '/tools/excel-to-pdf', label: 'Excel to PDF' },
  { href: '/tools/jpg-to-pdf', label: 'JPG to PDF' },
  { href: '/tools/image-to-text', label: 'Image to Text (OCR)' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Logo size={28} textSize={18} />
          </Link>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {APP_NAME} provides high-throughput document conversion, reorganization, OCR, and signature utilities. All files are processed strictly in ephemeral memory with zero permanent data retention.
          </p>
        </div>

        <div className="footer-columns">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Navigation
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="footer-nav-link">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Convert &amp; Extract
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {convertLinks.map((l) => (
                <Link key={l.href} href={l.href} className="footer-nav-link">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Organize &amp; Secure
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {editLinks.map((l) => (
                <Link key={l.href} href={l.href} className="footer-nav-link">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {year} {APP_NAME}. Standard ISO-32000-1 Document Engine.</span>
        <span>Zero Storage • 100% Free • Open Standards</span>
      </div>
    </footer>
  );
}
