'use client';

export default function HeroPerspectiveFan() {
  return (
    <div className="hero-perspective-fan-wrap" aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Subtle radial ambient illumination */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(900px, 100vw)',
          height: '480px',
          background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(99, 102, 241, 0.18), rgba(56, 189, 248, 0.08) 50%, transparent 80%)',
          filter: 'blur(40px)',
        }}
      />
      {/* Precision technical background grid lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%)',
        }}
      />
    </div>
  );
}
