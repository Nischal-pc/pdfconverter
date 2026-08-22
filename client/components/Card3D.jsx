'use client';
import { useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function Card3D({ children, className = '', style = {}, intensity = 12, hoverLift = 8 }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(false);

  const rotateX = useSpring(0, { stiffness: 260, damping: 22 });
  const rotateY = useSpring(0, { stiffness: 260, damping: 22 });
  const lift = useSpring(0, { stiffness: 300, damping: 24 });

  const shadow = useTransform(lift, [0, hoverLift], [
    '0 8px 32px rgba(0,0,0,0.2)',
    '0 28px 60px rgba(99,102,241,0.25)',
  ]);

  const onMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotateX.set(-dy * intensity);
    rotateY.set(dx * intensity);
  };

  const onLeave = () => {
    setHover(false);
    rotateX.set(0);
    rotateY.set(0);
    lift.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        perspective: 900,
        transformStyle: 'preserve-3d',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        ...style,
      }}
      onMouseMove={onMove}
      onMouseEnter={() => { setHover(true); lift.set(hoverLift); }}
      onMouseLeave={onLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          y: lift,
          transformStyle: 'preserve-3d',
          boxShadow: shadow,
          borderRadius: style.borderRadius || 16,
          height: style.height || '100%',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
