import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Star, Sparkles, Heart, Trophy } from 'lucide-react';

interface XpActionsProps {
  onApplyXp: (amount: number, label: string) => void;
  disabled?: boolean;
}

interface ActionItem {
  label: string;
  amount: number;
  icon: React.ReactNode;
  colorName: string;
  btnClass: string;
}

export const XpActions: React.FC<XpActionsProps> = ({ onApplyXp, disabled = false }) => {
  const actions: ActionItem[] = [
    {
      label: '完成作业',
      amount: 20,
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
      colorName: 'blue',
      btnClass: 'btn-push-white text-blue-600',
    },
    {
      label: '课堂表现',
      amount: 15,
      icon: <Star className="w-5 h-5 text-amber-500 fill-amber-500" />,
      colorName: 'amber',
      btnClass: 'btn-push-white text-amber-600',
    },
    {
      label: '打卡签到',
      amount: 10,
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      colorName: 'emerald',
      btnClass: 'btn-push-white text-emerald-600',
    },
    {
      label: '帮助同学',
      amount: 15,
      icon: <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />,
      colorName: 'rose',
      btnClass: 'btn-push-white text-rose-600',
    },
    {
      label: '考试进步',
      amount: 30,
      icon: <Trophy className="w-5 h-5 text-purple-600 fill-purple-100" />,
      colorName: 'purple',
      btnClass: 'btn-push-accent text-foreground',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-extrabold text-base text-foreground/90 flex items-center gap-1.5 px-1">
        <span>🏆 课堂表现奖励记功簿</span>
        <span className="text-xs bg-accent/25 text-amber-700 px-2 py-0.5 rounded-full font-bold">
          给宠物加经验值
        </span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((act, idx) => (
          <motion.button
            key={idx}
            onClick={() => !disabled && onApplyXp(act.amount, act.label)}
            disabled={disabled}
            whileHover={disabled ? {} : { scale: 1.05, y: -2 }}
            whileTap={disabled ? {} : { scale: 0.95, y: 3 }}
            className={`flex flex-col items-center justify-center p-3.5 gap-2.5 rounded-2xl text-center cursor-pointer transition-opacity border-2 select-none min-h-[96px] ${act.btnClass} ${
              disabled ? 'opacity-50 cursor-not-allowed shadow-none border-dashed' : ''
            }`}
          >
            <div className="p-2 rounded-xl bg-background border border-border/40">
              {act.icon}
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm">{act.label}</span>
              <span className="text-[11px] font-black opacity-80 mt-0.5">+{act.amount} XP</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
