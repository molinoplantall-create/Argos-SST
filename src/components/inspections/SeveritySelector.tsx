'use client';

import React from 'react';
import { clsx } from 'clsx';

interface SeveritySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const SeveritySelector: React.FC<SeveritySelectorProps> = ({ value, onChange }) => {
  const levels = [
    { id: 'A', label: 'A - Crítico', color: 'bg-[#EF4444]', activeShadow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' },
    { id: 'B', label: 'B - Alto', color: 'bg-[#F59E0B]', activeShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' },
    { id: 'C', label: 'C - Medio', color: 'bg-[#10B981]', activeShadow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Nivel de Severidad</label>
      <div className="grid grid-cols-3 gap-3">
        {levels.map((level) => (
          <button
            key={level.id}
            type="button"
            onClick={() => onChange(level.id)}
            className={clsx(
              "relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 border-2",
              value === level.id 
                ? `${level.color} border-transparent text-white scale-105 ${level.activeShadow} z-10` 
                : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
            )}
          >
            <span className="text-xl font-black mb-1">{level.id}</span>
            <span className="text-[10px] font-bold uppercase whitespace-nowrap">{level.label.split(' - ')[1]}</span>
            {value === level.id && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm animate-bounce">
                <div className={clsx("w-2 h-2 rounded-full", level.color)} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
