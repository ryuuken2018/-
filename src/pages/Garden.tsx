import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { loadPets } from '../lib/petStore';
import { Pet, PET_CLASSES, getEvolutionStage, EVOLUTION_NAMES } from '../types/pet';
import { PetSprite } from '../components/PetSprite';
import { SpeechBubble } from '../components/SpeechBubble';
import { ArrowLeft, Sun, Cloud, CloudRain, Snowflake, Compass, Landmark, ShieldCheck } from 'lucide-react';

const GARDEN_W = 1000;
const GARDEN_H = 400; // Walkable vertical bound from y=120 to y=380

interface Pavilion {
  name: string;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
  icon: string;
}

const PAVILIONS: Pavilion[] = [
  { name: '听雨亭', x: 180, y: 150, color: 'bg-emerald-500/10 border-emerald-500/30', width: 140, height: 110, icon: '🛖' },
  { name: '春风亭', x: 500, y: 130, color: 'bg-blue-500/10 border-blue-500/30', width: 140, height: 110, icon: '🏯' },
  { name: '赏花亭', x: 820, y: 160, color: 'bg-rose-500/10 border-rose-500/30', width: 140, height: 110, icon: '🏰' },
];

type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

interface GardenPetState {
  pet: Pet;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scaleX: number; // 1 or -1 for flipping left/right
  state: 'walk' | 'idle' | 'sniff' | 'jump' | 'play' | 'escape';
  bubbleText: string;
  bubbleTimer: number; // Ticks left for text
  statusEmoji: string; // Float emoticon like 🌸, ⭐, ☂️
  emojiTimer: number; // Ticks left for emoji
}

