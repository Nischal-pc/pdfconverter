'use client';
import Link from 'next/link';
import Logo from './Logo';
import { APP_NAME } from '@/lib/brand';
import { ShieldCheck, Lock, Cpu } from 'lucide-react';

const platformLinks = [
  { href: '/tools', label: 'All 44 Tools' },
  { href: '/history', label: 'Local History' },
  { href: '/about', label: 'About PdfFlow' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

const organizeLinks = [
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
        {/* Brand Column */}
        <div className="footer-brand">
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <Logo size={28} textSize={18} />
          </Link>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            {APP_NAME} provides high-throughput document conversion, reorganization, OCR, and signature utilities. All files are processed strictly in ephemeral memory with zero permanent data retention.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>Zero cloud storage retention</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={14} color="#38bdf8" />
              <span>MuPDF &amp; WebAssembly engine</span>
            </div>
          </div>
        </div>

        {/* Column 1: Convert & OCR */}
        <div className="footer-col">
          <h3 className="footer-col-title">Convert &amp; OCR</h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {convertLinks.map((l) => (
              <Link key={l.href} href={l.href} className="footer-nav-link">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Column 2: Organize & Secure */}
        <div className="footer-col">
          <h3 className="footer-col-title">Organize &amp; Secure</h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {organizeLinks.map((l) => (
              <Link key={l.href} href={l.href} className="footer-nav-link">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Column 3: Platform & Legal */}
        <div className="footer-col">
          <h3 className="footer-col-title">Platform &amp; Legal</h3>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {platformLinks.map((l) => (
              <Link key={l.href} href={l.href} className="footer-nav-link">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} {APP_NAME}. Standard ISO-32000-1 Document Engine.</span>
        <span>Zero Storage • 100% Free • Open Standards</span>
      </div>
    </footer>
  );
}
