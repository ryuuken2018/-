import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { loadPets, savePets } from '../lib/petStore';
import { Pet, PET_CLASSES, getEvolutionStage, EVOLUTION_NAMES } from '../types/pet';
import { PetSprite } from '../components/PetSprite';
import { SpeechBubble } from '../components/SpeechBubble';
import { 
  ArrowLeft, 
  Trophy, 
  Play, 
  RotateCcw, 
  UserPlus, 
  Gauge, 
  Zap, 
  Smile, 
  TrendingUp, 
  Flame,
  Volume2,
  Info,
  ChevronRight,
  ShieldCheck,
  Check,
  Award
} from 'lucide-react';

interface Runner {
  pet: Pet;
  isAI: boolean;
  aiName?: string;
  speedPower: number; // calculated speed baseline
  progress: number;    // 0 to 100
  finished: boolean;
  finishTime?: number;
  rank?: number;
  eventText?: string;  // e.g. "🏃‍♂️ 冲锋", "🍌 踩香蕉"
  eventTimer?: number;  // seconds to display event decoration
  aiQuote?: string;     // Realtime thoughts
}

// Custom AI Competitors
const CHOOSEABLE_AI_OPPONENTS: Partial<Pet>[] = [
  {
    id: 'ai-1',
    studentName: '🤖 电脑小助手',
    petName: '小乌龟博尔特',
    petType: 'turtle',
    level: 6,
    mood: 95,
    hunger: 90,
    energy: 95,
  },
  {
    id: 'ai-2',
    studentName: '🤖 电脑小助手',
    petName: '狂飙哈士奇',
    petType: 'dog',
    level: 10,
    mood: 85,
    hunger: 70,
    energy: 90,
  },
  {
    id: 'ai-3',
    studentName: '🤖 电脑小助手',
    petName: '魔法闪电兔',
    petType: 'rabbit',
    level: 12,
    mood: 75,
    hunger: 60,
    energy: 85,
  },
  {
    id: 'ai-4',
    studentName: '🤖 电脑小助手',
    petName: '旋风战斗猫',
    petType: 'cat',
    level: 15,
    mood: 100,
    hunger: 90,
    energy: 95,
  },
  {
    id: 'ai-5',
    studentName: '🤖 电脑小助手',
    petName: '高空音速雀',
    petType: 'bird',
    level: 8,
    mood: 60,
    hunger: 55,
    energy: 100,
  }
];

