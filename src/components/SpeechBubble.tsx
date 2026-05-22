import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SpeechBubbleProps {
  text: string;
  visible?: boolean;
  className?: string;
  arrowPosition?: 'bottom' | 'top' | 'left' | 'right';
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  visible = true,
  className = '',
  arrowPosition = 'bottom',
}) => {
  const arrowStyles = {
    bottom: 'bottom-[-7px] left-1/2 -translate-x-1/2 border-t-card border-x-transparent border-b-transparent',
    top: 'top-[-7px] left-1/2 -translate-x-1/2 border-b-card border-x-transparent border-t-transparent',
    left: 'left-[-7px] top-1/2 -translate-y-1/2 border-r-card border-y-transparent border-l-transparent',
    right: 'right-[-7px] top-1/2 -translate-y-1/2 border-l-card border-y-transparent border-r-transparent',
  };

  const arrowBorderStyles = {
    bottom: 'bottom-[-9px] left-1/2 -translate-x-1/2 border-t-border border-x-transparent border-b-transparent',
    top: 'top-[-9px] left-1/2 -translate-x-1/2 border-b-border border-x-transparent border-t-transparent',
    left: 'left-[-9px] top-1/2 -translate-y-1/2 border-r-border border-y-transparent border-l-transparent',
    right: 'right-[-9px] top-1/2 -translate-y-1/2 border-l-border border-y-transparent border-r-transparent',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 5 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className={`relative bg-card border-2 border-border px-3 py-1.5 rounded-xl text-center text-xs font-bold text-foreground shadow-sm max-w-[200px] inline-block ${className}`}
        >
          <span>{text}</span>
          
          {/* Arrow border triangle */}
          <div className={`absolute w-0 h-0 border-[5px] pointer-events-none z-0 ${arrowBorderStyles[arrowPosition]}`} />
          {/* Arrow fill triangle */}
          <div className={`absolute w-0 h-0 border-[4px] pointer-events-none z-10 ${arrowStyles[arrowPosition]}`} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
