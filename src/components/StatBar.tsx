import React from 'react';
import { motion } from 'motion/react';

interface StatBarProps {
  label: string;
  value: number; // 0 - 100
  icon: string | React.ReactNode;
  colorClass: string;
  bgClass?: string;
  id?: string;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  icon,
  colorClass,
  bgClass = 'bg-muted',
  id,
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full font-bold text-sm" id={id}>
      <div className="flex justify-between items-center text-xs font-extrabold text-foreground/80">
        <span className="flex items-center gap-1">
          <span className="text-sm">{icon}</span>
          <span>{label}</span>
        </span>
        <span className="font-mono text-xs">{value} / 100</span>
      </div>

      <div className={`w-full ${bgClass} h-6 rounded-xl overflow-hidden border-2 border-border/80 flex items-center relative p-0.5`}>
        {/* Dynamic bar background fill with subtle movement */}
        <motion.div
          className={`h-full rounded-lg ${colorClass} shadow-inner`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        />

        {/* Glossy overlay effect for visual candy */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-xl" />

        {/* Low warning text */}
        {value < 30 && (
          <span className="absolute right-3 text-[10px] text-rose-500 font-black animate-pulse z-10">
            ⚠️ 状态低!
          </span>
        )}
      </div>
    </div>
  );
};
