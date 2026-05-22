import React from 'react';
import { motion } from 'motion/react';
import { PetType, CostumeId, EvolutionStage, getEvolutionStage } from '../types/pet';

interface PetSpriteProps {
  type: PetType;
  level: number;
  costume?: CostumeId;
  mood?: number;    // 0 - 100
  hunger?: number;  // 0 - 100
  energy?: number;  // 0 - 100
  action?: 'none' | 'feed' | 'play' | 'rest';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const PetSprite: React.FC<PetSpriteProps> = ({
  type,
  level,
  costume = 'none',
  mood = 80,
  hunger = 80,
  energy = 80,
  action = 'none',
  className = '',
  size = 'md',
}) => {
  const stage = getEvolutionStage(level);

  // Size mapping
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-40 h-40',
    xl: 'w-56 h-56',
  };

  // Determine current emotion state
  let emotion: 'happy' | 'sad' | 'sleepy' | 'hungry' | 'normal' = 'normal';
  if (action === 'feed') {
    emotion = 'happy';
  } else if (action === 'play') {
    emotion = 'happy';
  } else if (action === 'rest') {
    emotion = 'sleepy';
  } else if (energy < 30) {
    emotion = 'sleepy';
  } else if (hunger < 30) {
    emotion = 'hungry';
  } else if (mood < 30) {
    emotion = 'sad';
  } else if (mood > 80) {
    emotion = 'happy';
  }

  // Base colors for each pet
  const colors = {
    cat: { body: '#F6AD55', belly: '#FEEBC8', border: '#C05621', ears: '#ED8936', accent: '#ED64A6' },
    dog: { body: '#ED8936', belly: '#FFFAF0', border: '#9C4221', ears: '#DD6B20', accent: '#ED64A6' },
    rabbit: { body: '#EDF2F7', belly: '#FFF5F5', border: '#A0AEC0', ears: '#FEB2B2', accent: '#ED64A6' },
    hamster: { body: '#ECC94B', belly: '#FFFFF0', border: '#B7791F', ears: '#D69E2E', accent: '#ED64A6' },
    bird: { body: '#4299E1', belly: '#EBF8FF', border: '#2B6CB0', ears: '#ED8936', accent: '#FAF089' },
    turtle: { body: '#48BB78', belly: '#F0FFF4', border: '#22543D', ears: '#38A169', shell: '#2F855A' },
  };

  const pColor = colors[type];

