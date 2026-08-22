'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Map category IDs to premium accent colors
const CATEGORY_ACCENTS = {
  organize:    { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.25)' },
  optimize:    { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)',  border: 'rgba(251, 146, 60, 0.25)' },
  'convert-to': { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)',  border: 'rgba(56, 189, 248, 0.25)' },
  'convert-from': { color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.25)' },
  edit:        { color: '#f472b6', bg: 'rgba(244, 114, 182, 0.12)', border: 'rgba(244, 114, 182, 0.25)' },
  security:    { color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', border: 'rgba(248, 113, 113, 0.25)' },
  ai:          { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.25)' },
};

export default function ToolCard({ tool, index = 0 }) {
  const accent = CATEGORY_ACCENTS[tool.categoryId] || CATEGORY_ACCENTS['convert-to'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: '100%' }}
    >
      <Link href={`/tools/${tool.id}`} className="tool-card-link">
        <div
          className="tool-card-inner"
          style={{ '--accent': accent.color, '--accent-bg': accent.bg, '--accent-border': accent.border }}
        >
          {/* Top accent border line */}
          <div className="tool-card-accent-bar" />

          {/* Hover glow layer */}
          <div className="tool-card-glow" />

            {/* Icon wrapper – glass‑morphic */}
            <div className="tool-card-icon-wrapper" aria-hidden="true">
              <span className="icon-bg" />
              <div className="tool-card-icon">
                {tool.icon}
              </div>
            </div>

          {/* Text content */}
          <div className="tool-card-body">
            <div className="tool-card-title">{tool.label}</div>
            <div className="tool-card-desc">{tool.desc}</div>
          </div>

          {/* Arrow affordance */}
          <div className="tool-card-arrow">
            <ArrowRight size={15} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
