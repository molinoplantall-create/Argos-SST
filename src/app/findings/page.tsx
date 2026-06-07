'use client';

import React, { useEffect, useState, useCallback } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, Clock, CheckCircle2, Search,
  Filter, X, RefreshCw, ChevronDown, User,
  Calendar, Building2, Plus, Eye
} from 'lucide-react';
import { useFeedback } from '@/components/common/FeedbackUI';

// ─── Types ───────────────────────────────────────────────────────────────────
type Severity = 'A' | 'B' | 'C';
type FindingStatus = 'ABIERTO' | 'EN_PROCESO' | 'CERRADO' | 'ANULADO';

interface Finding {
  id: string;
  observation: string;
  severity: Severity;
  status: FindingStatus;
  finding_type: string | null;
  root_cause: string | null;
  deadline: string | null;
  created_at: string;
  // Relaciones
  areas?: { name: string };
  responsible?: { full_name: string };
  inspection?: { inspection_date: string };
  client_id: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string }> = {
  A: { label: 'Crítico', color: 'text-red-700', bg: 'bg-red-100' },
  B: { label: 'Moderado', color: 'text-orange-700', bg: 'bg-orange-100' },
  C: { label: 'Leve', color: 'text-yellow-700', bg: 'bg-yellow-100' },
};

const STATUS_CONFIG: Record<FindingStatus, { label: string; icon: any; color: string; bg: string }> = {
  ABIERTO:    { label: 'Abierto',    icon: AlertTriangle, color: 'text-red-700',    bg: 'bg-red-100'    },
  EN_PROCESO: { label: 'En Proceso', icon: Clock,         color: 'text-orange-700', bg: 'bg-orange-100' },
  CERRADO:    { label: 'Cerrado',    icon: CheckCircle2,  color: 'text-green-700',  bg: 'bg-green-100'  },
  ANULADO:    { label: 'Anulado',    icon: X,             color: 'text-gray-500',   bg: 'bg-gray-100'   },
};

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black', cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status, onClick }: { status: FindingStatus; onClick?: () => void }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition-all',
        cfg.bg, cfg.color,
        onClick && 'hover:opacity-70 cursor-pointer'
      )}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </button>
  );
}

