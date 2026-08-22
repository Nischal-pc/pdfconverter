'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UserPlus, ArrowRight } from 'lucide-react';
import AuthDbBanner from '@/components/AuthDbBanner';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Successfully registered!');
      router.push('/');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Registration failed.';
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
            <UserPlus size={20} />
          </div>
          <h1 className="nexacore-section-title" style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', marginBottom: 6 }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>
            Sign up to sync your conversion history across devices
          </p>
        </div>

        <AuthDbBanner />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name</label>
            <input
              type="text"
              className="option-input"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
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
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
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
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-blue)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
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
