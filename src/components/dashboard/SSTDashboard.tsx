'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  FileSignature,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

const currentMonthIndex = 5; // Junio 2026
const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio'].slice(0, currentMonthIndex + 1);

const moduleSummary = [
  {
    name: 'Inspecciones',
    href: '/warehouse-inspections',
    icon: ClipboardCheck,
    color: '#1E93AB',
    records: 0,
    pending: 0,
    signed: 0,
    pdfs: 0,
    status: 'Activo',
  },
  {
    name: 'Entrega de EPP',
    href: '/epp-deliveries',
    icon: PackageCheck,
    color: '#FF7F11',
    records: 0,
    pending: 0,
    signed: 0,
    pdfs: 0,
    status: 'Activo',
  },
  {
    name: 'Inspeccion de EPP',
    href: '/epp-inspections',
    icon: ShieldCheck,
    color: '#134686',
    records: 0,
    pending: 0,
    signed: 0,
    pdfs: 0,
    status: 'Activo',
  },
];

const monthlyActivity = [
  { month: 'Ene', inspections: 0, deliveries: 0, eppInspections: 0 },
  { month: 'Feb', inspections: 0, deliveries: 0, eppInspections: 0 },
  { month: 'Mar', inspections: 0, deliveries: 0, eppInspections: 0 },
  { month: 'Abr', inspections: 0, deliveries: 0, eppInspections: 0 },
  { month: 'May', inspections: 0, deliveries: 0, eppInspections: 0 },
  { month: 'Jun', inspections: 0, deliveries: 0, eppInspections: 0 },
].slice(0, currentMonthIndex + 1);

const findingStatus = [
  { name: 'Conforme', value: 0, color: '#16A34A' },
  { name: 'Pendiente', value: 0, color: '#FF7F11' },
  { name: 'Critico', value: 0, color: '#E62727' },
];

const recentActivity: any[] = [];

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('rounded-lg border border-[#DCDCDC] bg-white p-4 shadow-sm', className)}>{children}</section>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-[#111827]">{children}</h2>;
}

function StatBox({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[#DCDCDC] bg-[#F3F2EC] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-[#134686]">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: color }}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function SSTDashboard() {
  const [selectedMonth, setSelectedMonth] = useState('junio');

  const totals = useMemo(
    () => ({
      records: moduleSummary.reduce((sum, item) => sum + item.records, 0),
      pending: moduleSummary.reduce((sum, item) => sum + item.pending, 0),
      signed: moduleSummary.reduce((sum, item) => sum + item.signed, 0),
      pdfs: moduleSummary.reduce((sum, item) => sum + item.pdfs, 0),
    }),
    []
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#DCDCDC] bg-[#FFC107] p-3 text-center text-lg font-black uppercase tracking-wide text-[#134686]">
        ARGOS SST - Modulos Implementados
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {months.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => setSelectedMonth(month)}
            className={cn(
              'rounded-md border px-3 py-2 text-sm font-bold capitalize transition',
              selectedMonth === month
                ? 'border-[#134686] bg-[#DCDCDC] text-[#111827]'
                : 'border-[#DCDCDC] bg-white text-[#111827] hover:border-[#1E93AB]'
            )}
          >
            {month}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox label="Registros del sistema" value={totals.records} icon={ClipboardCheck} color="#1E93AB" />
        <StatBox label="Pendientes" value={totals.pending} icon={AlertTriangle} color="#E62727" />
        <StatBox label="Registros firmados" value={totals.signed} icon={FileSignature} color="#FF7F11" />
        <StatBox label="PDF generados" value={totals.pdfs} icon={FileDown} color="#134686" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <SectionTitle>Estado por modulo</SectionTitle>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {moduleSummary.map((module) => (
              <a
                key={module.name}
                href={module.href}
                className="rounded-lg border border-[#DCDCDC] bg-white p-4 transition hover:border-[#1E93AB] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-gray-500">{module.status}</p>
                    <h3 className="mt-1 text-lg font-black text-[#134686]">{module.name}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: module.color }}>
                    <module.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-[#F3F2EC] p-2">
                    <p className="text-xs font-bold text-gray-500">Registros</p>
                    <p className="text-xl font-black text-[#111827]">{module.records}</p>
                  </div>
                  <div className="rounded-md bg-[#F3F2EC] p-2">
                    <p className="text-xs font-bold text-gray-500">Pendientes</p>
                    <p className="text-xl font-black text-[#E62727]">{module.pending}</p>
                  </div>
                  <div className="rounded-md bg-[#F3F2EC] p-2">
                    <p className="text-xs font-bold text-gray-500">Firmados</p>
                    <p className="text-xl font-black text-[#134686]">{module.signed}</p>
                  </div>
                  <div className="rounded-md bg-[#F3F2EC] p-2">
                    <p className="text-xs font-bold text-gray-500">PDF</p>
                    <p className="text-xl font-black text-[#FF7F11]">{module.pdfs}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle>Resultado de inspecciones</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.8fr_1fr]">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={findingStatus} dataKey="value" innerRadius={48} outerRadius={76} strokeWidth={0}>
                    {findingStatus.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-2">
              {findingStatus.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-md bg-[#F3F2EC] px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-black text-[#111827]">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="text-lg font-black text-[#134686]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <div className="mb-3 flex items-center justify-between gap-3">
            <SectionTitle>Actividad mensual</SectionTitle>
            <span className="rounded-full bg-[#F3F2EC] px-3 py-1 text-xs font-black capitalize text-[#134686]">{selectedMonth} 2026</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyActivity}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="inspections" name="Inspecciones" fill="#1E93AB" radius={[3, 3, 0, 0]} />
                <Bar dataKey="deliveries" name="Entrega EPP" fill="#FF7F11" radius={[3, 3, 0, 0]} />
                <Bar dataKey="eppInspections" name="Inspeccion EPP" fill="#134686" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <SectionTitle>Ultima actividad</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#DCDCDC] text-xs font-black uppercase tracking-wide text-gray-500">
                  <th className="pb-2">Modulo</th>
                  <th className="pb-2">Detalle</th>
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCDCDC]">
                {recentActivity.map((item) => (
                  <tr key={`${item.module}-${item.detail}`}>
                    <td className="py-3 font-black text-[#134686]">{item.module}</td>
                    <td className="py-3">{item.detail}</td>
                    <td className="py-3">{item.date}</td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-xs font-black',
                          item.status === 'Completo'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'En proceso'
                              ? 'bg-orange-100 text-[#B45309]'
                              : 'bg-red-100 text-[#E62727]'
                        )}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel className="border-l-4 border-l-[#1E93AB]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-[#1E93AB]" />
            <div>
              <p className="text-xs font-black uppercase text-gray-500">Alcance actual del dashboard</p>
              <p className="text-lg font-black text-[#134686]">Inspecciones, Entrega de EPP e Inspeccion de EPP</p>
            </div>
          </div>
          <div className="rounded-md bg-[#F3F2EC] px-4 py-2 text-sm font-bold text-[#111827]">
            Plan anual SST y asistencia se integraran cuando esos modulos existan.
          </div>
        </div>
      </Panel>
    </div>
  );
}