// ─── Drawer de detalle / cambio de estado ────────────────────────────────────
function FindingDrawer({
  finding,
  onClose,
  onStatusChange,
}: {
  finding: Finding | null;
  onClose: () => void;
  onStatusChange: (id: string, status: FindingStatus) => void;
}) {
  const [newStatus, setNewStatus] = useState<FindingStatus | ''>('');

  useEffect(() => {
    if (finding) setNewStatus('');
  }, [finding]);

  if (!finding) return null;

  const sev = SEVERITY_CONFIG[finding.severity];
  const sts = STATUS_CONFIG[finding.status];

  const handleSave = () => {
    if (newStatus && newStatus !== finding.status) {
      onStatusChange(finding.id, newStatus as FindingStatus);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCDCDC] bg-[#F3F2EC]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">Detalle del Hallazgo</p>
            <h2 className="text-sm font-black text-[#134686] mt-0.5 line-clamp-1">{finding.observation}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#DCDCDC] transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-black', sev.bg, sev.color)}>
              Severidad {finding.severity} — {sev.label}
            </span>
            <StatusBadge status={finding.status} />
          </div>

          {/* Observación */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-1">Observación</p>
            <p className="text-sm text-[#1a1a1a] leading-relaxed">{finding.observation}</p>
          </div>

          {/* Causa raíz */}
          {finding.root_cause && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-1">Causa Raíz</p>
              <p className="text-sm text-[#1a1a1a] leading-relaxed">{finding.root_cause}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            {finding.areas?.name && (
              <div className="bg-[#F3F2EC] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase">Área</span>
                </div>
                <p className="text-sm font-bold text-[#134686]">{finding.areas.name}</p>
              </div>
            )}
            {finding.deadline && (
              <div className="bg-[#F3F2EC] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase">Vencimiento</span>
                </div>
                <p className="text-sm font-bold text-[#134686]">
                  {new Date(finding.deadline).toLocaleDateString('es-PE')}
                </p>
              </div>
            )}
            {finding.responsible?.full_name && (
              <div className="bg-[#F3F2EC] rounded-xl p-3 col-span-2">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase">Responsable</span>
                </div>
                <p className="text-sm font-bold text-[#134686]">{finding.responsible.full_name}</p>
              </div>
            )}
          </div>

          {/* Cambiar estado */}
          <div className="border-t border-[#DCDCDC] pt-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Actualizar Estado</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STATUS_CONFIG) as FindingStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;
                const selected = (newStatus || finding.status) === s;
                return (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-black transition-all',
                      selected
                        ? 'border-[#134686] bg-[#134686] text-white'
                        : 'border-[#DCDCDC] bg-white text-gray-600 hover:border-[#1E93AB]'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#DCDCDC] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#DCDCDC] rounded-xl text-sm font-bold hover:bg-[#F3F2EC] transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-[#134686] text-white rounded-xl text-sm font-bold hover:bg-[#0f3460] transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function FindingsPage() {
  const { showToast } = useFeedback();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FindingStatus | 'TODOS'>('TODOS');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'TODOS'>('TODOS');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('findings')
      .select(`
        id, observation, severity, status, finding_type,
        root_cause, deadline, created_at, client_id,
        areas(name),
        responsible:profiles!findings_responsible_id_fkey(full_name),
        inspection:inspections(inspection_date)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      showToast('Error al cargar hallazgos', 'error');
    } else {
      setFindings((data as any[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: FindingStatus) => {
    const { error } = await supabase
      .from('findings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      showToast('Error al actualizar el estado', 'error');
    } else {
      showToast('Estado actualizado correctamente', 'success');
      setFindings((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
    }
  };

  // Filtros
  const filtered = findings.filter((f) => {
    const matchSearch = !search ||
      f.observation.toLowerCase().includes(search.toLowerCase()) ||
      (f.areas?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'TODOS' || f.status === filterStatus;
    const matchSeverity = filterSeverity === 'TODOS' || f.severity === filterSeverity;
    return matchSearch && matchStatus && matchSeverity;
  });

  // Totales
  const counts = {
    A: findings.filter((f) => f.severity === 'A' && f.status !== 'CERRADO').length,
    pendiente: findings.filter((f) => f.status === 'ABIERTO' || f.status === 'EN_PROCESO').length,
    cerrado: findings.filter((f) => f.status === 'CERRADO').length,
  };

  return (
    <IndustrialLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-[#1a1a1a]">Hallazgos</h1>
            <p className="text-sm text-gray-500 mt-0.5">{findings.length} registros en total</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DCDCDC] rounded-xl text-sm font-bold text-gray-600 hover:border-[#1E93AB] transition-all self-start sm:self-auto"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Actualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFilterSeverity(filterSeverity === 'A' ? 'TODOS' : 'A')}
            className={cn(
              'bg-white p-4 border rounded-xl flex items-center gap-3 text-left transition-all hover:shadow-md',
              filterSeverity === 'A' ? 'border-red-400 ring-2 ring-red-100' : 'border-[#DCDCDC]'
            )}
          >
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#134686]">{counts.A}</p>
              <p className="text-[10px] font-black uppercase text-gray-500">Críticos</p>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus(filterStatus === 'ABIERTO' ? 'TODOS' : 'ABIERTO')}
            className={cn(
              'bg-white p-4 border rounded-xl flex items-center gap-3 text-left transition-all hover:shadow-md',
              filterStatus === 'ABIERTO' ? 'border-orange-400 ring-2 ring-orange-100' : 'border-[#DCDCDC]'
            )}
          >
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#134686]">{counts.pendiente}</p>
              <p className="text-[10px] font-black uppercase text-gray-500">Pendientes</p>
            </div>
          </button>

          <button
            onClick={() => setFilterStatus(filterStatus === 'CERRADO' ? 'TODOS' : 'CERRADO')}
            className={cn(
              'bg-white p-4 border rounded-xl flex items-center gap-3 text-left transition-all hover:shadow-md',
              filterStatus === 'CERRADO' ? 'border-green-400 ring-2 ring-green-100' : 'border-[#DCDCDC]'
            )}
          >
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#134686]">{counts.cerrado}</p>
              <p className="text-[10px] font-black uppercase text-gray-500">Cerrados</p>
            </div>
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="bg-white border border-[#DCDCDC] rounded-xl p-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por observación o área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#DCDCDC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E93AB] focus:border-transparent"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="py-2 px-3 text-sm border border-[#DCDCDC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E93AB] bg-white"
          >
            <option value="TODOS">Todas las severidades</option>
            <option value="A">A — Crítico</option>
            <option value="B">B — Moderado</option>
            <option value="C">C — Leve</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="py-2 px-3 text-sm border border-[#DCDCDC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E93AB] bg-white"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ABIERTO">Abierto</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="CERRADO">Cerrado</option>
            <option value="ANULADO">Anulado</option>
          </select>
        </div>

        {/* Tabla / Lista */}
        <div className="bg-white border border-[#DCDCDC] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <RefreshCw className="w-5 h-5 text-[#1E93AB] animate-spin" />
              <span className="text-sm text-gray-500 font-medium">Cargando hallazgos...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <AlertTriangle className="w-10 h-10 opacity-30" />
              <p className="text-sm font-bold">No se encontraron hallazgos</p>
              {(search || filterStatus !== 'TODOS' || filterSeverity !== 'TODOS') && (
                <button
                  onClick={() => { setSearch(''); setFilterStatus('TODOS'); setFilterSeverity('TODOS'); }}
                  className="text-xs text-[#1E93AB] font-bold hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Cabecera — solo en desktop */}
              <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[#DCDCDC] bg-[#F3F2EC]">
                {['Severidad', 'Observación', 'Área', 'Vencimiento', 'Estado', ''].map((h) => (
                  <span key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</span>
                ))}
              </div>

              <div className="divide-y divide-[#DCDCDC]">
                {filtered.map((finding) => (
                  <div
                    key={finding.id}
                    className="px-5 py-4 hover:bg-[#F3F2EC]/60 transition-colors"
                  >
                    {/* Mobile layout */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#1a1a1a] flex-1 line-clamp-2">{finding.observation}</p>
                        <SeverityBadge severity={finding.severity} />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <StatusBadge status={finding.status} onClick={() => setSelectedFinding(finding)} />
                        {finding.areas?.name && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />{finding.areas.name}
                          </span>
                        )}
                        {finding.deadline && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(finding.deadline).toLocaleDateString('es-PE')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                      <SeverityBadge severity={finding.severity} />
                      <p className="text-sm font-medium text-[#1a1a1a] line-clamp-2">{finding.observation}</p>
                      <span className="text-sm text-gray-500">{finding.areas?.name ?? '—'}</span>
                      <span className="text-sm text-gray-500">
                        {finding.deadline
                          ? new Date(finding.deadline).toLocaleDateString('es-PE')
                          : '—'}
                      </span>
                      <StatusBadge status={finding.status} onClick={() => setSelectedFinding(finding)} />
                      <button
                        onClick={() => setSelectedFinding(finding)}
                        className="p-2 rounded-lg hover:bg-[#DCDCDC] transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pie de tabla */}
              <div className="px-5 py-3 border-t border-[#DCDCDC] bg-[#F3F2EC] text-xs font-bold text-gray-500">
                Mostrando {filtered.length} de {findings.length} hallazgos
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drawer de detalle */}
      <FindingDrawer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onStatusChange={handleStatusChange}
      />
    </IndustrialLayout>
  );
}