export const Race: React.FC = () => {
  const navigate = useNavigate();
  const [allPets, setAllPets] = useState<Pet[]>([]);
  
  // Selection Screen States
  const [selectedPets, setSelectedPets] = useState<Pet[]>([]);
  const [isRaceStarted, setIsRaceStarted] = useState(false);
  const [isRacingActive, setIsRacingActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Running Tracks States
  const [runners, setRunners] = useState<Runner[]>([]);
  const [podium, setPodium] = useState<Runner[]>([]);
  const [raceLogs, setRaceLogs] = useState<string[]>([]);
  const [xpUpdateSummary, setXpUpdateSummary] = useState<string[]>([]);
  const [levelUpDetails, setLevelUpDetails] = useState<{name: string, oldLvl: number, newLvl: number}[]>([]);

  // Simulation Tick Reference
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const prevFinishedIdsRef = useRef<Set<string>>(new Set());
  const hasUpdatedDbRef = useRef<boolean>(false);

  // Monitor runners to add finish logs dynamically exactly once per runner
  useEffect(() => {
    if (!isRaceStarted) {
      prevFinishedIdsRef.current = new Set();
      return;
    }

    const newlyFinished: Runner[] = [];
    runners.forEach(r => {
      if (r.finished && !prevFinishedIdsRef.current.has(r.pet.id)) {
        newlyFinished.push(r);
        prevFinishedIdsRef.current.add(r.pet.id);
      }
    });

    if (newlyFinished.length > 0) {
      // Sort newly finished in case multiple finished in the same tick frame
      const sorted = [...newlyFinished].sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0));
      setRaceLogs(prev => {
        const nextLogs = [...prev];
        sorted.forEach(ff => {
          const medal = ff.rank === 1 ? '🥇' : ff.rank === 2 ? '🥈' : ff.rank === 3 ? '🥉' : '🎗️';
          const logMsg = `✨ [${ff.pet.studentName} 的 ${ff.pet.petName}] 耗时 ${ff.finishTime?.toFixed(2)}s 夺得了第 ${ff.rank} 名！${medal}`;
          if (!nextLogs.includes(logMsg)) {
            nextLogs.push(logMsg);
          }
        });
        return nextLogs;
      });
    }
  }, [runners, isRaceStarted]);

  // Monitor runners to execute DB updates and end game state exactly ONCE
  useEffect(() => {
    if (!isRaceStarted) {
      hasUpdatedDbRef.current = false;
      return;
    }

    if (runners.length > 0 && runners.every(r => r.finished) && !hasUpdatedDbRef.current) {
      hasUpdatedDbRef.current = true;
      
      // Stop the interval
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
        gameIntervalRef.current = null;
      }
      setIsRacingActive(false);

      // Set final podium list
      const finalPodium = [...runners].sort((a, b) => (a.rank || 99) - (b.rank || 99));
      setPodium(finalPodium);

      handlePostRaceUpdates(finalPodium);
    }
  }, [runners, isRaceStarted]);

  // Load pets on launch
  useEffect(() => {
    setAllPets(loadPets());
  }, []);

  // Compute Speed Power for a given pet
  // Formula: (Level * 5) + (Energy * 0.45) + (Mood * 0.25) + (Hunger * 0.2)
  const calculateSpeedPower = (pet: Pet): number => {
    const levelContrib = pet.level * 4;
    const energyContrib = pet.energy * 0.45;
    const moodContrib = pet.mood * 0.25;
    const hungerContrib = pet.hunger * 0.2;
    return Math.round(levelContrib + energyContrib + moodContrib + hungerContrib);
  };

  // Toggle selecting a classroom pet
  const handleTogglePet = (pet: Pet) => {
    // Check if pet already selected
    if (selectedPets.some(p => p.id === pet.id)) {
      setSelectedPets(prev => prev.filter(p => p.id !== pet.id));
      return;
    }

    const totalXp = (pet.level - 1) * 100 + pet.xp;
    if (totalXp < 12) {
      alert(`🚫 【${pet.petName}】的累计经验值不足 12 点（目前仅有 ${totalXp} 点），无法报名参加比赛！快去照顾它、进行互动来获取经验值吧 ✨`);
      return;
    }

    // Energy guard - Warn but allow participation if they really want,
    // though the speed power will be lower!
    if (pet.energy < 20) {
      if (!window.confirm(`⚠️ 【${pet.petName}】的体力已经低于 20% (${pet.energy}%)。虽然可以参赛，但在缺少体力的情况下会跑得很慢哦！确定让它参赛吗？`)) {
        return;
      }
    }

    if (selectedPets.length >= 4) {
      alert('🚫 为了赛道安全，单次跑步比赛最多只能派出 4 只萌宠进行竞速哦！');
      return;
    }

    setSelectedPets(prev => [...prev, pet]);
  };

  // Auto pick AI competitors to fill race tracks
  const handleFillWithAI = () => {
    if (selectedPets.length >= 4) {
      alert('赛道已经排满啦，无需增加AI小选手！');
      return;
    }

    // Filter out pets we already selected so no duplication
    const currentAIPetNames = selectedPets.map(p => p.petName);
    const availableAI = CHOOSEABLE_AI_OPPONENTS.filter(ai => !currentAIPetNames.includes(ai.petName || ''));

    if (availableAI.length === 0) return;

    // Pick a random AI
    const randomIdx = Math.floor(Math.random() * availableAI.length);
    const chosenAI = availableAI[randomIdx] as Pet;

    // Generate unique ID
    const aiId = `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const freshAI: Pet = {
      ...chosenAI,
      id: aiId,
    };

    setSelectedPets(prev => [...prev, freshAI]);
  };

  const handleClearSelection = () => {
    setSelectedPets([]);
  };

  // Set up and initiate the running race countdown!
  const handleStartRaceSetup = () => {
    if (selectedPets.length < 2) {
      alert('👉 跑步比赛至少需要 2 只萌宠才能进行速度抗衡哦！请认养多只宠物，或点击右上角的【➕ 增加电脑AI高手】来进行配对！');
      return;
    }

    // Load newest records first to make sure state is synchronized
    const currentClassPets = loadPets();
    const updatedPets = [...currentClassPets];
    
    // First validation pass to make sure they still have enough XP
    for (const p of selectedPets) {
      if (p.id.startsWith('ai-')) continue;
      const dbPet = updatedPets.find(cp => cp.id === p.id);
      if (!dbPet) continue;
      const totalXp = (dbPet.level - 1) * 100 + dbPet.xp;
      if (totalXp < 12) {
        alert(`🚫 【${dbPet.petName}】的累计经验值不足 12 点（当前只有 ${totalXp} 点），无法支付报名比赛需要的 12 经验！`);
        return;
      }
    }

    // Deduct 12 XP from participating classroom pets
    const deductedSelectedPets = selectedPets.map(p => {
      if (p.id.startsWith('ai-')) return p;
      const idx = updatedPets.findIndex(cp => cp.id === p.id);
      if (idx === -1) return p;

      const pet = { ...updatedPets[idx] };
      let totalXp = (pet.level - 1) * 100 + pet.xp;
      totalXp = Math.max(0, totalXp - 12);
      
      const newLevel = Math.floor(totalXp / 100) + 1;
      const newXp = totalXp % 100;
      
      pet.level = newLevel;
      pet.xp = newXp;
      
      updatedPets[idx] = pet;
      return pet;
    });

    // Save back to storage
    savePets(updatedPets);
    // Reload state pools so other UI elements and states are updated
    setAllPets(updatedPets);
    setSelectedPets(deductedSelectedPets);

    // Initialize Runners
    const initialRunners: Runner[] = deductedSelectedPets.map(p => {
      const sp = calculateSpeedPower(p);
      const isAI = p.id.startsWith('ai-');
      return {
        pet: p,
        isAI,
        aiName: isAI ? p.studentName : undefined,
        speedPower: sp,
        progress: 0,
        finished: false,
        aiQuote: '赛前热身中，目标是第一！🏆',
      };
    });

    prevFinishedIdsRef.current = new Set();
    hasUpdatedDbRef.current = false;

    setRunners(initialRunners);
    setPodium([]);
    
    // Construct race entrance logs with XP deductions
    const entranceXpLogs = deductedSelectedPets
      .filter(p => !p.id.startsWith('ai-'))
      .map(p => `💸 【${p.petName}】已支付 12 点经验值（XP）报名参赛！`);

    setRaceLogs([
      '🏁 滴！萌宠运动员已进入跑道就位，全神贯注！',
      ...entranceXpLogs
    ]);
    setXpUpdateSummary([]);
    setLevelUpDetails([]);
    setIsRaceStarted(true);
    
    // Begin 3, 2, 1 Countdown
    setCountdown(3);
  };

  // Handle countdown tick down
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Start the racing tick!
      const timer = setTimeout(() => {
        setCountdown(null);
        setIsRacingActive(true);
        startTimeRef.current = Date.now();
        startRaceTickEngine();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Main Race Loop Engine
  const startRaceTickEngine = () => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);

    gameIntervalRef.current = setInterval(() => {
      setRunners(prevRunners => {
        const timePassedSinceStart = (Date.now() - startTimeRef.current) / 1000;
        let anyRunnerJustFinished = false;

        // Clone and loop update states
        const nextRunners = prevRunners.map(runner => {
          if (runner.finished) return runner;

          // Compute base speed tick contribution
          // Gentler movement speeds to ensure a comfortable 12-15 second race so users can read bubbles and enjoy animations!
          const powerFactor = runner.speedPower * 0.0035; 
          const randomStep = Math.random() * 0.45;
          let delta = 0.2 + powerFactor + randomStep;

          // Event system: 2% chance of triggering random running events per tick
          let event = runner.eventText;
          let eventTime = runner.eventTimer || 0;
          let quote = runner.aiQuote;

          // Decrease event timer slowly
          if (eventTime > 0) {
            eventTime -= 0.12;
            if (eventTime <= 0) {
              event = undefined;
              // Clear previous intense comments when event is done
              if (quote && !quote.includes('热身')) {
                quote = undefined;
              }
            }
          }

          if (Math.random() < 0.02 && eventTime <= 0) {
            // Trigger randomized running event
            const eventDice = Math.random();
            if (eventDice < 0.2) {
              event = '🏃‍♂️ 突然加速! (+50% 爆发)';
              delta *= 1.7;
              eventTime = 2.5;
              const quotes = ['这就是我的全速！🌪️', '看我的火箭喷射！🚀', '感觉要飞起来啦！✨'];
              quote = quotes[Math.floor(Math.random() * quotes.length)];
            } else if (eventDice < 0.35 && runner.pet.petType === 'turtle') {
              event = '🐢 乌龟爆发! (毅力无限)';
              delta += 1.0;
              eventTime = 3.0;
              quote = '慢中生巧，冲冲冲！🐢';
            } else if (eventDice < 0.45) {
              event = '🍌 踩到香蕉皮! (-50% 减速)';
              delta *= 0.4;
              eventTime = 3.0;
              quote = '哎呀，是谁扔的香蕉皮啊！😭';
            } else if (eventDice < 0.6) {
              event = '🍖 没吃饱犯困... (-30% 疲累)';
              delta *= 0.6;
              eventTime = 2.8;
              quote = '肚子好像饿了，跑不太动... 🛌';
            } else if (eventDice < 0.75) {
              event = '✨ 魔法流星! (+0.9 冲刺)';
              delta += 0.9;
              eventTime = 2.4;
              quote = '感觉身上充满了魔法能量！🌟';
            } else {
              // Casual runner comments (stay on screen for some time too)
              const basicQuotes = ['冲呀冲呀！🍗', '第一名写着我的名字！🏆', '加油，跑跑跑！', '好累但一定要坚持！'];
              quote = basicQuotes[Math.floor(Math.random() * basicQuotes.length)];
              eventTime = 2.5; // Let the casual text stay shown for 2.5 seconds
            }
          }

          // Apply and caps
          let nextProgress = runner.progress + delta;
          let finished = false;
          let fTime = runner.finishTime;

          if (nextProgress >= 100) {
            nextProgress = 100;
            finished = true;
            fTime = timePassedSinceStart;
            anyRunnerJustFinished = true;
            event = '🏁 已冲线！';
            eventTime = 4.0;
            quote = '耶！终于冲过终点线啦！🎉';
          }

          return {
            ...runner,
            progress: nextProgress,
            finished,
            finishTime: fTime,
            eventText: event,
            eventTimer: eventTime,
            aiQuote: quote,
          };
        });

        // Determine ranking if any finished
        // Collect all non-empty finishTimes to find existing ranks count
        const finishedRunners = nextRunners.filter(r => r.finished);
        
        // Sort finished runners by finish time to assign ranks sequentially
        // If a runner finished before but already has a rank, maintain it.
        const sortedFinished = [...finishedRunners].sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0));
        
        // Assign ranks (1, 2, 3...) based on sorted order
        const rankedRunners = nextRunners.map(r => {
          if (r.finished) {
            const indexOnPodium = sortedFinished.findIndex(sf => sf.pet.id === r.pet.id);
            return {
              ...r,
              rank: indexOnPodium + 1
            };
          }
          return r;
        });

        // Side effects are reactively handled in useEffect hooks above
        return rankedRunners;
      });
    }, 120);
  };

  // Apply actual DB updates
  const handlePostRaceUpdates = (finalPodium: Runner[]) => {
    // Reload newest records first
    const currentClassPets = loadPets();
    const updatedPets = [...currentClassPets];

    const xpLogs: string[] = [];
    const lvlChanges: {name: string, oldLvl: number, newLvl: number}[] = [];

    finalPodium.forEach(runner => {
      // Don't update AI robots
      if (runner.isAI) return;

      const idx = updatedPets.findIndex(p => p.id === runner.pet.id);
      if (idx === -1) return;

      const pet = { ...updatedPets[idx] };
      const oldLevel = pet.level;

      // Base XP rewards allocation
      // 1st place: +20 XP. 2nd: +12 XP. Others: +8 XP.
      let xpBonus = 8;
      if (runner.rank === 1) xpBonus = 20;
      else if (runner.rank === 2) xpBonus = 12;

      // Stat depletion: PARTICIPATION is tiring!
      // Consumes 15 energy, and 10 hunger points.
      // Clamped slightly so they don't hit absolute zero unless they starte already low, keeping them alive
      const energyDepletion = 15;
      const hungerDepletion = 10;
      
      pet.energy = Math.max(5, pet.energy - energyDepletion);
      pet.hunger = Math.max(5, pet.hunger - hungerDepletion);
      pet.mood = Math.max(10, Math.min(100, pet.mood + 5)); // Racing is exciting! Slightly boosts mood (+5)

      // Apply XP and checks level up
      let newXp = pet.xp + xpBonus;
      let newLevel = pet.level;

      // 100 XP per level
      while (newXp >= 100) {
        newXp -= 100;
        newLevel += 1;
      }

      pet.xp = newXp;
      pet.level = newLevel;

      // Update in our array
      updatedPets[idx] = pet;

      // Log results
      const medal = runner.rank === 1 ? '🥇' : runner.rank === 2 ? '🥈' : runner.rank === 3 ? '🥉' : '🎗️';
      xpLogs.push(
        `👤 ${pet.studentName} 的 【${pet.petName}】 (${medal}第${runner.rank}名): 获得 +${xpBonus} XP 经验！体力-${energyDepletion}%, 饱腹度-${hungerDepletion}%`
      );

      if (newLevel > oldLevel) {
        lvlChanges.push({
          name: pet.petName,
          oldLvl: oldLevel,
          newLvl: newLevel
        });
      }
    });

    // Save back to LocalStorage & dispatch reload events
    savePets(updatedPets);
    setXpUpdateSummary(xpLogs);
    setLevelUpDetails(lvlChanges);
  };

  // Terminate any active tickers on unmount
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, []);

  const handleResetRaceAll = () => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    prevFinishedIdsRef.current = new Set();
    hasUpdatedDbRef.current = false;
    setIsRaceStarted(false);
    setIsRacingActive(false);
    setCountdown(null);
    setRunners([]);
    setPodium([]);
    setRaceLogs([]);
    setXpUpdateSummary([]);
    setLevelUpDetails([]);
  };

  // Helper colors for status values
  const getRatingBadgeColor = (val: number) => {
    if (val >= 110) return 'text-orange-500 bg-orange-50 border-orange-200';
    if (val >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 50) return 'text-blue-500 bg-blue-50 border-blue-250';
    return 'text-rose-500 bg-rose-50 border-rose-200';
  };

  return (
    <div className="min-h-screen pb-16 bg-background">
      {/* Header bar section */}
      <header className="max-w-7xl mx-auto px-4 pt-10 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 z-10 relative">
        <div className="flex flex-col">
          <Link
            to="/"
            className="text-xs font-black text-primary hover:underline flex items-center gap-1.5 mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>返回班级宠物大厅</span>
          </Link>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-2 select-none">
            🏁 萌宠速度对抗赛
          </h1>
          <p className="text-sm font-bold text-foreground/60 mt-1">
            小萌宠齐聚跑道！它的等级和当前状态（体力、心情、饱食度）会直接决定奔跑速度，快来测测谁是飞毛腿！
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 relative z-10">
        {!isRaceStarted ? (
          /* ==================================== STEP 1: SELECTION SCREEN ==================================== */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side deck select */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-card border-3 border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-dashed border-border pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏃‍♂️</span>
                    <div>
                      <h2 className="text-base font-black text-foreground">
                        挑选参赛小萌宠 (当前选择: <span className="text-primary font-black">{selectedPets.length} / 4</span> )
                      </h2>
                      <p className="text-xs font-bold text-foreground/50 mt-1">
                        点击卡片进行上下挑选，你可以从我们班级认养的宠物库中选择。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFillWithAI}
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-450 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>➕ 增加电脑小对手</span>
                    </button>
                    {selectedPets.length > 0 && (
                      <button
                        onClick={handleClearSelection}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        清空选手
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid list in classroom pets pool */}
                {allPets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                    {allPets.map((pet) => {
                      const isSelected = selectedPets.some(p => p.id === pet.id);
                      const spRating = calculateSpeedPower(pet);
                      const totalXp = (pet.level - 1) * 100 + pet.xp;
                      const hasEnoughXp = totalXp >= 12;
                      
                      return (
                        <div
                          key={pet.id}
                          onClick={() => handleTogglePet(pet)}
                          className={`border-2 rounded-xl p-3.5 flex items-center gap-3.5 transition-all cursor-pointer select-none relative ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-inner' 
                              : !hasEnoughXp
                              ? 'border-rose-200/50 bg-rose-50/10 opacity-75 hover:opacity-100'
                              : 'border-border/60 bg-muted/30 hover:border-border hover:bg-muted/70'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px]">
                              ✓
                            </div>
                          )}

                          {/* Mini sprite visual */}
                          <div className="w-14 h-14 bg-background border border-border/40 rounded-xl flex items-center justify-center shrink-0">
                            <PetSprite
                              type={pet.petType}
                              level={pet.level}
                              costume={pet.activeCostume}
                              mood={pet.mood}
                              hunger={pet.hunger}
                              energy={pet.energy}
                              size="sm"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-foreground truncate">{pet.petName}</span>
                              <span className="text-[10px] bg-amber-100 text-accent font-black px-1.5 py-0.5 rounded-lg shrink-0">
                                Lv.{pet.level}
                              </span>
                            </div>
                            <p className="text-[10px] text-foreground/45 font-bold mt-1 flex flex-wrap items-center gap-1">
                              <span>学生: {pet.studentName}</span>
                              <span>·</span>
                              <span>心情: {pet.mood}%</span>
                              <span>·</span>
                              <span className={hasEnoughXp ? "text-emerald-600 font-extrabold" : "text-rose-500 font-extrabold"}>
                                XP: {totalXp} {hasEnoughXp ? "✨" : "(不足12)"}
                              </span>
                            </p>
                            
                            {/* Stat meters */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 flex items-center gap-1" title="体力">
                                <span className="text-[10px]">⚡</span>
                                <div className="flex-1 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pet.energy}%` }} />
                                </div>
                              </div>
                              <div className="flex-1 flex items-center gap-1" title="饱腹度">
                                <span className="text-[10px]">🍖</span>
                                <div className="flex-1 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pet.hunger}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sprint power index card */}
                          <div className={`text-center py-1 px-2 border rounded-lg shrink-0 font-extrabold text-xs ${getRatingBadgeColor(spRating)}`}>
                            <p className="text-[9px] opacity-75 font-bold scale-[0.95]">速度指数</p>
                            <span className="text-sm font-black">{spRating}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-muted/10 rounded-xl border border-dashed border-border">
                    <p className="text-xs text-foreground/50 font-bold">还没有班级萌宠！请先回到首页认养你的宠物吧 ✨</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side line-up list view */}
            <div className="flex flex-col gap-6">
              <div className="bg-card border-3 border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[400px]">
                <div className="flex flex-col gap-5">
                  <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-300 animate-pulse" />
                    <span>今日阵容 (已入列 {selectedPets.length} 只)</span>
                  </h3>

                  {selectedPets.length > 0 ? (
                    <div className="flex flex-col gap-3.5">
                      {selectedPets.map((pet, idx) => {
                        const score = calculateSpeedPower(pet);
                        const isAI = pet.id.startsWith('ai-');
                        return (
                          <div 
                            key={pet.id}
                            className="bg-muted p-3.5 rounded-xl border border-border/80 flex items-center justify-between gap-3 relative overflow-hidden group"
                          >
                            {/* Visual lane banner indicator */}
                            <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-amber-400" />
                            
                            <div className="flex items-center gap-3.5 pl-2.5">
                              <span className="text-xs font-black font-mono text-stone-400">#{idx + 1}道</span>
                              <div>
                                <h4 className="font-black text-xs flex items-center gap-1.5">
                                  <span>{pet.petName}</span>
                                  {isAI && (
                                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">AI对手</span>
                                  )}
                                </h4>
                                <p className="text-[10px] text-foreground/50 font-medium">得主: {pet.studentName} · 等级 {pet.level}</p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-semibold text-foreground/60 mr-1.5">战力指数:</span>
                              <span className="font-black text-sm text-stone-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">{score}</span>
                            </div>
                          </div>
                        );
                      })}

                      {selectedPets.length < 4 && (
                        <button
                          onClick={handleFillWithAI}
                          className="py-3 px-4 border-2 border-dashed border-border hover:border-sky-500 hover:bg-sky-50/20 text-foreground/60 hover:text-sky-600 transition-colors rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>一键派出电脑 AI 挑战者</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10 flex flex-col items-center justify-center">
                      <span className="text-4xl filter drop-shadow-md select-none mb-3">🏁</span>
                      <p className="text-xs text-foreground/45 font-bold leading-relaxed max-w-[200px]">
                        左侧挑选 2-4 只萌宠进入本场对抗。没有足够宠物？可以点击“增加电脑AI”进行随机博弈测速哦！
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-dashed border-border/60">
                  <button
                    onClick={handleStartRaceSetup}
                    disabled={selectedPets.length < 2}
                    className="w-full btn-push py-4 text-sm font-extrabold text-stone-950 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Flame className="w-5 h-5 fill-stone-950 text-stone-950 stroke-[2.5]" />
                    <span>进入比赛 · 鸣枪开跑！🏁</span>
                  </button>
                  <p className="text-[10px] text-center text-foreground/45 font-bold mt-2.5">
                    * 参加比赛需要花费 12 点经验值（XP）作为入场券，比赛开始后还将消耗参赛萌宠 15% 的体力与 10% 的饱腹值
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ==================================== STEP 2: RUNNING STATE & PODIUM ==================================== */
          <div className="flex flex-col gap-6">
            {/* Countdown Overlay Layer */}
            <AnimatePresence>
              {countdown !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4">
                  <motion.div
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: 1.3, opacity: 1 }}
                    exit={{ scale: 2.0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="flex flex-col items-center text-center select-none"
                  >
                    <span className="text-9xl font-black text-amber-400 drop-shadow-[0_8px_0_rgba(0,0,0,0.5)] tracking-wide">
                      {countdown === 0 ? '🏁' : countdown}
                    </span>
                    <h2 className="text-3xl font-black text-white mt-10 tracking-widest drop-shadow-md">
                      {countdown === 0 ? 'GO!! 冲啊小可爱们！' : '预备——各就各位——'}
                    </h2>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Stadium Track Stage */}
            <div className="bg-card border-4 border-stone-800 rounded-2xl shadow-xl overflow-hidden relative">
              {/* Grandstand Backdrop */}
              <div className="bg-stone-900 border-b-2 border-stone-800 py-3.5 px-6 flex items-center justify-between">
                <div className="flex items-center gap-2 select-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-extrabold text-stone-100 text-xs tracking-wider">
                    🛰️ 现场实时赛事转播: 萌宠耐力竞速赛
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="inline-flex py-1 px-2.5 rounded-lg bg-stone-800 text-[10px] text-amber-400 font-extrabold border border-stone-700">
                    🟢 赛场状态：{isRacingActive ? '比赛进行中...' : '比赛已落幕'}
                  </span>
                </div>
              </div>

              {/* Running Lanes Stage Frame */}
              <div className="relative p-6 pt-10 pb-8 bg-gradient-to-b from-green-800 to-emerald-900 min-h-[380px] flex flex-col gap-5 select-none overflow-hidden">
                {/* Lane Separator Lines Backgrounds  */}
                <div className="absolute inset-y-0 left-[20%] w-[1px] border-l border-dashed border-white/20 pointer-events-none" />
                <div className="absolute inset-y-0 left-[50%] w-[1px] border-l border-dashed border-white/20 pointer-events-none" />
                <div className="absolute inset-y-0 left-[80%] w-[1px] border-l border-dashed border-white/20 pointer-events-none" />

                {/* Finish Line Checkered Banner */}
                <div className="absolute top-0 bottom-0 right-[8%] w-6 bg-checkers opacity-90 select-none border-l border-r border-stone-800/80 flex flex-col items-center justify-around text-[10px] text-stone-800 font-bold leading-none py-2 pointer-events-none">
                  <div>🏁</div><div>终</div><div>点</div><div>线</div><div>🏁</div>
                </div>

                {/* Loop Render Runway Lanes */}
                {runners.map((runner, idx) => {
                  return (
                    <div 
                      key={runner.pet.id} 
                      className="h-20 bg-stone-900/50 rounded-xl relative border-y border-white/10 flex items-center z-10"
                    >
                      {/* Lane Number label */}
                      <div className="absolute top-2 left-2 text-[10px] font-black tracking-widest text-white/50 bg-stone-950/40 px-2 py-0.5 rounded-md">
                        LANE {idx + 1}
                      </div>

                      {/* Speed Power indicator in lane background */}
                      <div className="absolute right-3 top-2.5 opacity-30 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-stone-300" />
                        <span className="text-[10px] text-stone-100 font-extrabold">综合指数: {runner.speedPower}</span>
                      </div>

                      {/* Runner entity container that is pushed forward horizontally */}
                      <div 
                        className="absolute flex items-center transition-all duration-300"
                        style={{ 
                          left: `${8 + (runner.progress * 0.76)}%`, 
                          transform: 'translateY(-4px)',
                        }}
                      >
                        {/* Event popup overlay (e.g. accelerating, slow down) */}
                        <AnimatePresence>
                          {runner.eventText && (
                            <motion.span
                              initial={{ scale: 0, y: 15, opacity: 0 }}
                              animate={{ scale: 1.0, y: -28, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className={`absolute top-0 px-2 py-0.5 whitespace-nowrap text-[9px] font-black rounded-lg border shadow-md z-30 ${
                                runner.eventText.includes('突然加速') || runner.eventText.includes('爆发')
                                  ? 'bg-rose-500 text-white border-rose-400'
                                  : runner.eventText.includes('踩到') || runner.eventText.includes('疲累')
                                  ? 'bg-amber-500 text-stone-950 border-amber-300'
                                  : 'bg-stone-850 text-white border-stone-700'
                              }`}
                            >
                              {runner.eventText}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Realtime dynamic speak quotes bubble below runner */}
                        {runner.aiQuote && (
                          <div className="absolute bottom-[46px] -left-12 w-[160px] select-none pointer-events-none flex items-center justify-center opacity-85 hover:opacity-100 scale-90 z-20">
                            <SpeechBubble text={runner.aiQuote} visible={true} arrowPosition="bottom" />
                          </div>
                        )}

                        {/* Run icon / face card */}
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 relative">
                            <PetSprite
                              type={runner.pet.petType}
                              level={runner.pet.level}
                              costume={runner.pet.activeCostume}
                              mood={runner.pet.mood}
                              hunger={runner.pet.hunger}
                              energy={runner.pet.energy}
                              action={isRacingActive ? 'play' : 'none'}
                              size="sm"
                              className={isRacingActive ? 'animate-bounce' : ''}
                            />
                          </div>

                          {/* Badge tag */}
                          <div className="mt-1 flex items-center gap-1.5 bg-stone-950/80 px-2 py-0.5 rounded-full border border-stone-700 text-stone-200 text-[10px] font-black shadow-xs">
                            <span className="truncate max-w-[55px] font-bold">{runner.pet.petName}</span>
                            <span className="text-[9px] text-amber-400 font-bold">👤{runner.pet.studentName}</span>
                          </div>
                        </div>

                        {/* Wind draft streak effects trailing behind */}
                        {isRacingActive && runner.progress > 5 && (
                          <div className="flex flex-col gap-1.5 opacity-60 pointer-events-none pr-30 shrink-0 transform -translate-x-[72px] justify-center items-end">
                            <div className="w-12 h-1 bg-white/40 rounded-full animate-pulse" />
                            <div className="w-8 h-1 bg-white/30 rounded-full animate-pulse delay-75" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Split logger panel and podium display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Standing lists / Logs */}
              <div className="lg:col-span-2 bg-card border-3 border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-extrabold text-sm text-stone-900 border-b border-dashed border-border pb-3 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-500" />
                  <span>赛事动态大厅日志</span>
                </h3>

                <div className="bg-stone-950 text-stone-200 p-4 rounded-xl border border-stone-900 h-[180px] overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col gap-1.5">
                  {raceLogs.map((log, index) => (
                    <p key={index} className="text-stone-300">
                      <span className="text-stone-500 font-bold">[{index + 1}]</span> {log}
                    </p>
                  ))}
                  {isRacingActive && (
                    <p className="text-amber-400 animate-pulse font-extrabold">⚡ 跑步机器马达狂轰中，随时注意赛况爆发！</p>
                  )}
                </div>

                {/* DB status depletions/XP gains report once finished */}
                {podium.length > 0 && xpUpdateSummary.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 mt-1">
                    <h4 className="font-black text-emerald-800 text-xs mb-2.5 flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>🏆 赛后成长奖励 & 属性反馈：</span>
                    </h4>
                    <div className="flex flex-col gap-1.5 text-xs text-emerald-950 font-bold">
                      {xpUpdateSummary.map((sum, index) => (
                        <p key={index} className="flex items-center gap-1.5">
                          <span className="text-emerald-500">✔</span>
                          <span>{sum}</span>
                        </p>
                      ))}
                    </div>

                    {/* Level Up animations details */}
                    {levelUpDetails.length > 0 && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black rounded-lg text-xs leading-relaxed flex items-center gap-3 shadow-md animate-pulse">
                        <span className="text-2xl">🎉</span>
                        <div>
                          <p className="text-[13px]">喜报！由于本次跑步表现优越：</p>
                          {levelUpDetails.map((lvl, idx) => (
                            <p key={idx}>🏅 萌宠【{lvl.name}】成功跃升至 Lv.{lvl.newLvl}！(进化解锁更雄厚的初始实力)</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Podium Leaderboard Box */}
              <div className="bg-card border-3 border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900 mb-4 flex items-center gap-1.5">
                    <Trophy className="w-4.5 h-4.5 text-amber-500 animate-bounce" />
                    <span>本场速度大奖台 (Podium)</span>
                  </h3>

                  {podium.length > 0 ? (
                    <div className="flex flex-col gap-3.5">
                      {podium.map((runner, index) => {
                        const isWinner = runner.rank === 1;
                        const isSecond = runner.rank === 2;
                        const isThird = runner.rank === 3;
                        
                        const medalStyle = isWinner 
                          ? 'bg-amber-100 text-amber-700 border-amber-300' 
                          : isSecond 
                          ? 'bg-slate-100 text-slate-700 border-slate-300' 
                          : isThird
                          ? 'bg-amber-50/50 text-amber-800 border-amber-200'
                          : 'bg-stone-50 text-stone-500 border-stone-200';

                        const rankIcon = isWinner ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : '🎗️';

                        return (
                          <div 
                            key={runner.pet.id} 
                            className={`flex items-center justify-between p-3 border rounded-xl ${medalStyle}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold font-mono">{rankIcon}</span>
                              <div>
                                <h4 className="font-black text-xs">{runner.pet.petName}</h4>
                                <p className="text-[9px] text-stone-500 font-bold">学生: {runner.pet.studentName}</p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] text-stone-500 font-bold">成绩</p>
                              <span className="text-xs font-black font-mono">{runner.finishTime?.toFixed(2)} 秒</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 flex flex-col items-center justify-center border border-dashed border-border rounded-xl">
                      <span className="text-3xl text-stone-400 mb-2">🏁</span>
                      <p className="text-[11px] text-foreground/40 font-bold">比赛仍在进行中，快去摇旗呐喊！</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-dashed border-border/80 mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={handleResetRaceAll}
                    disabled={isRacingActive}
                    className="w-full btn-push-white py-3 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>重置/再来一盘 🏁</span>
                  </button>
                  <Link
                    to="/"
                    className="w-full btn-push-accent py-3 text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    <span>返回萌宠大厅喂水喂食 🏠</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Race;
