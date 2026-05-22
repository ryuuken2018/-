import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PetType, PET_CLASSES, CostumeId, EvolutionStage } from '../types/pet';
import { PetSprite } from './PetSprite';
import { X } from 'lucide-react';

interface AddPetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdopt: (studentName: string, petName: string, type: PetType) => void;
}

export const AddPetDialog: React.FC<AddPetDialogProps> = ({
  isOpen,
  onClose,
  onAdopt,
}) => {
  const [studentName, setStudentName] = useState('');
  const [petName, setPetName] = useState('');
  const [selectedType, setSelectedType] = useState<PetType>('cat');
  const [errorMsg, setErrorMsg] = useState('');

  const petOptions: { type: PetType; label: string; icon: string }[] = [
    { type: 'cat', label: '小猫咪', icon: '🐱' },
    { type: 'dog', label: '小狗狗', icon: '🐶' },
    { type: 'rabbit', label: '小兔兔', icon: '🐰' },
    { type: 'hamster', label: '小仓鼠', icon: '🐹' },
    { type: 'bird', label: '小鸟儿', icon: '🐦' },
    { type: 'turtle', label: '小乌龟', icon: '🐢' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMsg('请输入学生姓名哦！');
      return;
    }
    if (!petName.trim()) {
      setErrorMsg('起个可爱的宠物昵称吧！');
      return;
    }

    onAdopt(studentName.trim(), petName.trim(), selectedType);
    
    // Reset fields
    setStudentName('');
    setPetName('');
    setSelectedType('cat');
    setErrorMsg('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900 pointer-events-auto"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            className="relative bg-card card-flat w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto pointer-events-auto z-10"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-muted border border-transparent hover:border-border transition-all cursor-pointer"
            >
              <X className="w-5 h-5 text-foreground/50" />
            </button>

            {/* Header */}
            <div className="text-center mb-5">
              <span className="text-4xl">🐣</span>
              <h2 className="text-2xl font-black text-foreground mt-2">认养新的小萌宠</h2>
              <p className="text-xs text-foreground/60 font-semibold mt-1">
                为班级里的学生挑选一位可爱的成长伙伴吧
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Row 1: Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-foreground/80 flex items-center gap-1">
                    👤 学生姓名 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：王小明"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full text-sm font-bold bg-muted/50 border-2 border-border focus:border-primary px-3 py-2.5 rounded-xl outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-foreground/80 flex items-center gap-1">
                    🏷️ 宠物昵称 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：小橙子"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    className="w-full text-sm font-bold bg-muted/50 border-2 border-border focus:border-primary px-3 py-2.5 rounded-xl outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Grid selectors */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-foreground/80">
                  🐾 选择萌宠品种 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {petOptions.map((opt) => {
                    const isSelected = selectedType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setSelectedType(opt.type)}
                        className={`group relative p-3 border-2 rounded-xl transition-all flex flex-col items-center gap-2 cursor-pointer select-none ${
                          isSelected
                            ? 'border-primary bg-primary/15 ring-2 ring-primary'
                            : 'border-border/60 hover:bg-muted/40 hover:border-border'
                        }`}
                      >
                        <div className="w-12 h-12 flex items-center justify-center">
                          {/* Cute Preview Grid of Sprite */}
                          <PetSprite
                            type={opt.type}
                            level={1}
                            size="sm"
                            className="group-hover:scale-110 transition-transform"
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          {opt.label} {opt.icon}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-3 py-2 rounded-lg text-center animate-shake">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-dashed border-border/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-push-white py-2.5 text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-push py-2.5 text-sm"
                >
                  🎉 确认认养
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
