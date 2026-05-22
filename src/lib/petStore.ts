import { Pet, PetType, CostumeId, XP_PER_LEVEL, getEvolutionStage } from '../types/pet';

const STORAGE_KEY = 'classroom-pets';

// Helper to load pets from LocalStorage
export function loadPets(): Pet[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : getDemoPets();
  } catch (error) {
    console.error('Failed to load pets:', error);
    return getDemoPets();
  }
}

// Helper to save pets to LocalStorage
export function savePets(pets: Pet[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
    // Dispatch custom event to notify other components/views of state updates
    window.dispatchEvent(new Event('pets-updated'));
  } catch (error) {
    console.error('Failed to save pets:', error);
  }
}

// Generates initial demo data to avoid completely empty state
function getDemoPets(): Pet[] {
  return [
    {
      id: 'demo-1',
      studentName: '王小明',
      petName: '橙子',
      petType: 'cat',
      level: 3,
      xp: 40,
      xpToNext: XP_PER_LEVEL,
      mood: 90,
      hunger: 80,
      energy: 85,
      activeCostume: 'none',
    },
    {
      id: 'demo-2',
      studentName: '李美美',
      petName: '布丁',
      petType: 'rabbit',
      level: 8,
      xp: 15,
      xpToNext: XP_PER_LEVEL,
      mood: 75,
      hunger: 45,
      energy: 60,
      activeCostume: 'costume1',
    },
    {
      id: 'demo-3',
      studentName: '张小帅',
      petName: '阿黄',
      petType: 'dog',
      level: 15,
      xp: 80,
      xpToNext: XP_PER_LEVEL,
      mood: 95,
      hunger: 90,
      energy: 90,
      activeCostume: 'none',
    }
  ];
}

// Sub-values bounding clamp
function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(val)));
}

// Adds a new pet
export function adoptPet(studentName: string, petName: string, petType: PetType): Pet {
  const newPet: Pet = {
    id: `pet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentName,
    petName,
    petType,
    level: 1,
    xp: 0,
    xpToNext: XP_PER_LEVEL,
    mood: 80,
    hunger: 80,
    energy: 80,
    activeCostume: 'none',
  };

  const pets = loadPets();
  pets.push(newPet);
  savePets(pets);
  return newPet;
}

// Delete a pet
export function deletePet(id: string) {
  const pets = loadPets();
  const updated = pets.filter((p) => p.id !== id);
  savePets(updated);
}

// Action effect returns a boolean if level changed
interface AddXpResult {
  pet: Pet;
  levelUp: boolean;
  oldLevel: number;
}

export function addXp(id: string, amount: number): AddXpResult {
  const pets = loadPets();
  const index = pets.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Pet not found');

  const pet = { ...pets[index] };
  const oldLevel = pet.level;

  // Add stats modifications
  pet.mood = clamp(pet.mood + amount / 2);
  pet.hunger = clamp(pet.hunger - amount / 4);
  pet.energy = clamp(pet.energy - amount / 5);

  // Add XP and level up
  let newXp = pet.xp + amount;
  let newLevel = pet.level;

  while (newXp >= XP_PER_LEVEL) {
    newXp -= XP_PER_LEVEL;
    newLevel += 1;
  }

  pet.xp = newXp;
  pet.level = newLevel;
  pet.xpToNext = XP_PER_LEVEL;

  // Check evolution after level change, we can reset clothing if evolved to separate stage
  const oldStage = getEvolutionStage(oldLevel);
  const newStage = getEvolutionStage(newLevel);
  if (oldStage !== newStage) {
    // If evolved, we can default active costume back to none as evo shape is priority
    pet.activeCostume = 'none';
  }

  pets[index] = pet;
  savePets(pets);

  return {
    pet,
    levelUp: newLevel > oldLevel,
    oldLevel,
  };
}

export function feedPet(id: string): Pet {
  const pets = loadPets();
  const index = pets.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Pet not found');

  const pet = { ...pets[index] };
  pet.hunger = clamp(pet.hunger + 25);
  pet.energy = clamp(pet.energy + 10);

  pets[index] = pet;
  savePets(pets);
  return pet;
}

export function playWithPet(id: string): Pet {
  const pets = loadPets();
  const index = pets.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Pet not found');

  const pet = { ...pets[index] };
  pet.mood = clamp(pet.mood + 20);
  pet.energy = clamp(pet.energy - 15);

  pets[index] = pet;
  savePets(pets);
  return pet;
}

export function restPet(id: string): Pet {
  const pets = loadPets();
  const index = pets.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Pet not found');

  const pet = { ...pets[index] };
  pet.energy = clamp(pet.energy + 30);
  pet.mood = clamp(pet.mood + 5);

  pets[index] = pet;
  savePets(pets);
  return pet;
}

export function changeCostume(id: string, costume: CostumeId): Pet {
  const pets = loadPets();
  const index = pets.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Pet not found');

  const pet = { ...pets[index] };
  pet.activeCostume = costume;

  pets[index] = pet;
  savePets(pets);
  return pet;
}
