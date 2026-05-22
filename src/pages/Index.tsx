import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { loadPets, adoptPet, deletePet } from '../lib/petStore';
import { Pet, PetType, PET_CLASSES } from '../types/pet';
import { PetCard } from '../components/PetCard';
import { AddPetDialog } from '../components/AddPetDialog';
import { Plus, Flower2, Search, SlidersHorizontal, Sparkles, Trophy } from 'lucide-react';

export const Index: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isAdoptOpen, setIsAdoptOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Reload pets on mount or when customized local notifications trigger
  const fetchPets = () => {
    setPets(loadPets());
  };

  useEffect(() => {
    fetchPets();

    // Listen to custom store update events
    const handleUpdate = () => {
      fetchPets();
    };
    window.addEventListener('pets-updated', handleUpdate);
    return () => {
      window.removeEventListener('pets-updated', handleUpdate);
    };
  }, []);

  // Handle new adoption
  const handleAdopt = (studentName: string, petName: string, type: PetType) => {
    adoptPet(studentName, petName, type);
    fetchPets();
  };

  // Filtered list
  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.petName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedTypeFilter === 'all' || pet.petType === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen pb-16 bg-background">
      {/* Dynamic cute background clouds */}
      <div className="absolute top-10 left-[8%] w-24 h-12 bg-white rounded-full opacity-40 blur-[1px] animate-cloud-slow pointer-events-none hidden md:block" />
      <div className="absolute top-36 right-[10%] w-32 h-14 bg-white rounded-full opacity-40 blur-[1px] animate-cloud-medium pointer-events-none hidden md:block" />

      {/* Main Header Row */}
      <header className="max-w-7xl mx-auto px-4 pt-10 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 z-10 relative">
        <div className="flex flex-col">
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-extrabold sm:text-5xl text-foreground tracking-tight select-none"
          >
            🐾 萌宠教室
          </motion.h1>
          <p className="text-sm font-bold text-foreground/60 mt-1 flex items-center gap-1">
            <span>✨ 每位同学都有自己的神奇小萌宠 · 伴随成长每一度</span>
          </p>
        </div>

        {/* Big Actions */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <Link
            to="/garden"
            className="btn-push-secondary px-5 py-3 text-sm font-extrabold flex items-center gap-1.5"
            id="btn-nav-garden"
          >
            <Flower2 className="w-5 h-5 animate-spin-slow text-amber-100" />
            <span>🌿 萌宠花草园</span>
          </Link>

          <Link
            to="/race"
            className="btn-push-accent px-5 py-3 text-sm font-extrabold flex items-center gap-1.5"
            id="btn-nav-race"
          >
            <Trophy className="w-5 h-5 text-yellow-950 stroke-[3.5] animate-bounce" />
            <span className="text-yellow-950 font-black">🏁 萌宠百米竞速赛</span>
          </Link>

          <button
            onClick={() => setIsAdoptOpen(true)}
            className="btn-push px-5 py-3 text-sm font-extrabold flex items-center gap-1.5"
            id="btn-adopt-pet"
          >
            <Plus className="w-5 h-5 text-amber-100 stroke-[3]" />
            <span>➕ 认养新宠物</span>
          </button>
        </div>
      </header>

      {/* Main filter bar area */}
      <section className="max-w-7xl mx-auto px-4 mb-8 z-10 relative">
        <div className="bg-card border-3 border-border rounded-2xl p-4 shadow-[0_6px_0_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-center gap-4">
          {/* Search bar */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-foreground/40" />
            <input
              type="text"
              placeholder="搜索学生姓名或宠物昵称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border-2 border-border/80 focus:border-primary pl-10 pr-4 py-2 rounded-xl text-sm font-bold outline-none text-foreground"
            />
          </div>

          {/* Quick breed selectors */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            <SlidersHorizontal className="w-4 h-4 text-foreground/50 shrink-0 hidden sm:block" />
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 cursor-pointer ${
                selectedTypeFilter === 'all'
                  ? 'bg-primary text-white border-b-2 border-primary-dark shadow-sm'
                  : 'bg-muted border border-border/40 text-foreground/70 hover:bg-muted/70'
              }`}
            >
              全部 (All)
            </button>
            {(Object.keys(PET_CLASSES) as PetType[]).map((type) => {
              const meta = PET_CLASSES[type];
              const isSelected = selectedTypeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white border-b-2 border-primary-dark shadow-sm'
                      : 'bg-muted border border-border/40 text-foreground/70 hover:bg-muted/70'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main pets grid layout */}
      <main className="max-w-7xl mx-auto px-4 z-10 relative">
        {filteredPets.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPets.map((pet, idx) => (
              <PetCard key={pet.id} pet={pet} index={idx} />
            ))}
          </div>
        ) : (
          /* Large beautiful floating empty state card */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-flat bg-card p-12 text-center max-w-xl mx-auto my-12"
          >
            {/* Cute floating egg emoji */}
            <motion.div
              animate={{
                y: [0, -18, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-8xl inline-block drop-shadow-sm filter select-none mb-6"
            >
              🐣
            </motion.div>

            <h2 className="text-2xl font-black text-foreground">
              还没有班级的成长萌宠呢！
            </h2>
            <p className="text-sm font-bold text-foreground/60 mt-3 max-w-sm mx-auto leading-relaxed">
              这里是大家的宠物大本营。点击右上角的 <span className="text-primary font-black">“➕ 认养新宠物”</span>，开启班级趣味激励成长之旅吧！
            </p>

            <button
              onClick={() => setIsAdoptOpen(true)}
              className="btn-push px-6 py-3 test-md font-bold mt-7"
            >
              <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
              <span>立即认养第一只 🚀</span>
            </button>
          </motion.div>
        )}
      </main>

      {/* Adoption dialogue form */}
      <AddPetDialog
        isOpen={isAdoptOpen}
        onClose={() => setIsAdoptOpen(false)}
        onAdopt={handleAdopt}
      />
    </div>
  );
};
