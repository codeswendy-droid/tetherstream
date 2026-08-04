import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConfettiPiece {
  x: number;
  y: number;
  rotation: number;
  color: string;
  delay: number;
  size: number;
  duration: number;
  shape: 'rect' | 'circle';
}

const COLORS = ['#2ea97d', '#ffb300', '#38bdf8', '#a78bfa', '#fb7185', '#facc15', '#34d399'];

const Confetti: React.FC<{ count?: number }> = ({ count = 60 }) => {
  const pieces = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * 100,
        y: -10 - Math.random() * 30,
        rotation: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.35,
        size: 5 + Math.random() * 6,
        duration: 1.4 + Math.random() * 1.2,
        shape: i % 3 === 0 ? 'circle' : 'rect',
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 1.8,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
          }}
          initial={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: [1, 1, 0],
            y: [0, 260 + Math.random() * 220],
            x: [0, (Math.random() - 0.5) * 160],
            rotate: p.rotation,
            scale: [1, 1.15, 0.9],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
};

export default Confetti;
