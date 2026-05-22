import React from 'react';
import { PetType, getEvolutionStage } from '../types/pet';
import { PetSprite } from './PetSprite';

interface PetAvatarProps {
  type: PetType;
  level: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const PetAvatar: React.FC<PetAvatarProps> = ({
  type,
  level,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-10 h-10',
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
  };

  return (
    <div
      className={`rounded-full border-2 border-border bg-card shadow-sm flex items-center justify-center p-1 overflow-hidden relative ${sizeClasses[size]} ${className}`}
    >
      <div className="absolute inset-0 bg-radial from-transparent to-black/5 pointer-events-none" />
      <PetSprite type={type} level={level} size={size === 'xs' ? 'sm' : size === 'sm' ? 'md' : 'lg'} className="w-full h-full scale-105" />
    </div>
  );
};
