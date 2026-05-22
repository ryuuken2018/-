import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Pet, PET_CLASSES, getEvolutionStage, EVOLUTION_NAMES } from '../types/pet';
import { PetSprite } from './PetSprite';
import { Trash2 } from 'lucide-react';
import { deletePet } from '../lib/petStore';
import { getActiveRole, ClassroomRole } from '../lib/roleStore';

interface PetCardProps {
  pet: Pet;
  index: number;
}

export const PetCard: React.FC<PetCardProps> = ({ pet, index }) => {
  const petClass = PET_CLASSES[pet.petType];
  const stage = getEvolutionStage(pet.level);
  const evoName = EVOLUTION_NAMES[pet.petType][stage];

  const [activeRole, setActiveRole] = useState<ClassroomRole>('parent');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setActiveRole(getActiveRole());
    const handleRoleChanged = () => {
      setActiveRole(getActiveRole());
    };
    window.addEventListener('classroom-role-changed', handleRoleChanged);
    return () => {
      window.removeEventListener('classroom-role-changed', handleRoleChanged);
    };
  }, []);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  // Visual cues for mood
  const getMoodEmoji = (score: number) => {
    if (score > 80) return '😆';
    if (score > 50) return '😊';
    if (score > 30) return '😐';
    if (score > 15) return '😟';
    return '😢';
  };

  const getMoodColorClass = (score: number) => {
    if (score > 80) return 'bg-emerald-500';
    if (score > 50) return 'bg-blue-500';
    if (score > 30) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={showDeleteConfirm ? {} : { scale: 1.05, y: -4 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: index * 0.08,
      }}
      className="card-flat overflow-hidden flex flex-col h-full bg-card group relative"
      id={`card-${pet.id}`}
    >
      {/* Inline custom delete confirmation overlay */}
      {showDeleteConfirm && (
        <div 
          className="absolute inset-0 bg-stone-950/95 z-30 p-4 flex flex-col justify-center items-center text-center gap-3"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center animate-bounce">
            <Trash2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col gap-1 px-1">
            <p className="text-xs font-black text-rose-400">🚨 确定要放归/删除吗？</p>
            <p className="text-[10px] text-stone-200 font-bold leading-relaxed">
              确定删除【{pet.studentName}的{pet.petName}】吗？所有数据等级将永久清空！
            </p>
          </div>
          <div className="flex items-center gap-2 w-full mt-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
              className="flex-1 py-1.5 text-[10px] font-black rounded-lg bg-stone-800 border border-stone-700 text-stone-300 hover:bg-stone-700 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deletePet(pet.id);
                setShowDeleteConfirm(false);
              }}
              className="flex-1 py-1.5 text-[10px] font-black rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors cursor-pointer shadow-md"
            >
              确定删除
            </button>
          </div>
        </div>
      )}

      {/* Top action bar: OUTSIDE the main link to avoid nested interactive elements */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs z-10">
        <span className="px-2.5 py-1 font-bold rounded-full bg-secondary/15 text-secondary border border-secondary/25 select-none">
          {petClass.icon} {petClass.name}
        </span>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="flex items-center gap-1 font-bold text-accent bg-amber-50 border-2 border-accent/30 px-2 py-0.5 rounded-lg select-none">
            Lv.{pet.level}
          </span>
          {activeRole === 'parent' && (
            <button
              onClick={handleDeleteClick}
              className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer flex items-center justify-center shadow-xs active:scale-95"
              title="删除/放归该宠物"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      <Link to={`/pet/${pet.id}`} className="p-5 pt-14 flex-1 flex flex-col justify-between">
        {/* Pet Sprite */}
        <div className="my-4 h-28 flex items-center justify-center relative">
          <PetSprite
            type={pet.petType}
            level={pet.level}
            costume={pet.activeCostume}
            mood={pet.mood}
            hunger={pet.hunger}
            energy={pet.energy}
            size="lg"
            className="group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Info */}
        <div className="text-center mt-2">
          <h3 className="font-extrabold text-lg text-foreground tracking-tight flex items-center justify-center gap-1">
            {pet.petName}
          </h3>
          <p className="text-xs text-foreground/60 font-semibold mt-0.5">
            👤 同学: <span className="text-primary font-bold">{pet.studentName}</span>
          </p>
          <div className="mt-1.5 inline-block text-[11px] font-bold px-2 py-0.5 bg-muted rounded-full">
            {stage === 'evo2' ? (
              <span className="text-amber-500">🌟 {evoName}</span>
            ) : stage === 'evo1' ? (
              <span className="text-blue-500">⚡ {evoName}</span>
            ) : (
              <span className="text-foreground/80">{evoName}</span>
            )}
          </div>
        </div>

        {/* Mini XP & Stats Indicators */}
        <div className="mt-5 pt-3 border-t border-dashed border-border/60">
          {/* XP Bar */}
          <div className="flex justify-between items-center text-[10px] text-foreground/50 font-bold mb-1">
            <span>XP 经验值</span>
            <span>{pet.xp} / {pet.xpToNext}</span>
          </div>
          <div className="w-full bg-muted h-3 rounded-full overflow-hidden border border-border/30">
            <motion.div
              className="bg-accent h-full"
              initial={{ width: 0 }}
              animate={{ width: `${(pet.xp / pet.xpToNext) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          {/* Micro Mini-Stats Bars */}
          <div className="grid grid-cols-3 gap-1.5 mt-3 text-[10px] font-extrabold">
            <div className="flex flex-col items-center p-1 rounded-lg bg-background border border-border/20">
              <span className="mb-0.5">😊的心情</span>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getMoodColorClass(pet.mood)}`}
                  style={{ width: `${pet.mood}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col items-center p-1 rounded-lg bg-background border border-border/20">
              <span className="mb-0.5">🍖饱食</span>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400"
                  style={{ width: `${pet.hunger}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col items-center p-1 rounded-lg bg-background border border-border/20">
              <span className="mb-0.5">⚡体力</span>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400"
                  style={{ width: `${pet.energy}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
