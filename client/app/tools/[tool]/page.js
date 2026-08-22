'use client';
import { use } from 'react';
import Link from 'next/link';
import { getToolById } from '@/lib/tools';
import ToolProcessor from '@/components/ToolProcessor';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export default function ToolPage({ params }) {
  const resolvedParams = use(params);
  const toolId = resolvedParams.tool;
  const tool = getToolById(toolId);

  if (!tool) {
    return (
      <div className="page-shell">
        <div className="page-container page-container--auth" style={{ textAlign: 'center', marginTop: 60 }}>
          <div style={{ marginBottom: 20 }}><Search size={64} color="var(--accent)" /></div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Tool Not Found</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>The tool you are looking for does not exist or has been moved.</p>
          <Link href="/" className="btn-primary navbar-btn-link">
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell" style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div className="orb orb--tool-left" />
      <div className="orb orb--tool-right" style={{ animationDelay: '-3s' }} />

      <div className="page-container page-container--narrow">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{tool.category}</span>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{tool.label}</span>
        </nav>

        <header className="tool-header">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="tool-header-row"
          >
            <div className="tool-header-icon">{tool.icon}</div>
            <div className="tool-header-text">
              <h1>{tool.label}</h1>
              <p>{tool.desc}</p>
            </div>
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ToolProcessor tool={tool} />
        </motion.div>
      </div>
    </div>
  );
}
