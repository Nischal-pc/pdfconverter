'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function ToolCard({ tool, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.3), ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <Link href={`/tools/${tool.id}`} className="tool-card-link">
        <div className="tool-card-inner">
          {/* Card Header with Icon & Optional Badge */}
          <div className="tool-card-top">
            <div className="tool-card-icon-wrapper" aria-hidden="true">
              <div className="tool-card-icon">
                {tool.icon}
              </div>
            </div>
            {tool.multi && (
              <span className="tool-card-badge">Batch</span>
            )}
          </div>

          {/* Text content */}
          <div className="tool-card-body">
            <div className="tool-card-title-row">
              <h3 className="tool-card-title">{tool.label}</h3>
              <ArrowUpRight size={15} className="tool-card-arrow" />
            </div>
            <p className="tool-card-desc">{tool.desc}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
