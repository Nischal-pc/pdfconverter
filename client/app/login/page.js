'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lock, ArrowRight } from 'lucide-react';
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="auth-card page-container--auth"
        style={{ width: '100%' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--border)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            color: 'var(--text-primary)'
          }}>
            <Lock size={20} />
          </div>
          <h1 className="nexacore-section-title" style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', marginBottom: 6 }}>
            Sign In to PdfFlow
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>
            Access and synchronize your document processing history
          </p>
        </div>

        <AuthDbBanner />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <input
              type="email"
              className="option-input"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              type="password"
              className="option-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: 8, minHeight: 42, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--color-blue)', fontWeight: 600, textDecoration: 'none' }}>
            Create Account
          </Link>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
