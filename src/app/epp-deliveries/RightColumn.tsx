'use client';

import React from 'react';
import { FileSignature, PackageCheck, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type DeliveryStatus = 'ENTREGADO' | 'PENDIENTE' | 'BAJA';

function getDeliveryStatus(delivery: {
  status: string;
  delivered_by_signature_url?: string | null;
  epp_delivery_items?: { worker_signature_url?: string | null }[];
}): DeliveryStatus {
  if (delivery.status === 'BAJA' || delivery.status === 'ANULADO') return 'BAJA';
  const items = delivery.epp_delivery_items ?? [];
  const allSigned =
    delivery.delivered_by_signature_url &&
    items.length > 0 &&
    items.every((i) => i.worker_signature_url);
  return allSigned ? 'ENTREGADO' : 'PENDIENTE';
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const styles: Record<DeliveryStatus, string> = {
    ENTREGADO: 'bg-green-100 text-green-700',
    PENDIENTE: 'bg-amber-100 text-amber-700',
    BAJA: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={cn('rounded-full px-2 py-1 text-[10px] font-black', styles[status])}>
      {status}
    </span>
  );
}

const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn('rounded-lg border border-[#DCDCDC] bg-white p-4 shadow-sm', className)}>
    {children}
  </section>
);
