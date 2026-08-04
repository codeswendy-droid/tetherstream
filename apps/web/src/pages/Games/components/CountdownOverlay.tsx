import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownOverlayProps {
  onDone: () => void;
  seconds?: number;
  label?: string;
}

/**
 * Lightweight pre-game countdown (3-2-1-GO). Kept CSS/transform-based so it
 * stays smooth on low-end mobile and Telegram WebView.
 */
export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onDone, seconds = 3, label }) => {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) {
      const t = window.setTimeout(onDone, 150);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setCount((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [count, onDone]);

  return (
    <div className="absolute inset-0 z-40 bg-[#050608]/92 backdrop-blur-md flex flex-col items-center justify-center">
      {label && (
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-text-secondary mb-6 animate-pulse">{label}</p>
      )}
      <AnimatePresence mode="popLayout">
        {count > 0 ? (
          <motion.div
            key={count}
            initial={{ scale: 2.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="text-7xl font-black text-usdt-green drop-shadow-[0_0_25px_rgba(0,230,118,0.6)]"
          >
            {count}
          </motion.div>
        ) : (
          <motion.div
            key="go"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-6xl font-black text-gold drop-shadow-[0_0_25px_rgba(255,179,0,0.7)]"
          >
            GO!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
