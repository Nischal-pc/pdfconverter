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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800;900&family=Dancing+Script:wght@400;600;700&family=Caveat:wght@400;600;700&display=swap"
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
                background: '#1a1a28',
                color: '#f0f0ff',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#D4AF37', secondary: '#0a0a0f' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
