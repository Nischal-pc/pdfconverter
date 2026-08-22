import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServerStatus from '@/components/ServerStatus';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/brand';

export const metadata = {
  title: `${APP_NAME} — Free Online PDF Tools`,
  description: APP_DESCRIPTION,
  keywords: 'PDF tools, merge PDF, split PDF, compress PDF, convert PDF, PDF editor, free PDF tools',
  openGraph: {
    title: `${APP_NAME} — Free Online PDF Tools`,
    description: APP_DESCRIPTION,
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('pdf_theme') || 'dark';
                document.documentElement.classList.toggle('light', theme === 'light');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <ServerStatus />
          <main className="site-main">{children}</main>
          <Footer />
          <Toaster
            position="top-center"
            containerStyle={{ top: 'calc(var(--nav-height) + 32px)' }}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                boxShadow: '0 8px 24px -4px rgba(0,0,0,0.3)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#0B0F17' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