export const Garden: React.FC = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [weather, setWeather] = useState<Weather>('sunny');
  const [activeWeatherIndex, setActiveWeatherIndex] = useState(0);
  
  // High fidelity weather cycle timers
  const weathersList: Weather[] = ['sunny', 'cloudy', 'rainy', 'snowy'];

  // All virtual pet tracking list
  const [gardenPets, setGardenPets] = useState<GardenPetState[]>([]);
  
  const tickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize pets positioning
  useEffect(() => {
    const loaded = loadPets();
    setPets(loaded);

    // Turn pets list into interactive coordinates inside the garden coordinate boundaries
    const petStates = loaded.map((p, idx) => {
      // Stagger initial spots nicely
      const initX = 100 + (idx * ((GARDEN_W - 180) / Math.max(1, loaded.length - 1))) + (Math.random() * 40 - 20);
      const initY = 160 + (Math.random() * 160);
      
      return {
        pet: p,
        x: Math.min(GARDEN_W - 60, Math.max(60, initX)),
        y: Math.min(GARDEN_H - 50, Math.max(130, initY)),
        targetX: initX,
        targetY: initY,
        scaleX: Math.random() > 0.5 ? 1 : -1,
        state: 'idle' as const,
        bubbleText: '这里空气好清新呀！🍃',
        bubbleTimer: 5,
        statusEmoji: '',
        emojiTimer: 0,
      };
    });

    setGardenPets(petStates);
  }, []);

  // Weather state change effect -> if rainy/snowy, override pet targets immediately
  useEffect(() => {
    setGardenPets((prevStates) =>
      prevStates.map((gp) => {
        if (weather === 'rainy' || weather === 'snowy') {
          // Find closest pavilion coordinate
          const closest = findClosestPavilion(gp.x, gp.y);
          // Set custom quote on escaping
          const escapeQuotes = [
            '下雨啦，快跑去亭子里避雨！☂️',
            '哎呀呀，变天啦，走，我们快避雨！🌧️',
            '下雪咯，去亭子里喝杯茶暖和暖和！☃️',
            '凉风飕飕的，快去亭子附近躲躲！',
          ];
          const randomText = escapeQuotes[Math.floor(Math.random() * escapeQuotes.length)];
          
          return {
            ...gp,
            targetX: closest.x + (Math.random() * 40 - 20),
            targetY: closest.y + (Math.random() * 20 - 10),
            state: 'escape' as const,
            bubbleText: randomText,
            bubbleTimer: 8,
          };
        } else {
          // Releases back to normal random wander
          return {
            ...gp,
            targetX: 80 + Math.random() * (GARDEN_W - 160),
            targetY: 150 + Math.random() * 200,
            state: 'walk' as const,
            bubbleText: weather === 'sunny' ? '太阳公公出来啦！好舒服 ☀️' : '大朵大朵的白云，好温和呀 ☁️',
            bubbleTimer: 6,
          };
        }
      })
    );
  }, [weather]);

  // Weather loop auto rotation tick
  useEffect(() => {
    const cycle = setInterval(() => {
      setActiveWeatherIndex((prev) => {
        const next = (prev + 1) % weathersList.length;
        setWeather(weathersList[next]);
        return next;
      });
    }, 18000); // 18 seconds weather cycling

    return () => clearInterval(cycle);
  }, []);

  // AI State Engine clock running loop tick (setInterval is perfect here)
  useEffect(() => {
    tickTimerRef.current = setInterval(() => {
      setGardenPets((prevStates) => {
        return prevStates.map((gp) => {
          let {
            x,
            y,
            targetX,
            targetY,
            scaleX,
            state,
            bubbleText,
            bubbleTimer,
            statusEmoji,
            emojiTimer,
          } = gp;

          // Tick countdowns
          if (bubbleTimer > 0) bubbleTimer--;
          if (bubbleTimer === 0) bubbleText = '';

          if (emojiTimer > 0) emojiTimer--;
          if (emojiTimer === 0) statusEmoji = '';

          // Calculate displacement distance to targets
          const dx = targetX - x;
          const dy = targetY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const isEscaping = weather === 'rainy' || weather === 'snowy';

          if (dist > 8) {
            // Move toward targets
            const speed = state === 'escape' ? 4 : 2; // Run speed multiplier under scary weather
            const ratio = speed / dist;
            x += dx * ratio;
            y += dy * ratio;
            state = isEscaping ? 'escape' : 'walk';
            scaleX = dx > 0 ? 1 : -1;

            // Optional: If escaping, check if we arrived close to pavilion
            if (isEscaping) {
              const nearestPavilion = findClosestPavilion(x, y);
              const distToPav = Math.sqrt(Math.pow(x - nearestPavilion.x, 2) + Math.pow(y - nearestPavilion.y, 2));
              if (distToPav <= 40) {
                // Arrived at pavilion! Put down umbrella and look happy/resting
                statusEmoji = '⛺';
                emojiTimer = 4;
                state = 'idle';
              } else {
                // Show umbrella emoji above pet
                statusEmoji = '☂️';
                emojiTimer = 2;
                if (bubbleTimer === 0 && Math.random() < 0.12) {
                  bubbleText = '下毛毛雨啦，走快点撑着伞！☂️';
                  bubbleTimer = 5;
                }
              }
            }
          } else {
            // Arrived at target! Trigger next randomized AI behavior
            if (isEscaping) {
              // Stay cozy inside pavilion boundary
              state = 'idle';
              if (Math.random() < 0.15 && bubbleTimer === 0) {
                const cozyPhrases = [
                  '亭子里好温暖呀，等雨停 🌧️',
                  '雨滴敲打着屋顶，像唱歌一样 🎵',
                  '还好亭子近，没有淋成落汤鸡 🐔',
                  '雪景真美呢，不过外面有点冷 ❄️',
                ];
                bubbleText = cozyPhrases[Math.floor(Math.random() * cozyPhrases.length)];
                bubbleTimer = 6;
              }
            } else {
              // Sunny/Cloudy normal behaviors
              const dice = Math.random();
              if (dice < 0.35) {
                // Rest and look around
                state = 'idle';
                if (Math.random() < 0.15 && bubbleTimer === 0) {
                  const idlePhrases = [
                    '阳光洒在身上好舒服哦～ ☀️',
                    '今天又是元气满满的一天！⭐',
                    '好想念主人呀，主人今天加把劲！',
                    '大家快来这边看蝴蝶！🦋',
                  ];
                  bubbleText = idlePhrases[Math.floor(Math.random() * idlePhrases.length)];
                  bubbleTimer = 5;
                }
              } else if (dice < 0.6) {
                // Sniff flowers
                state = 'sniff';
                statusEmoji = '🌸';
                emojiTimer = 4;
                if (Math.random() < 0.2 && bubbleTimer === 0) {
                  bubbleText = '好香的花花呀，春天的味道！🌸';
                  bubbleTimer = 5;
                }
              } else if (dice < 0.8) {
                // Jump and play
                state = 'play';
                statusEmoji = '⭐';
                emojiTimer = 4;
                if (Math.random() < 0.2 && bubbleTimer === 0) {
                  bubbleText = '一、二、跳！今天心情超级棒！💃';
                  bubbleTimer = 5;
                }
              } else {
                // Walk to new random destination
                state = 'walk';
                targetX = 80 + Math.random() * (GARDEN_W - 160);
                targetY = 150 + Math.random() * 210;
              }
            }
          }

          return {
            ...gp,
            x,
            y,
            targetX,
            targetY,
            scaleX,
            state,
            bubbleText,
            bubbleTimer,
            statusEmoji,
            emojiTimer,
          };
        });
      });
    }, 1000); // Compute tick once per second

    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [weather]);

  // Find nearest pavilion coordinates based on coordinate math
  const findClosestPavilion = (x: number, y: number): Pavilion => {
    let closest = PAVILIONS[0];
    let minDist = 999999;
    PAVILIONS.forEach((pav) => {
      const dist = Math.sqrt(Math.pow(x - pav.x, 2) + Math.pow(y - pav.y, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = pav;
      }
    });
    return closest;
  };

  // Helper properties formatting for name labels
  const getLabelColorClass = (score: number) => {
    if (score > 80) return 'bg-emerald-500 border-emerald-400 text-white';
    if (score > 50) return 'bg-blue-500 border-blue-400 text-white';
    if (score > 30) return 'bg-amber-400 border-amber-300 text-stone-800';
    return 'bg-rose-500 border-rose-400 text-white';
  };

  const getLabelMoodEmoji = (score: number) => {
    if (score > 80) return '😆';
    if (score > 50) return '😊';
    if (score > 30) return '😐';
    if (score > 15) return '😟';
    return '😢';
  };

  // Weather icon picker
  const renderWeatherControls = () => {
    return (
      <div className="flex items-center bg-card border-2 border-border p-1.5 rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.03)] select-none">
        {(['sunny', 'cloudy', 'rainy', 'snowy'] as Weather[]).map((w, idx) => {
          const isActive = weather === w;
          const icons = {
            sunny: <Sun className="w-5 h-5 text-amber-500 fill-amber-300" />,
            cloudy: <Cloud className="w-5 h-5 text-sky-400" />,
            rainy: <CloudRain className="w-5 h-5 text-indigo-500" />,
            snowy: <Snowflake className="w-5 h-5 text-purple-400 animate-pulse" />,
          };
          const names = {
            sunny: '晴朗 ☀️',
            cloudy: '多云 ☁️',
            rainy: '雨天 🌧️',
            snowy: '下雪 ❄️',
          };
          
          return (
            <button
              key={w}
              onClick={() => {
                setWeather(w);
                setActiveWeatherIndex(idx);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-primary text-white border-b-2 border-primary-dark shadow-sm'
                  : 'bg-transparent text-foreground/60 hover:bg-muted'
              }`}
            >
              {icons[w]}
              <span>{names[w]}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // Weather overlay falling particles animation
  const renderWeatherParticles = () => {
    if (weather !== 'rainy' && weather !== 'snowy') return null;

    const count = 35;
    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-[22px]">
        {Array.from({ length: count }).map((_, i) => {
          const leftPos = (i * (100 / count)) + (Math.random() * 2);
          const delayVal = Math.random() * 4;
          const durationVal = weather === 'rainy' ? 1 + Math.random() * 0.5 : 2.5 + Math.random() * 1.5;

          return (
            <motion.div
              key={i}
              initial={{ y: -30, opacity: 0 }}
              animate={{
                y: GARDEN_H + 30,
                opacity: [0, 0.8, 0.8, 0],
                x: weather === 'snowy' ? `calc(${leftPos}% + ${Math.sin(i) * 20}px)` : `${leftPos}%`,
              }}
              transition={{
                duration: durationVal,
                repeat: Infinity,
                delay: delayVal,
                ease: 'linear',
              }}
              style={{ left: `${leftPos}%` }}
              className={`absolute top-0 rounded-full ${
                weather === 'rainy' ? 'w-[1.5px] h-5 bg-blue-300' : 'w-2.5 h-2.5 bg-white shadow-xs'
              }`}
            />
          );
        })}
      </div>
    );
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
            <span>返回班级宠物列表</span>
          </Link>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-2 select-none">
            🌿 共享萌宠花草园
          </h1>
          <p className="text-sm font-bold text-foreground/60 mt-1">
            学生的小伙伴在这里自由活动、社交成长（18s自动切换天气哦）
          </p>
        </div>

        {/* Custom manual weather trigger controls */}
        {renderWeatherControls()}
      </header>

      {/* Primary Garden Stage Canvas */}
      <main className="max-w-7xl mx-auto px-4 relative z-10">
        <div
          className="relative card-flat h-[460px] overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-200/90 border-4 border-border select-none"
          id="garden-stage"
        >
          {/* Dynamic background decorations */}
          <div className="absolute top-8 left-[10%] opacity-45 w-20 h-8 bg-white rounded-full blur-[1px]" />
          <div className="absolute top-14 right-[15%] opacity-45 w-28 h-10 bg-white rounded-full blur-[1px]" />

          {/* Falling weather particles */}
          {renderWeatherParticles()}

          {/* Ground decor - cute flower patches, bushes, fences */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-emerald-300/40 to-transparent pointer-events-none" />

          {/* Garden Pavilion structures */}
          {PAVILIONS.map((pav) => (
            <div
              key={pav.name}
              className={`absolute border-2 card-flat rounded-2xl flex flex-col items-center justify-center p-3 text-center ${pav.color}`}
              style={{
                left: pav.x - pav.width / 2,
                top: pav.y - pav.height / 2,
                width: pav.width,
                height: pav.height,
              }}
            >
              <span className="text-3xl filter drop-shadow-xs mb-1 select-none pointer-events-none">
                {pav.icon}
              </span>
              <span className="font-extrabold text-[13px] text-foreground/80 leading-none">
                {pav.name}
              </span>
              <span className="text-[10px] text-foreground/45 mt-1 font-semibold">
                安全避雨点 ⛺
              </span>
            </div>
          ))}

          {/* Render individual free-roaming interactive pets */}
          {gardenPets.length > 0 ? (
            gardenPets.map((gp) => {
              const petClass = PET_CLASSES[gp.pet.petType];
              const evoStage = getEvolutionStage(gp.pet.level);
              return (
                <div
                  key={gp.pet.id}
                  onClick={() => navigate(`/pet/${gp.pet.id}`)}
                  className="absolute cursor-pointer flex flex-col items-center group z-40 transition-shadow hover:z-50"
                  style={{
                    left: gp.x - 48, // Centered offsetting width of sm sprite wrapper
                    top: gp.y - 75, // Offsetting layout height
                    transition: 'left 1s linear, top 1s linear', // Interpolated movement smoothing
                  }}
                >
                  {/* Floating Action bubble dialog */}
                  {gp.bubbleText && (
                    <div className="absolute bottom-[92px] w-[180px] flex items-center justify-center pointer-events-none">
                      <SpeechBubble text={gp.bubbleText} visible={true} arrowPosition="bottom" />
                    </div>
                  )}

                  {/* Character entity overlay emoji cue (happy stars, target, sniff flower) */}
                  {gp.statusEmoji && (
                    <motion.span
                      initial={{ scale: 0, y: 10, opacity: 0 }}
                      animate={{ scale: [1, 1.3, 1], y: 0, opacity: 1 }}
                      className="absolute bottom-[66px] bg-card border border-border shadow-xs rounded-full p-1 text-xs font-bold leading-none z-10"
                    >
                      {gp.statusEmoji}
                    </motion.span>
                  )}

                  {/* SVG Sprite wrapper flipped depending on scale flipping coordinates */}
                  <div
                    className="w-20 h-20 flex items-center justify-center"
                    style={{ transform: `scaleX(${gp.scaleX})` }}
                  >
                    <PetSprite
                      type={gp.pet.petType}
                      level={gp.pet.level}
                      costume={gp.pet.activeCostume}
                      mood={gp.pet.mood}
                      hunger={gp.pet.hunger}
                      energy={gp.pet.energy}
                      size="md"
                    />
                  </div>

                  {/* Reactive name badge with HSL mood markers */}
                  <div
                    className={`mt-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-black shadow-xs flex items-center gap-1 shrink-0 ${getLabelColorClass(
                      gp.pet.mood
                    )}`}
                  >
                    <span>{getLabelMoodEmoji(gp.pet.mood)}</span>
                    <span>{gp.pet.petName}</span>
                    <span className="text-[10px] font-bold opacity-70">👤{gp.pet.studentName}</span>
                  </div>
                </div>
              );
            })
          ) : (
            /* Inside Stage empty status */
            <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-6 bg-stone-900/10 backdrop-blur-xs select-none">
              <span className="text-6xl block mb-3 animate-bounce">🌱</span>
              <p className="text-base font-black text-foreground">
                还没有萌宠可以放牧哦！
              </p>
              <Link to="/" className="btn-push px-5 py-2.5 text-xs font-bold mt-4">
                ➕ 立即去认养
              </Link>
            </div>
          )}
        </div>

        {/* Bottom index help cards */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border-2 border-border p-5 rounded-2xl flex items-start gap-4">
            <span className="text-3xl bg-secondary/15 p-2 rounded-xl text-secondary select-none">🏡</span>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">避风亭庇护机制</h3>
              <p className="text-xs text-foreground/60 leading-relaxed mt-1">
                当天气系统滚动至 **“雨水🌧️”** 或是 **“风雪❄️”** 时，聪明的宠物会自动判定并就近赶往其中一座避风亭躲藏。如果在荒野地段，会自动打伞哟。
              </p>
            </div>
          </div>

          <div className="bg-card border-2 border-border p-5 rounded-2xl flex items-start gap-4">
            <span className="text-3xl bg-amber-500/15 p-2 rounded-xl text-amber-500 select-none">😆</span>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">心情色彩可视化</h3>
              <p className="text-xs text-foreground/60 leading-relaxed mt-1">
                宠物名称标签底色反应真实心情状态：**绿色优秀(&gt;80)**、**蓝色普通(&gt;50)**、**黄色警戒(&gt;30)**、**红色低落(&le;30)**，记得时刻关怀他们！
              </p>
            </div>
          </div>

          <div className="bg-card border-2 border-border p-5 rounded-2xl flex items-start gap-4">
            <span className="text-3xl bg-primary/15 p-2 rounded-xl text-primary select-none">🌸</span>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">多向萌趣AI状态机</h3>
              <p className="text-xs text-foreground/60 leading-relaxed mt-1">
                萌宠在草地上会随机变换行为状态：慢跑 `walk`、寻香探草 `sniff`、雀跃转圈 `play` 或是惬意发呆 `idle`，随时呈现最活泼治愈的一面。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
export default Garden;
