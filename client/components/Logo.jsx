'use client';

export default function Logo({ size = 28, showText = true, textSize = 19 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      {/* Sleek gradient ring logo mark like in the NexaCore reference */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <circle
          cx="16"
          cy="16"
          r="12.5"
          stroke="url(#nexacore-logo-grad)"
          strokeWidth="3.2"
        />
        <defs>
          <linearGradient id="nexacore-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.45" stopColor="#a855f7" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span
          className="logo-text"
          style={{
            fontWeight: 800,
            fontSize: textSize,
            color: 'var(--text-primary)',
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          PdfFlow
        </span>
      )}
    </span>
  );
}

