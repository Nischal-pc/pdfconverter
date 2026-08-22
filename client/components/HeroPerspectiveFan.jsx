'use client';

export default function HeroPerspectiveFan() {
  return (
    <div className="hero-perspective-fan-wrap" aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Precision technical background grid lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          opacity: 0.6,
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 15%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 15%, transparent 85%)',
        }}
      />
    </div>
  );
}