  // Action and constant floating animation
  const getActionAnimation = () => {
    switch (action) {
      case 'feed':
        return {
          y: [0, -15, 0, -10, 0],
          scaleY: [1, 0.85, 1, 0.9, 1],
          transition: { duration: 0.6, ease: 'easeOut' },
        };
      case 'play':
        return {
          y: [0, -20, 0, -20, 0],
          rotate: [0, -10, 10, -10, 0],
          scale: [1, 1.08, 0.95, 1.05, 1],
          transition: { duration: 0.8, ease: 'easeInOut' },
        };
      case 'rest':
        return {
          scaleX: [1, 1.05, 1, 1.05, 1],
          scaleY: [1, 0.95, 1, 0.95, 1],
          transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        };
      default:
        // Default floating idle anim
        return {
          y: [0, -5, 0],
          transition: {
            duration: 2.2 + Math.random() * 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        };
    }
  };

  // Render SVG facial elements
  const renderEyes = () => {
    if (emotion === 'sleepy' || action === 'rest') {
      return (
        <>
          {/* Closed sleeping eyes */}
          <path d="M 26 42 Q 33 47 40 42" stroke={pColor.border} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 60 42 Q 67 47 74 42" stroke={pColor.border} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Gentle sleeping blush */}
          <circle cx="22" cy="48" r="3.5" fill="#FFB3C6" opacity="0.5" />
          <circle cx="78" cy="48" r="3.5" fill="#FFB3C6" opacity="0.5" />
        </>
      );
    }
    if (emotion === 'sad') {
      return (
        <>
          {/* Sad watery eyes with extra glisten */}
          <circle cx="32" cy="40" r="6" fill="#2D3748" />
          <circle cx="68" cy="40" r="6" fill="#2D3748" />
          {/* Glisten twinkles */}
          <circle cx="30" cy="38" r="2" fill="#FFFFFF" />
          <circle cx="66" cy="38" r="2" fill="#FFFFFF" />
          <circle cx="34" cy="42" r="1" fill="#FFFFFF" />
          <circle cx="70" cy="42" r="1" fill="#FFFFFF" />
          {/* Tears */}
          <ellipse cx="32" cy="46" rx="2" ry="3.5" fill="#63B3ED" />
          <ellipse cx="68" cy="46" rx="2" ry="3.5" fill="#63B3ED" />
          {/* Eyebrows angled down */}
          <path d="M 26 31 L 38 35" stroke={pColor.border} strokeWidth="3" strokeLinecap="round" />
          <path d="M 74 31 L 62 35" stroke={pColor.border} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    }
    if (emotion === 'hungry') {
      return (
        <>
          {/* Crying or nervous cross eyes */}
          <path d="M 28 36 L 36 44 M 36 36 L 28 44" stroke="#2D3748" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 64 36 L 72 44 M 72 36 L 64 44" stroke="#2D3748" strokeWidth="3.5" strokeLinecap="round" />
          {/* Blushing out of hunger/worry */}
          <circle cx="22" cy="48" r="4" fill="#FFB3C6" opacity="0.6" />
          <circle cx="78" cy="48" r="4" fill="#FFB3C6" opacity="0.6" />
        </>
      );
    }
    if (emotion === 'happy') {
      return (
        <>
          {/* Sparkly happy stars/arches */}
          <path d="M 26 41 Q 33 33 40 41" stroke="#1A202C" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 60 41 Q 67 33 74 41" stroke="#1A202C" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Soft sweet rosy happy blush */}
          <circle cx="21" cy="47" r="5" fill="#FFB3C6" opacity="0.85" />
          <circle cx="79" cy="47" r="5" fill="#FFB3C6" opacity="0.85" />
        </>
      );
    }
    // Normal cute gloss eyes with dual sparkles! Just like professional cartoon designs
    return (
      <>
        {/* Left Eye */}
        <circle cx="32" cy="40" r="6.5" fill="#1A202C" />
        <circle cx="29.8" cy="37.5" r="2.5" fill="#FFFFFF" />
        <circle cx="34" cy="42.2" r="1.1" fill="#FFFFFF" />

        {/* Right Eye */}
        <circle cx="68" cy="40" r="6.5" fill="#1A202C" />
        <circle cx="65.8" cy="37.5" r="2.5" fill="#FFFFFF" />
        <circle cx="70" cy="42.2" r="1.1" fill="#FFFFFF" />

        {/* Rosy warm cheeks */}
        <circle cx="21" cy="47" r="4.5" fill="#FEB2B2" opacity="0.8" />
        <circle cx="79" cy="47" r="4.5" fill="#FEB2B2" opacity="0.8" />
      </>
    );
  };

  const renderMouth = () => {
    if (emotion === 'sleepy' || action === 'rest') {
      return (
        <>
          {/* Little O-mouth sleeping draft */}
          <circle cx="50" cy="50" r="2.5" fill={pColor.border} />
          {/* Zzz floating next to the pet */}
          <motion.g
            animate={{ y: [-5, -25], x: [10, 18], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          >
            <text x="85" y="32" fontSize="12" fontWeight="bold" fill="#63B3ED" fontFamily="sans-serif">Z</text>
          </motion.g>
          <motion.g
            animate={{ y: [0, -18], x: [15, 23], opacity: [0, 1, 0] }}
            transition={{ duration: 2, delay: 0.8, repeat: Infinity, ease: 'easeOut' }}
          >
            <text x="85" y="32" fontSize="9" fontWeight="bold" fill="#4299E1" fontFamily="sans-serif">z</text>
          </motion.g>
        </>
      );
    }
    if (emotion === 'sad') {
      return (
        <path d="M 45 52 Q 50 48 55 52" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />
      );
    }
    if (emotion === 'hungry') {
      return (
        <>
          {/* Oval open mouth */}
          <ellipse cx="50" cy="51" rx="4" ry="6" fill="#742A2A" />
          <ellipse cx="50" cy="53" rx="3" ry="3" fill="#E53E3E" />
          {/* Tiny drip */}
          <path d="M 48 55 Q 46 62 47 64 Q 49 65 50 63" fill="#63B3ED" opacity="0.8" />
        </>
      );
    }
    if (emotion === 'happy') {
      return (
        <>
          {/* Happy big laughing mouth with tongue */}
          <path d="M 44 48 Q 50 46 56 48 Q 50 61 44 48 Z" fill="#742A2A" />
          <path d="M 46 52 Q 50 56 54 52 Q 50 49 46 52" fill="#FEB2B2" />
        </>
      );
    }
    // Normal cute little curve
    return (
      <path d="M 44 47 Q 47 50 50 47 Q 53 50 56 47" stroke="#1A202C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    );
  };

  // Rendering Animal Shells/Shapes with highly adorable, 3D shaded cartoon layouts
  const renderAnimalBody = () => {
    switch (type) {
      case 'cat':
        return (
          <>
            {/* Cats Ears - softer, slightly rounded points */}
            <path d="M 14 30 L 3 -1 Q 0 -6 5 -3 L 28 18" fill="url(#cat-body-grad)" stroke={pColor.border} strokeWidth="3" strokeLinecap="round" />
            <path d="M 16 26 L 8 4 Q 6 1 10 3 L 24 17" fill="#FEB2B2" />
            
            <path d="M 86 30 L 97 -1 Q 100 -6 95 -3 L 72 18" fill="url(#cat-body-grad)" stroke={pColor.border} strokeWidth="3" strokeLinecap="round" />
            <path d="M 84 26 L 92 4 Q 94 1 90 3 L 76 17" fill="#FEB2B2" />

            {/* Cat Tail - beautifully moving */}
            <motion.path
              d="M 75 75 Q 96 85 91 101 Q 86 114 76 108"
              stroke="url(#cat-body-grad)"
              strokeWidth="6.5"
              fill="none"
              strokeLinecap="round"
              animate={{ rotate: [0, 8, -8, 0], y: [0, -1, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            />

            {/* Body with soft 3D Gradient */}
            <rect x="20" y="24" width="60" height="66" rx="30" fill="url(#cat-body-grad)" stroke={pColor.border} strokeWidth="3.5" />
            
            {/* Extra Cute Tabby Stripes on forehead and cheeks! */}
            <path d="M 44 24 L 46 32 M 50 24 L 50 34 M 56 24 L 54 32" stroke={pColor.border} strokeWidth="3" strokeLinecap="round" />
            <path d="M 20 54 L 26 55 M 20 58 L 25 59" stroke={pColor.border} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 80 54 L 74 55 M 80 58 L 75 59" stroke={pColor.border} strokeWidth="2.5" strokeLinecap="round" />

            {/* Belly with soft 3D Gradient */}
            <ellipse cx="50" cy="65" rx="20" ry="18" fill="url(#cat-belly-grad)" />

            {/* Cute Kitty Paws standing at the base! */}
            <g id="cat-paws">
              {/* Left Paw */}
              <ellipse cx="36" cy="85" rx="8" ry="6.5" fill="url(#cat-belly-grad)" stroke={pColor.border} strokeWidth="2.5" />
              <line x1="33" y1="81" x2="33" y2="87" stroke={pColor.border} strokeWidth="2.2" strokeLinecap="round" />
              <line x1="38" y1="81" x2="38" y2="87" stroke={pColor.border} strokeWidth="2.2" strokeLinecap="round" />
              
              {/* Right Paw */}
              <ellipse cx="64" cy="85" rx="8" ry="6.5" fill="url(#cat-belly-grad)" stroke={pColor.border} strokeWidth="2.5" />
              <line x1="61" y1="81" x2="61" y2="87" stroke={pColor.border} strokeWidth="2.2" strokeLinecap="round" />
              <line x1="66" y1="81" x2="66" y2="87" stroke={pColor.border} strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* Red Collar with tiny Gold Bell */}
            <path d="M 28 68 Q 50 78 72 68" stroke="#E53E3E" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <circle cx="50" cy="74" r="5" fill="#FBBF24" stroke="#B7791F" strokeWidth="1.5" />
            <circle cx="50" cy="73.5" r="1.5" fill="#FFF" />

            {/* Whiskers */}
            <line x1="8" y1="46" x2="21" y2="47" stroke={pColor.border} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="6" y1="52" x2="21" y2="51" stroke={pColor.border} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="92" y1="46" x2="79" y2="47" stroke={pColor.border} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="94" y1="52" x2="79" y2="51" stroke={pColor.border} strokeWidth="2.5" strokeLinecap="round" />
          </>
        );

      case 'dog':
        return (
          <>
            {/* Dog tail wagging */}
            <motion.path
              d="M 78 78 Q 98 75 94 62"
              stroke="url(#dog-body-grad)"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              animate={{ rotate: [0, 22, -22, 0] }}
              transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
            />
            
            {/* Body */}
            <rect x="20" y="25" width="60" height="65" rx="28" fill="url(#dog-body-grad)" stroke={pColor.border} strokeWidth="3.5" />
            
            {/* Belly */}
            <ellipse cx="50" cy="65" rx="18" ry="18" fill="url(#dog-belly-grad)" />

            {/* Large Floppy, Soft Chocolate Ears */}
            <path d="M 12 28 Q -1 35 4 54 Q 16 54 22 36 Z" fill={pColor.ears} stroke={pColor.border} strokeWidth="3" />
            <path d="M 88 28 Q 101 35 96 54 Q 84 54 78 36 Z" fill={pColor.ears} stroke={pColor.border} strokeWidth="3" />
            
            {/* Cute Puppy Paws at base */}
            <g id="dog-paws">
              <ellipse cx="36" cy="85" rx="8" ry="6.5" fill="url(#dog-belly-grad)" stroke={pColor.border} strokeWidth="2.5" />
              <line x1="33" y1="81" x2="33" y2="87" stroke={pColor.border} strokeWidth="2.2" strokeLinecap="round" />
              <line x1="38" y1="81" x2="38" y2="87" stroke={pColor.border} strokeWidth="2.2" strokeLinecap="round" />
              
              <ellipse cx="64" cy="85" rx="8" ry="6.5" fill="url(#dog-belly-grad)" stroke={pColor.border} strokeWidth="2.5" />
              <line x1="61" y1="81" x2="61" y2="87" stroke={pColor.border} strokeWidth="2.2" strokeLinecap="round" />
              <line x1="66" y1="81" x2="66" y2="87" stroke={pColor.border} strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* Cute Collar with Golden Star */}
            <path d="M 28 68 Q 50 77 72 68" stroke="#3182CE" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            {/* Star Tag */}
            <polygon points="50,71 52,74 55,74 53,76 54,79 50,77 46,79 47,76 45,74 48,74" fill="#FBBF24" stroke="#975A16" strokeWidth="1" />

            {/* Cute patch around eye */}
            <circle cx="32" cy="40" r="11" fill={pColor.ears} opacity="0.3" />
          </>
        );

      case 'rabbit':
        return (
          <>
            {/* Rabbit long expressive curvy ears (bent look) */}
            {/* Left ear slightly bent */}
            <g id="rabbit-left-ear">
              <path d="M 23 26 Q 16 -12 24 -15 Q 36 -15 31 26 Z" fill="url(#rabbit-body-grad)" stroke={pColor.border} strokeWidth="3" />
              <path d="M 25 21 Q 19 -6 24 -9 Q 32 -9 29 21 Z" fill="#FEB2B2" />
            </g>
            {/* Right ear beautifully angled */}
            <g id="rabbit-right-ear">
              <path d="M 65 26 Q 74 -10 80 -6 Q 83 -1 73 26 Z" fill="url(#rabbit-body-grad)" stroke={pColor.border} strokeWidth="3" />
              <path d="M 67 21 Q 74 -5 77 -3 Q 79 1 71 21 Z" fill="#FEB2B2" />
            </g>
            
            {/* Fluffy cotton Tail */}
            <circle cx="85" cy="76" r="10" fill="url(#rabbit-body-grad)" stroke={pColor.border} strokeWidth="2.5" />

            {/* Body */}
            <rect x="20" y="26" width="60" height="64" rx="30" fill="url(#rabbit-body-grad)" stroke={pColor.border} strokeWidth="3.5" />
            <ellipse cx="50" cy="65" rx="19" ry="16" fill="url(#rabbit-belly-grad)" />

            {/* Cute fluffy cheeks tufts on rabbit */}
            <path d="M 20 50 Q 14 50 16 57 Q 20 54 20 50" fill="url(#rabbit-body-grad)" stroke={pColor.border} strokeWidth="2.5" />
            <path d="M 80 50 Q 86 50 84 57 Q 80 54 80 50" fill="url(#rabbit-body-grad)" stroke={pColor.border} strokeWidth="2.5" />

            {/* Rosy rabbit paws at the base */}
            <g id="rabbit-feet">
              <ellipse cx="34" cy="85" rx="9.5" ry="6" fill="#FFF" stroke={pColor.border} strokeWidth="2.5" />
              <circle cx="34" cy="85" r="3.5" fill="#FEB2B2" />
              <ellipse cx="66" cy="85" rx="9.5" ry="6" fill="#FFF" stroke={pColor.border} strokeWidth="2.5" />
              <circle cx="66" cy="85" r="3.5" fill="#FEB2B2" />
            </g>

            {/* Little pink nose triangle */}
            <polygon points="48,44 52,44 50,47" fill="#FEB2B2" stroke={pColor.border} strokeWidth="1" />
          </>
        );

      case 'hamster':
        return (
          <>
            {/* Round Cartoon ears */}
            <circle cx="26" cy="22" r="9" fill="url(#hamster-body-grad)" stroke={pColor.border} strokeWidth="3.2" />
            <circle cx="26" cy="22" r="5" fill="#FFB3C6" />
            <circle cx="74" cy="22" r="9" fill="url(#hamster-body-grad)" stroke={pColor.border} strokeWidth="3.2" />
            <circle cx="74" cy="22" r="5" fill="#FFB3C6" />

            {/* Chubby Round Ball Body */}
            <ellipse cx="50" cy="58" rx="32" ry="32" fill="url(#hamster-body-grad)" stroke={pColor.border} strokeWidth="3.5" />
            <ellipse cx="50" cy="64" rx="22" ry="18" fill="url(#hamster-belly-grad)" />

            {/* Little Pink Hamster feet */}
            <g id="hamster-feet">
              <ellipse cx="32" cy="84" rx="7.5" ry="4.5" fill="#FEB2B2" stroke={pColor.border} strokeWidth="2" />
              <ellipse cx="68" cy="84" rx="7.5" ry="4.5" fill="#FEB2B2" stroke={pColor.border} strokeWidth="2" />
            </g>

            {/* Front chubby holding paws */}
            <circle cx="43" cy="71" r="4.5" fill="#FFFCF0" stroke={pColor.border} strokeWidth="1.5" />
            <circle cx="57" cy="71" r="4.5" fill="#FFFCF0" stroke={pColor.border} strokeWidth="1.5" />
            
            {/* Holding high-polished Sunflower seed */}
            <path d="M 50 64 Q 45 74 50 78 Q 55 74 50 64 Z" fill="#FBBF24" stroke="#78350F" strokeWidth="2" />
            <line x1="50" y1="65" x2="50" y2="76" stroke="#78350F" strokeWidth="1.5" opacity="0.6" strokeDasharray="1,1" />

            {/* Tiny cute pink nose */}
            <circle cx="50" cy="46" r="2" fill="#FEB2B2" />
          </>
        );

      case 'bird':
        return (
          <>
            {/* Cute detailed Hair crest of 3 feathers */}
            <path d="M 50 25 C 47 10 57 11 54 22 C 59 13 65 17 56 25" stroke={pColor.border} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 45 25 C 42 12 37 15 42 24" stroke={pColor.border} strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Tail feathers */}
            <polygon points="17,62 1,65 10,75" fill="url(#bird-body-grad)" stroke={pColor.border} strokeWidth="2.5" />

            {/* Perfect round Body */}
            <circle cx="50" cy="56" r="30" fill="url(#bird-body-grad)" stroke={pColor.border} strokeWidth="3.5" />
            <ellipse cx="50" cy="64" rx="18" ry="15" fill="url(#bird-belly-grad)" />

            {/* Super friendly round triangle Beak */}
            <path d="M 44 45 Q 50 42 56 45 Q 50 56 44 45 Z" fill="#FBBF24" stroke="#D69E2E" strokeWidth="2.5" />
            {/* Beak smile gloss */}
            <circle cx="48" cy="45.5" r="1" fill="#FFF" />

            {/* Adorable 3-toed bird claws standing up! */}
            <g id="bird-feet">
              <path d="M 38 85 L 38 92 M 38 92 L 32 95 M 38 92 L 38 96 M 38 92 L 44 95" stroke="#ED8936" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 62 85 L 62 92 M 62 92 L 56 95 M 62 92 L 62 96 M 62 92 L 68 95" stroke="#ED8936" strokeWidth="3.5" strokeLinecap="round" />
            </g>

            {/* Flapping Wings on sides */}
            <motion.path
              d="M 21,54 Q 8,50 17,43"
              stroke="url(#bird-body-grad)"
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
              animate={action === 'play' ? { rotate: [0, -32, 0] } : { rotate: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: action === 'play' ? 0.35 : 1.6 }}
            />
            <motion.path
              d="M 79,54 Q 92,50 83,43"
              stroke="url(#bird-body-grad)"
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
              animate={action === 'play' ? { rotate: [0, 32, 0] } : { rotate: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: action === 'play' ? 0.35 : 1.6 }}
            />
          </>
        );

      case 'turtle':
        return (
          <>
            {/* Turtle Shell Flaps/Flippers - round and chubby */}
            <g id="turtle-legs">
              {/* Back Legs */}
              <ellipse cx="22" cy="76" rx="8" ry="6" fill="url(#turtle-body-grad)" stroke={pColor.border} strokeWidth="2.5" />
              <ellipse cx="78" cy="76" rx="8" ry="6" fill="url(#turtle-body-grad)" stroke={pColor.border} strokeWidth="2.5" />
              {/* Front Legs */}
              <ellipse cx="23" cy="62" rx="9" ry="7.5" fill="url(#turtle-body-grad)" stroke={pColor.border} strokeWidth="2.5" />
              <ellipse cx="77" cy="62" rx="9" ry="7.5" fill="url(#turtle-body-grad)" stroke={pColor.border} strokeWidth="2.5" />
            </g>
            
            {/* Tail */}
            <polygon points="81,66 94,76 80,78" fill="url(#turtle-body-grad)" stroke={pColor.border} strokeWidth="2.5" />

            {/* Shell base with soft glossy gradient */}
            <ellipse cx="50" cy="62" rx="31" ry="24" fill="url(#turtle-shell-grad)" stroke={pColor.border} strokeWidth="3.2" />
            {/* High-quality shell segments instead of sparse dashes */}
            <path d="M 40,50 L 60,50 L 67,62 L 60,74 L 40,74 L 33,62 Z" fill="none" stroke="#68D391" strokeWidth="2" opacity="0.4" />
            <path d="M 50,38 L 50,50 M 50,74 L 50,86 M 19,62 L 33,62 M 67,62 L 81,62" stroke="#68D391" strokeWidth="2" opacity="0.4" />

            {/* Round lovable Head peeking out */}
            <ellipse cx="50" cy="33" rx="18" ry="16" fill="url(#turtle-body-grad)" stroke={pColor.border} strokeWidth="3" />
            {/* Head blush patch */}
            <ellipse cx="50" cy="38" rx="8" ry="6" fill={pColor.belly} opacity="0.3" />
          </>
        );

      default:
        return null;
    }
  };

  // Render Costume Overlays
  const renderCostume = () => {
    // Evolutions of level 8+ suppress costumes visually based on requirements:
    // "进化后服装失效"
    if (stage !== 'base' || costume === 'none') return null;

    if (costume === 'costume1') {
      // 潮流装: Red-white street cap + black glasses
      return (
        <g id="costume-1-group">
          {/* Streetwear Cap */}
          <ellipse cx="50" cy="24" rx="26" ry="10" fill="#E53E3E" stroke="#742A2A" strokeWidth="2.5" />
          <path d="M 24 24 Q 50 14 76 24 C 65 6 35 6 24 24" fill="#E53E3E" stroke="#742A2A" strokeWidth="2.5" />
          {/* Star on Cap */}
          <polygon points="50,11 52,15 57,15 53,18 55,22 50,20 45,22 47,18 43,15 48,15" fill="#FAF089" />
          {/* Cap Visor */}
          <path d="M 32 23 L 14 26 L 15 30 L 36 24 Z" fill="#FFFFFF" stroke="#4A5568" strokeWidth="2" />

          {/* Cool Sunglasses */}
          <polygon points="26,38 44,38 41,45 29,45" fill="#1A202C" stroke="#718096" strokeWidth="2.5" />
          <polygon points="56,38 74,38 71,45 59,45" fill="#1A202C" stroke="#718096" strokeWidth="2.5" />
          <line x1="44" y1="41" x2="56" y2="41" stroke="#718096" strokeWidth="3" />
          {/* Glare line on glasses */}
          <line x1="28" y1="40" x2="34" y2="44" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.7" />
          <line x1="58" y1="40" x2="64" y2="44" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.7" />
        </g>
      );
    }

    if (costume === 'costume2') {
      // 皇家装: Purple-gold imperial collar / cape + shiny diamond necklace
      return (
        <g id="costume-2-group">
          {/* Imperial Cape top collar */}
          <path d="M 23 72 C 30 76 70 76 77 72 C 85 85 15 85 23 72 Z" fill="#805AD5" stroke="#44337A" strokeWidth="2" />
          {/* Golden margins */}
          <path d="M 23 72 C 30 76 70 76 77 72" fill="none" stroke="#D69E2E" strokeWidth="3" />
          
          {/* Diamond pendant necklet */}
          <line x1="38" y1="67" x2="62" y2="67" stroke="#D69E2E" strokeWidth="2.5" />
          <circle cx="38" cy="67" r="2" fill="#D69E2E" />
          <circle cx="62" cy="67" r="2" fill="#D69E2E" />
          {/* Gem */}
          <polygon points="50,65 54,69 50,73 46,69" fill="#63B3ED" stroke="#2B6CB0" strokeWidth="1.5" />
        </g>
      );
    }

    return null;
  };

  // Evolution Backdrops/VFX
  const renderEvoBackdrop = () => {
    if (stage === 'evo1') {
      // 觉醒形态: Soft purple-blue halo effect + wings behind pet
      return (
        <>
          {/* Delicate Angel Wings behind */}
          <g opacity="0.85">
            {/* Left wing */}
            <motion.path
              d="M 22 55 C 5 45 -5 62 12 70 C 5 75 10 82 23 76"
              fill="#EBF8FF"
              stroke="#90CDF4"
              strokeWidth="2.5"
              animate={{ rotate: [-2, 4, -2] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{ originX: '22px', originY: '76px' }}
            />
            {/* Right wing */}
            <motion.path
              d="M 78 55 C 95 45 105 62 88 70 C 95 75 90 82 77 76"
              fill="#EBF8FF"
              stroke="#90CDF4"
              strokeWidth="2.5"
              animate={{ rotate: [2, -4, 2] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{ originX: '77px', originY: '76px' }}
            />
          </g>

          {/* Floating glowing halo above head */}
          <motion.g
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <ellipse cx="50" cy="11" rx="18" ry="4.5" fill="none" stroke="#FAF089" strokeWidth="3" opacity="0.9" />
            <ellipse cx="50" cy="11" rx="14" ry="3.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" />
          </motion.g>
        </>
      );
    }

    if (stage === 'evo2') {
      // 传说形态: Majestic rotation aura, golden wings, supreme crown
      return (
        <>
          {/* Rotating celestial sun ray backdrop */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '50px', originY: '56px' }}
            opacity="0.35"
          >
            <circle cx="50" cy="56" r="42" fill="none" stroke="#FAF089" strokeWidth="1" strokeDasharray="4,8" />
            {/* Radial sunburst items */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={i}
                x1="50"
                y1="56"
                x2={50 + 44 * Math.cos((i * Math.PI) / 4)}
                y2={56 + 44 * Math.sin((i * Math.PI) / 4)}
                stroke="#FAF089"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ))}
          </motion.g>

          {/* Grand Golden Wings */}
          <g opacity="0.95">
            {/* Left wing */}
            <motion.path
              d="M 22 55 C -2 40 -12 65 14 74 C 2 82 8 92 23 78"
              fill="#FEFCBF"
              stroke="#ECC94B"
              strokeWidth="3.5"
              animate={{ rotate: [-4, 6, -4], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              style={{ originX: '22px', originY: '78px' }}
            />
            {/* Right wing */}
            <motion.path
              d="M 78 55 C 102 40 112 65 86 74 C 98 82 92 92 77 78"
              fill="#FEFCBF"
              stroke="#ECC94B"
              strokeWidth="3.5"
              animate={{ rotate: [4, -6, 4], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              style={{ originX: '77px', originY: '78px' }}
            />
          </g>

          {/* Supreme Crown */}
          <motion.g
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          >
            <ellipse cx="50" cy="9" rx="20" ry="4" fill="none" stroke="#D69E2E" strokeWidth="1" opacity="0.5" />
            
            {/* Golden Crown Points */}
            <polygon points="34,11 38,0 44,7 50,-4 56,7 62,0 66,11" fill="#D69E2E" stroke="#975A16" strokeWidth="1.5" />
            <circle cx="34" cy="11" r="1.5" fill="#E53E3E" />
            <circle cx="50" cy="11" r="2" fill="#3182CE" />
            <circle cx="66" cy="11" r="1.5" fill="#E53E3E" />
            {/* Crown spheres on pointers */}
            <circle cx="38" cy="0" r="1.5" fill="#FEFCBF" />
            <circle cx="50" cy="-4" r="2" fill="#D69E2E" />
            <circle cx="62" cy="0" r="1.5" fill="#FEFCBF" />
          </motion.g>
        </>
      );
    }

    return null;
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Dynamic evolution badge on corner (visible when level high) */}
      {stage !== 'base' && (
        <span className="absolute -top-1 -right-2 px-1.5 py-0.5 z-10 text-[10px] font-bold rounded-full bg-accent text-foreground shadow border border-amber-300">
          {stage === 'evo1' ? '⚡' : '🌟'}
        </span>
      )}

      <motion.div
        className={`${sizeClasses[size]} mx-auto flex items-center justify-center`}
        animate={getActionAnimation()}
      >
        <svg viewBox="0 0 100 110" width="100%" height="100%">
          <defs>
            {/* Soft linear gradients for a 3D cartoon style */}
            <linearGradient id="cat-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
            <linearGradient id="cat-belly-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF7ED" />
              <stop offset="100%" stopColor="#FFEDD5" />
            </linearGradient>

            <linearGradient id="dog-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ED8936" />
              <stop offset="100%" stopColor="#C05621" />
            </linearGradient>
            <linearGradient id="dog-belly-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFAF0" />
              <stop offset="100%" stopColor="#FEEBC8" />
            </linearGradient>

            <linearGradient id="rabbit-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="rabbit-belly-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF5F5" />
              <stop offset="100%" stopColor="#FED7D7" />
            </linearGradient>

            <linearGradient id="hamster-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
            <linearGradient id="hamster-belly-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFA" />
              <stop offset="100%" stopColor="#FEF9C3" />
            </linearGradient>

            <linearGradient id="bird-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="bird-belly-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F0F9FF" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>

            <linearGradient id="turtle-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id="turtle-shell-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#166534" />
              <stop offset="100%" stopColor="#14532D" />
            </linearGradient>
          </defs>

          {/* Background effects of evolution */}
          {renderEvoBackdrop()}

          {/* Core animal body */}
          {renderAnimalBody()}

          {/* Emotional face layers */}
          <g id="face-group">
            {renderEyes()}
            {renderMouth()}
          </g>

          {/* Costume overrides (on top) */}
          {renderCostume()}
        </svg>
      </motion.div>
    </div>
  );
};
