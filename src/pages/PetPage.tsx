import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { loadPets, addXp, feedPet, playWithPet, restPet, changeCostume, deletePet } from '../lib/petStore';
import { Pet, CostumeId, PET_CLASSES, getEvolutionStage, EVOLUTION_NAMES } from '../types/pet';
import { PetSprite } from '../components/PetSprite';
import { StatBar } from '../components/StatBar';
import { SpeechBubble } from '../components/SpeechBubble';
import { XpActions } from '../components/XpActions';
import { ArrowLeft, Sparkles, Smile, ShieldAlert, Award, Shirt, Heart, Drumstick, BedDouble, Trash2, Lock } from 'lucide-react';
import { getActiveRole, ClassroomRole } from '../lib/roleStore';

export const PetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [bubbleText, setBubbleText] = useState('今天我们一起好好表现，加油升级哦！');
  const [spriteAction, setSpriteAction] = useState<'none' | 'feed' | 'play' | 'rest'>('none');
  const [actionTimer, setActionTimer] = useState<NodeJS.Timeout | null>(null);

  // Celebration state for evolution
  const [showEvolutionCelebration, setShowEvolutionCelebration] = useState(false);
  const [celebratedEvoName, setCelebratedEvoName] = useState('');
  const [celebrationPreStage, setCelebrationPreStage] = useState<'base' | 'evo1'>('base');

  const [activeRole, setActiveRole] = useState<ClassroomRole>('parent');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRoleAlert, setShowRoleAlert] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    const allPets = loadPets();
    const found = allPets.find((p) => p.id === id);
    if (found) {
      setPet(found);
    } else {
      navigate('/404');
    }
  }, [id, navigate]);

  // Clean action timer on unmount
  useEffect(() => {
    return () => {
      if (actionTimer) clearTimeout(actionTimer);
    };
  }, [actionTimer]);

  if (!pet) return null;

  const petProfile = PET_CLASSES[pet.petType];
  const stage = getEvolutionStage(pet.level);
  const currentEvoName = EVOLUTION_NAMES[pet.petType][stage];

  // Evolution boundaries help
  const getEvoStatusDescription = () => {
    if (stage === 'base') {
      const lvLeft = 8 - pet.level;
      return `距离下阶段【觉醒形态】还差 ${lvLeft} 级`;
    }
    if (stage === 'evo1') {
      const lvLeft = 15 - pet.level;
      return `距离终极形态【传说形态】还差 ${lvLeft} 级`;
    }
    return '恭喜！已经达到顶级传说形态 🌟';
  };

  const getEvoProgressPercentage = () => {
    if (stage === 'base') {
      return (pet.level / 8) * 100;
    }
    if (stage === 'evo1') {
      return ((pet.level - 8) / (15 - 8)) * 100;
    }
    return 100;
  };

  // Run sprite temporary animations
  const triggerAction = (actionType: 'feed' | 'play' | 'rest', text: string) => {
    if (actionTimer) clearTimeout(actionTimer);
    setSpriteAction(actionType);
    setBubbleText(text);

    const timer = setTimeout(() => {
      setSpriteAction('none');
    }, 1800);
    setActionTimer(timer);
  };

  // Care actions handlers
  const handleFeed = () => {
    const updated = feedPet(pet.id);
    setPet(updated);
    triggerAction(
      'feed',
      updated.hunger > 90
        ? '啊唔，好饱好暖和！谢谢老师的爱心投喂～ 🍖'
        : '嗷呜！吧唧吧唧，食物真是世界上最好的魔法！✨'
    );
  };

  const handlePlay = () => {
    const updated = playWithPet(pet.id);
    setPet(updated);
    triggerAction(
      'play',
      updated.energy < 20
        ? '虽然有一点点累，但能和老师玩耍最欢脱啦！🌟'
        : '转个圈！耶～和小伙伴做游戏，心情超级棒！😆'
    );
  };

  const handleRest = () => {
    const updated = restPet(pet.id);
    setPet(updated);
    triggerAction('rest', '呼啊... 舒舒服服地打个瞌睡，精力正在恢复中 💤');
  };

  // Add academic or behavioral XP achievements
  const handleApplyXp = (amount: number, label: string) => {
    const result = addXp(pet.id, amount);
    setPet(result.pet);

    // Dialog messages for students rewarding
    const phrases: Record<string, string> = {
      完成作业: `哇！你认真完成了作业，我加了 ${amount} 经验，好开心呀！📚`,
      课堂表现: `上课精神饱满，发言积极！本宠物为你感到超级骄傲！⭐`,
      打卡签到: `好习惯在慢慢坚持呢，我们每天都在进步打底！🏃`,
      帮助同学: `热心的小帮手！宠物的爱心和经验都被你填满啦！💖`,
      考试进步: `考试取得了卓越进步！这是对勤奋刻苦最闪亮的加冕！🏆`,
    };

    const currentPhrase = phrases[label] || `获得奖励【${label}】+${amount} XP！我们又向升级迈进了一大步！`;

    // Check if pet evolved to a new stage
    const oldStage = getEvolutionStage(result.oldLevel);
    const newStage = getEvolutionStage(result.pet.level);

    if (result.levelUp && oldStage !== newStage) {
      setCelebratedEvoName(EVOLUTION_NAMES[pet.petType][newStage]);
      setCelebrationPreStage(oldStage);
      setShowEvolutionCelebration(true);
      setBubbleText(`哇啊啊！在你的精彩表现下，我不可思议地进化了！我的力量变强了！🔥`);
    } else if (result.levelUp) {
      triggerAction('play', `🎉 恭喜！宠物成功升到了 Lv.${result.pet.level}！我们越来越强大了！`);
    } else {
      triggerAction('play', currentPhrase);
    }
  };

  // Costume change handlers
  const handleCostumeChange = (costume: CostumeId) => {
    const updated = changeCostume(pet.id, costume);
    setPet(updated);
    if (costume === 'none') {
      setBubbleText('换回轻便的初始便装啦，随时准备出发探险！🧭');
    } else if (costume === 'costume1') {
      setBubbleText('换上了帅气的街头潮流装！戴好墨镜、反戴便帽，酷值拉满！😎');
    } else if (costume === 'costume2') {
      setBubbleText('哇，这是高贵的皇家华服！闪亮的宝石项链，我整只萌宠都在发光！✨');
    }
  };

  // Handle manual removal of adopted item
  const handleDelete = () => {
    if (activeRole !== 'parent') {
      setShowRoleAlert(true);
      return;
    }
    setShowDeleteConfirm(true);
  };

  return (
    <div className="min-h-screen pb-16 bg-background relative">
      {/* Dynamic background lights */}
      <div className="absolute top-10 left-[5%] w-36 h-36 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-[5%] w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top sticky-friendly simple banner config */}
      <nav className="max-w-7xl mx-auto px-4 pt-8 pb-4 flex items-center justify-between z-10 relative">
        <Link
          to="/"
          className="btn-push-white px-4 py-2 text-xs flex items-center gap-1.5"
          id="btn-back-home"
        >
          <ArrowLeft className="w-4 h-4 text-foreground/70" />
          <span>返回班级首页</span>
        </Link>

        <button
          onClick={handleDelete}
          className="px-3.5 py-2 border-2 border-dashed border-rose-300 hover:bg-rose-50 hover:border-rose-400 text-rose-500 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>删除/放归宠物</span>
        </button>
      </nav>

      {/* Primary detail container split in columns */}
      <main className="max-w-7xl mx-auto px-4 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
        {/* Left column: Large illustration sprite + Care triggers + Wardrobe wardrobe items */}
        <section className="lg:col-span-5 flex flex-col gap-6 align-stretch">
          <div className="bg-card card-flat p-6 flex flex-col items-center justify-between min-h-[380px] relative">
            
            {/* Speach bubble */}
            <div className="w-full mb-2 min-h-[50px] flex items-center justify-center">
              <SpeechBubble text={bubbleText} visible={true} arrowPosition="bottom" className="w-full max-w-[280px]" />
            </div>

            {/* Render big dynamic SVG sprite */}
            <div className="relative my-4 flex items-center justify-center h-48 w-full">
              {/* Spinning background rays for fun mood */}
              {pet.mood > 85 && (
                <div className="absolute inset-0 bg-radial from-amber-100/40 to-transparent rounded-full blur-md scale-75 animate-spin-slow pointer-events-none" />
              )}
              <PetSprite
                type={pet.petType}
                level={pet.level}
                costume={pet.activeCostume}
                mood={pet.mood}
                hunger={pet.hunger}
                energy={pet.energy}
                action={spriteAction}
                size="xl"
              />
            </div>

            {/* Custom interactive Care Buttons Row */}
            <div className="w-full border-t border-dashed border-border/60 pt-4 mt-2">
              <div className="grid grid-cols-3 gap-2.5">
                <motion.button
                  onClick={handleFeed}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-push-white py-2 flex flex-col items-center gap-1 select-none cursor-pointer"
                >
                  <Drumstick className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-black">喂食 (hunger)</span>
                </motion.button>

                <motion.button
                  onClick={handlePlay}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-push-white py-2 flex flex-col items-center gap-1 select-none cursor-pointer"
                >
                  <Smile className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-black">玩耍 (mood)</span>
                </motion.button>

                <motion.button
                  onClick={handleRest}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-push-white py-2 flex flex-col items-center gap-1 select-none cursor-pointer"
                >
                  <BedDouble className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-black">休息 (sleep)</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Dynamic Wardrobe Item unlock criteria */}
          <div className="bg-card card-flat p-5">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 mb-4">
              <Shirt className="w-4 h-4 text-primary" />
              <span>👕 萌宠衣橱 (Unlocked Wardrobe)</span>
            </h3>

            <div className="flex flex-col gap-3">
              {/* Conditional lock disclaimer */}
              {stage !== 'base' && (
                <div className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  💡 宠物已进化！在【觉醒/传说形态】下，神奇的进化力量将使常态服饰隐形哦。
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {/* Costume 1: None (always open) */}
                <button
                  onClick={() => handleCostumeChange('none')}
                  className={`p-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 cursor-pointer select-none transition-all ${
                    pet.activeCostume === 'none'
                      ? 'border-primary bg-primary/10 text-primary-dark font-extrabold ring-2 ring-primary/40'
                      : 'border-border/60 hover:bg-muted'
                  }`}
                >
                  <span className="text-lg">🍃</span>
                  <span>初始便装</span>
                </button>

                {/* Costume 2: Costume1 (Lv5 required) */}
                <button
                  disabled={pet.level < 5}
                  onClick={() => handleCostumeChange('costume1')}
                  className={`p-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 select-none transition-all ${
                    pet.level < 5
                      ? 'border-dashed border-border bg-stone-100 text-stone-400 cursor-not-allowed opacity-60'
                      : pet.activeCostume === 'costume1'
                      ? 'border-primary bg-primary/10 text-primary-dark font-extrabold ring-2 ring-primary/40'
                      : 'border-border/60 hover:bg-muted cursor-pointer'
                  }`}
                >
                  <span className="text-lg">{pet.level < 5 ? '🔒' : '🧢'}</span>
                  <span>潮流装 (Lv.5)</span>
                </button>

                {/* Costume 3: Costume2 (Lv10 required) */}
                <button
                  disabled={pet.level < 10}
                  onClick={() => handleCostumeChange('costume2')}
                  className={`p-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 select-none transition-all ${
                    pet.level < 10
                      ? 'border-dashed border-border bg-stone-100 text-stone-400 cursor-not-allowed opacity-60'
                      : pet.activeCostume === 'costume2'
                      ? 'border-primary bg-primary/10 text-primary-dark font-extrabold ring-2 ring-primary/40'
                      : 'border-border/60 hover:bg-muted cursor-pointer'
                  }`}
                >
                  <span className="text-lg">{pet.level < 10 ? '🔒' : '👑'}</span>
                  <span>皇家装 (Lv.10)</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right column: Status bars, progression, action logs, awards ledger */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-card card-flat p-6 flex flex-col gap-6">
            {/* Title / Class student info banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-dashed border-border gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-1 mb-0.5">
                  {petProfile.icon} {petProfile.name}
                </span>
                <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
                  <span>{pet.petName}</span>
                </h1>
                <p className="text-xs text-foreground/60 font-semibold mt-1">
                  认养契约学生：<span className="text-primary font-black bg-primary/10 px-2 py-0.5 rounded-md">{pet.studentName}</span>
                </p>
              </div>

              {/* Status form shape details badge */}
              <div className="flex flex-col items-start sm:items-end">
                <div className="inline-flex items-center gap-1 font-extrabold text-sm px-3.5 py-1.5 rounded-full bg-accent/20 border border-accent">
                  {stage === 'evo2' ? (
                    <span className="text-rose-500">🌟 {currentEvoName}</span>
                  ) : stage === 'evo1' ? (
                    <span className="text-blue-500">⚡ {currentEvoName}</span>
                  ) : (
                    <span className="text-stone-700">🌱 {currentEvoName}</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-foreground/40 mt-1 max-w-[190px] leading-tight text-left sm:text-right">
                  Lv.1 base ➔ Lv.8 觉醒 ➔ Lv.15 传说
                </span>
              </div>
            </div>

            {/* Level progression bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-3 flex flex-col items-center justify-center p-3 rounded-2xl bg-accent/10 border-2 border-accent">
                <Award className="w-8 h-8 text-accent fill-accent/10" />
                <span className="text-xs font-bold text-foreground/60 mt-1">当前等级</span>
                <span className="text-2xl font-black text-foreground mt-0.5">Lv.{pet.level}</span>
              </div>

              <div className="md:col-span-9 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-extrabold text-foreground/80">
                  <span className="flex items-center gap-1">💪 升级经验 (XP Progress)</span>
                  <span className="font-mono text-xs">{pet.xp} / {pet.xpToNext} XP</span>
                </div>
                <div className="w-full bg-muted h-5 rounded-full overflow-hidden border-2 border-border/80 relative flex items-center p-0.5">
                  <motion.div
                    className="bg-accent h-full rounded-md shadow-inner"
                    initial={{ width: 0 }}
                    animate={{ width: `${(pet.xp / pet.xpToNext) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                </div>
                <p className="text-[11px] font-bold text-foreground/50 mt-0.5">
                  ✨ 奖励奖励：可通过下方动作记功！积满 100 经验立即升级！
                </p>
              </div>
            </div>

            {/* Evolution path tracking */}
            <div className="bg-background border-2 border-border/80 rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-black text-foreground/75">
                <span className="flex items-center gap-1">⚡ 演变之力 (Evolution Path)</span>
                <span>{getEvoStatusDescription()}</span>
              </div>
              <div className="w-full bg-muted h-3 rounded-full overflow-hidden border border-border/40">
                <div
                  className="bg-secondary h-full rounded-full"
                  style={{ width: `${getEvoProgressPercentage()}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-foreground/40 mt-0.5">
                <span>育种 (Lv.1 Base)</span>
                <span>觉醒 (Lv.8 Evo.1)</span>
                <span>传说 (Lv.15 Evo.2)</span>
              </div>
            </div>

            {/* Details sliders bars of three state levels */}
            <div className="flex flex-col gap-3 pt-2">
              <h3 className="font-extrabold text-sm text-foreground/90 flex items-center gap-1 px-1">
                <span>😊 宠物生活状态指数</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-background/50 border border-border/40 rounded-2xl p-4">
                <StatBar
                  label="心情指数"
                  value={pet.mood}
                  icon="😊"
                  colorClass="bg-gradient-to-r from-emerald-400 to-emerald-500"
                />
                <StatBar
                  label="饱食度"
                  value={pet.hunger}
                  icon="🍖"
                  colorClass="bg-gradient-to-r from-orange-400 to-orange-500"
                />
                <StatBar
                  label="精力体力"
                  value={pet.energy}
                  icon="⚡"
                  colorClass="bg-gradient-to-r from-indigo-400 to-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Academic reward buttons component */}
          <div className={`bg-card card-flat p-5 relative transition-all ${activeRole === 'student' ? 'border-amber-300 bg-amber-50/20' : ''}`}>
            {activeRole === 'student' && (
              <div className="xl:absolute xl:top-4 xl:right-4 mb-3 xl:mb-0 flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-stone-900 font-extrabold text-[11px] rounded-lg shadow-sm">
                <Lock className="w-3.5 h-3.5" />
                <span>学生自助模式 · 课堂表现奖励已锁定</span>
              </div>
            )}
            <XpActions 
              onApplyXp={handleApplyXp} 
              disabled={activeRole === 'student'} 
            />
            {activeRole === 'student' && (
              <div className="mt-4 text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2">
                <span>🔒 提示：</span>
                <span>当前处于学生自助模式下，课堂记功表现加分已上锁。如果要加分，请请家长或老师点击页面顶端控制栏，解锁家长/教师模式。</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Evolution grand full screen portal celebrating animation */}
      <AnimatePresence>
        {showEvolutionCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 pointer-events-auto"
          >
            {/* Spinning space dynamic particles inside backdrop */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent opacity-80" />
              {/* Rotating Star backdrop */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 flex items-center justify-center opacity-30 scale-150"
              >
                <div className="w-96 h-96 border-4 border-dashed border-accent rounded-full" />
                <div className="w-128 h-128 border-2 border-dotted border-primary rounded-full absolute" />
              </motion.div>
            </div>

            <motion.div
              initial={{ scale: 0.6, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.6, y: 50, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 24,
              }}
              className="bg-card border-4 border-accent rounded-3xl p-8 max-w-lg w-full text-center relative z-10 shadow-[0_20px_50px_rgba(251,191,36,0.3)]"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-accent p-4 rounded-full border-4 border-card shadow-lg">
                <Sparkles className="w-10 h-10 text-foreground" />
              </div>

              <div className="mt-8">
                <span className="text-xs font-black uppercase text-accent tracking-wider bg-accent/20 px-3 py-1 rounded-full border border-accent/40">
                  ✨ 神秘进化之光照耀 ✨
                </span>
                <h2 className="text-3xl font-black text-foreground mt-4 leading-tight">
                  恭喜！您的宠物进化了！
                </h2>
                <p className="text-sm font-semibold text-foreground/75 mt-2">
                  因为同学的超凡表现，【{pet.petName}】吸纳了天地灵气...
                </p>
              </div>

              {/* Central Bouncing Evolution Comparison Frame */}
              <div className="my-8 py-6 rounded-2xl bg-muted/60 border border-border/40 flex items-center justify-around relative">
                {/* Pre evolutionary state */}
                <div className="flex flex-col items-center opacity-65">
                  <span className="text-xs font-bold text-foreground/50 mb-1">
                    {celebrationPreStage === 'base' ? '初始状态' : '觉醒状态'}
                  </span>
                  <div className="w-20 h-20 bg-background/50 border border-border/20 rounded-full flex items-center justify-center p-2 opacity-60">
                    <PetSprite
                      type={pet.petType}
                      level={celebrationPreStage === 'base' ? 1 : 8}
                      size="md"
                    />
                  </div>
                  <span className="text-xs font-black text-foreground mt-1.5">
                    {celebrationPreStage === 'base' ? '小萌物' : '觉醒形态'}
                  </span>
                </div>

                {/* Big arrow pointing */}
                <span className="text-3xl font-black text-accent animate-pulse">➔</span>

                {/* Post evolutionary state */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-black text-accent mb-1 animate-bounce">
                    🌟 进化形态 🌟
                  </span>
                  <motion.div
                    animate={{
                      scale: [1, 1.15, 1],
                      rotate: [0, -4, 4, 0],
                    }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-24 h-24 bg-accent/10 border-2 border-accent rounded-full flex items-center justify-center p-2"
                  >
                    <PetSprite
                      type={pet.petType}
                      level={pet.level}
                      size="lg"
                    />
                  </motion.div>
                  <span className="text-sm font-black text-primary-dark mt-1.5 flex items-center gap-1">
                    {celebratedEvoName}
                  </span>
                </div>
              </div>

              <div className="text-center font-semibold text-xs text-foreground/60 leading-relaxed px-2">
                进化形态将提供更炫酷的自带效果（羽翼、皇冠、光环特效），更强大的萌宠将持续作为你的好伙伴，为你加油打气！
              </div>

              <button
                onClick={() => setShowEvolutionCelebration(false)}
                className="btn-push-accent py-3 w-full text-sm font-black mt-6"
              >
                🎉 耶！我们太棒啦！
              </button>
            </motion.div>
          </motion.div>
        )}

        {showRoleAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-card w-full max-w-sm border-3 border-stone-800 rounded-2xl p-6 relative shadow-2xl text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-foreground">🔒 权限受限提示</h3>
              <p className="text-xs font-bold text-foreground/75 mt-3 leading-relaxed">
                安全提示：放归或删除宠物是教师与家长的特权操作哦！小同学请不要随便放归我们的小萌宠。
              </p>
              <button
                onClick={() => setShowRoleAlert(false)}
                className="btn-push py-2.5 w-full text-xs text-stone-950 font-black mt-6 cursor-pointer"
              >
                知道啦！🎒
              </button>
            </motion.div>
          </motion.div>
        )}

        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-card w-full max-w-md border-3 border-stone-800 rounded-2xl p-6 relative shadow-2xl text-center flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-foreground">🚨 确认删除与放归宠物</h3>
              <p className="text-xs font-semibold text-foreground/75 mt-2 leading-relaxed">
                你确定要删除并放归这只萌宠【<strong className="text-rose-600">{pet?.petName}</strong>】（得主：{pet?.studentName}）吗？
              </p>
              <p className="text-[11px] font-bold text-rose-500 mt-2 bg-rose-50 p-2 rounded-xl border border-rose-200">
                ⚠️ 注意：此操作将会永久抹除该宠物的所有成长历史、当前进度等级、穿戴配饰和各项属性，放归后无法挽回！
              </p>

              <div className="grid grid-cols-2 gap-3.5 w-full mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-push-white py-2.5 text-xs font-black cursor-pointer"
                >
                  取消放归
                </button>
                <button
                  onClick={() => {
                    if (pet) {
                      deletePet(pet.id);
                      setShowDeleteConfirm(false);
                      navigate('/');
                    }
                  }}
                  className="btn-push py-2.5 text-xs text-white bg-rose-500 hover:bg-rose-600 font-black cursor-pointer"
                >
                  确定放归
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default PetPage;
