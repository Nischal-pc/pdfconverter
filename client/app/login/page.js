'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import AuthDbBanner from '@/components/AuthDbBanner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in!');
      router.push('/');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Login failed.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-shell">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-card page-container--auth"
        style={{ position: 'relative', zIndex: 5, width: '100%' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: 18, background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Lock size={30} color="#38bdf8" />
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Sign In to PdfFlow</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Access your PDF conversion history across all your devices</p>
        </div>

        <AuthDbBanner />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
            </div>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            <span>{loading ? 'Logging in...' : 'Log In'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="navbar-text-link" style={{ color: '#38bdf8', fontWeight: 600, padding: 0 }}>
            Sign Up
          </Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          <Link href="/tools" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Use PDF tools without an account →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
