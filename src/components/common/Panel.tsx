import { cn } from '@/lib/utils';
import React from 'react';

export const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn('rounded-lg border border-[#DCDCDC] bg-white p-4 shadow-sm', className)}>
    {children}
  </section>
);
