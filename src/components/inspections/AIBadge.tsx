'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export const AIBadge: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1E93AB]/10 text-[#1E93AB] rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
      <Sparkles className="w-3 h-3" />
      <span>Auto-completado por IA</span>
    </div>
  );
};
