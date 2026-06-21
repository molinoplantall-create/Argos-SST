'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { SignatureDialog } from '@/components/common/SignatureDialog';
import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/common/FeedbackUI';
import {
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  FileSignature,
  ImagePlus,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type EppCondition = 'BUENO' | 'MALO';
type AssignmentStatus = 'ACTIVO' | 'BAJA' | 'REEMPLAZADO' | 'PERDIDO' | 'DEVUELTO';

type Worker = {
  id: string;
  full_name: string;
  document_number: string;
  position: string;
  area: string;
};

type InspectionItem = {
  id: string; // Assignment ID
  name: string;
  size?: string;
  certification?: string;
  assignedDate: string;
  status: AssignmentStatus;
  condition: EppCondition;
  cleaningOk: boolean;
  useOk: boolean;
  observation: string;
  recommendation: string;
  photoName?: string;
  deactivationReason?: string;
};

type SignatureTarget = 'worker' | 'responsible' | null;

const fieldClass =
  'w-full rounded-md border border-[#DCDCDC] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1E93AB] focus:ring-2 focus:ring-[#1E93AB]/20';

const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn('rounded-lg border border-[#DCDCDC] bg-white p-5 shadow-sm', className)}>
    {children}
  </section>
);

function hasIssue(item: InspectionItem) {
  return item.condition === 'MALO' || !item.cleaningOk || !item.useOk;
}

function StatusPill({ item }: { item: InspectionItem }) {
  if (item.status !== 'ACTIVO') {
    return <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-black text-gray-600">{item.status}</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black',
        hasIssue(item) ? 'bg-red-100 text-[#E62727]' : 'bg-green-100 text-green-700'
      )}
    >
      {hasIssue(item) ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
      {hasIssue(item) ? 'Observado' : 'Conforme'}
    </span>
  );
}

export default function EppInspectionsPage() {
  const { showToast } = useFeedback();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [inspectedBy, setInspectedBy] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedItemId, setSelectedItemId] = useState('');
  const [workerSignatureUrl, setWorkerSignatureUrl] = useState('');
  const [responsibleSignatureUrl, setResponsibleSignatureUrl] = useState('');
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget>(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile) setInspectedBy(profile.full_name);
      }

      const { data: wRes } = await supabase.from('workers').select('*').eq('status', 'ACTIVO').order('full_name');
      if (wRes) setWorkers(wRes);
    }
    loadData();
  }, []);

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
  const activeItems = items.filter((item) => item.status === 'ACTIVO');
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? activeItems[0] ?? items[0];

  const observedCount = useMemo(() => activeItems.filter(hasIssue).length, [activeItems]);
  const photoCount = useMemo(() => activeItems.filter((item) => item.photoName).length, [activeItems]);

  async function selectWorker(workerId: string) {
    const worker = workers.find((item) => item.id === workerId);
    if (!worker) return;

    setSelectedWorkerId(worker.id);
    setWorkerSearch(`${worker.document_number} - ${worker.full_name}`);
    setWorkerSignatureUrl('');
    setResponsibleSignatureUrl('');
    setDeactivationReason('');

    try {
      let { data: assignments, error } = await supabase
        .from('worker_epp_assignments')
        .select('*')
        .eq('worker_id', worker.id)
        .eq('status', 'ACTIVO')
        .order('assigned_date', { ascending: false });

      if (error) throw error;

      if (!assignments || assignments.length === 0) {
        // Fallback: cargar desde epp_delivery_items si worker_epp_assignments está vacío
        const { data: legacy } = await supabase
          .from('epp_delivery_items')
          .select('id, epp_name, size, certification, epp_deliveries!inner(worker_id, delivery_date)')
          .eq('epp_deliveries.worker_id', worker.id);

        assignments = legacy;
      }

      if (assignments && assignments.length > 0) {
        const loadedItems: InspectionItem[] = assignments.map((a: any) => ({
          id: a.id,
          name: a.epp_name,
          size: a.size || undefined,
          certification: a.certification || undefined,
          assignedDate: a.assigned_date || a.epp_deliveries?.delivery_date || inspectionDate,
          status: 'ACTIVO',
          condition: 'BUENO',
          cleaningOk: true,
          useOk: true,
          observation: '',
          recommendation: '',
        }));
        setItems(loadedItems);
        setSelectedItemId(loadedItems[0].id);
      } else {
        setItems([]);
        setSelectedItemId('');
        showToast('No se encontraron EPP activos para este trabajador.', 'info');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error al cargar EPPs del trabajador.', 'error');
      setItems([]);
      setSelectedItemId('');
    }
  }

  function updateItem(id: string, patch: Partial<InspectionItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function deactivateSelected(status: AssignmentStatus) {
    if (!selectedItem || !deactivationReason.trim()) {
      showToast('Por favor ingrese un motivo para dar de baja.', 'error');
      return;
    }

    updateItem(selectedItem.id, {
      status,
      deactivationReason: deactivationReason.trim(),
      recommendation: selectedItem.recommendation || 'Retirar de uso y gestionar reposicion.',
    });
    setDeactivationReason('');
  }

  function saveSignature(signatureUrl: string) {
    if (signatureTarget === 'worker') setWorkerSignatureUrl(signatureUrl);
    if (signatureTarget === 'responsible') setResponsibleSignatureUrl(signatureUrl);
    setSignatureTarget(null);
  }

  async function saveInspection(status: 'BORRADOR' | 'FINALIZADO') {
    if (!selectedWorker || items.length === 0) return null;
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('client_id, id').eq('id', user!.id).single();
      
      const docCode = `R-SST-INS-${Date.now().toString().slice(-4)}`;

      const { data: inspection, error: insError } = await supabase.from('epp_inspections').insert({
        client_id: profile!.client_id,
        worker_id: selectedWorker.id,
        inspector_id: profile!.id,
        inspection_date: inspectionDate,
        status,
        document_code: docCode,
        inspector_signature_url: responsibleSignatureUrl || null,
        worker_signature_url: workerSignatureUrl || null
      }).select().single();

      if (insError) throw insError;

      const inspectionDetails = items.map(item => ({
        inspection_id: inspection.id,
        assignment_id: item.id, // Reference to worker_epp_assignments
        condition: item.condition,
        cleaning_ok: item.cleaningOk,
        use_ok: item.useOk,
        observation: item.observation || null,
        recommendation: item.recommendation || null,
        photo_url: item.photoName || null,
        action_taken: item.status !== 'ACTIVO' ? item.status : null
      }));

      // No existe tabla de items de inspeccion aun en el schema provisto pero como los datos principales estan, 
      // actualizaremos el status de la tabla worker_epp_assignments
      
      if (status === 'FINALIZADO') {
        const toUpdate = items.filter(i => i.status !== 'ACTIVO');
        for (const item of toUpdate) {
          await supabase.from('worker_epp_assignments').update({ status: item.status }).eq('id', item.id);
        }
      }

      showToast(`Inspección guardada como ${status}`, 'success');
      return inspection;
    } catch (e: any) {
      showToast(e.message, 'error');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function downloadPdf() {
    if (items.length === 0 || !selectedWorker) return;

    setIsGeneratingPdf(true);
    try {
      const isFullySigned = responsibleSignatureUrl && workerSignatureUrl;
      const insStatus = isFullySigned ? 'FINALIZADO' : 'BORRADOR';
      
      await saveInspection(insStatus);

      const response = await fetch('/api/reports/epp-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentCode: 'SST-EPP-INS',
          revision: '00',
          inspectionDate,
          client: {
            legalName: 'ARGOS SST CLIENTE',
            ruc: '20000000000',
            address: 'LIMA',
            activity: 'MINERIA',
          },
          worker: {
            fullName: selectedWorker.full_name,
            documentNumber: selectedWorker.document_number,
            position: selectedWorker.position,
            area: selectedWorker.area,
          },
          inspectedBy: {
            fullName: inspectedBy,
            signatureUrl: responsibleSignatureUrl,
          },
          workerSignatureUrl,
          items: items.map((item) => ({
            name: item.name,
            size: item.size,
            certification: item.certification,
            assignedDate: item.assignedDate,
            status: item.status,
            condition: item.condition,
            cleaningOk: item.cleaningOk,
            useOk: item.useOk,
            observation: item.observation,
            recommendation: item.recommendation,
            deactivationReason: item.deactivationReason,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || 'No se pudo generar el PDF.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inspeccion-epp-${selectedWorker.document_number}-${inspectionDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <IndustrialLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1E93AB]">
              <ShieldCheck className="h-4 w-4" />
              ARGOS SST / {inspectedBy}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[#134686]">Inspección de EPP</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => saveInspection('BORRADOR')}
              disabled={saving || items.length === 0}
              className="flex items-center gap-2 rounded-md border border-[#DCDCDC] bg-white px-4 py-2 text-sm font-bold text-[#134686] transition hover:border-[#1E93AB] hover:text-[#1E93AB] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar borrador
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={items.length === 0 || isGeneratingPdf || saving}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white transition',
                items.length === 0 || isGeneratingPdf || saving
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-[#134686] hover:bg-[#1E93AB]'
              )}
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {isGeneratingPdf ? 'Generando...' : 'Guardar y Generar PDF'}
            </button>
          </div>
        </div>

        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#111827]">
              <UserRound className="h-4 w-4 text-[#1E93AB]" />
              Trabajador y datos de inspección
            </h2>
            <span className="rounded-full bg-[#F3F2EC] px-3 py-1 text-xs font-bold text-[#134686]">
              Carga solo EPP activos
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
            <label className="space-y-1">
              <span className="text-xs font-bold text-gray-500">Buscar trabajador por DNI o nombre</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  list="workers-list"
                  className={cn(fieldClass, 'pl-9')}
                  value={workerSearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    setWorkerSearch(value);
                    const found = workers.find((worker) => value.includes(worker.document_number) || value.includes(worker.full_name));
                    if (found) selectWorker(found.id);
                  }}
                />
                <datalist id="workers-list">
                  {workers.map((worker) => (
                    <option key={worker.id} value={`${worker.document_number} - ${worker.full_name}`} />
                  ))}
                </datalist>
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-gray-500">Cargo</span>
              <input className={fieldClass} value={selectedWorker?.position || ''} readOnly />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-gray-500">Area / Proyecto</span>
              <input className={fieldClass} value={selectedWorker?.area || ''} readOnly />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-gray-500">Fecha</span>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  className={cn(fieldClass, 'pl-9')}
                  value={inspectionDate}
                  onChange={(event) => setInspectionDate(event.target.value)}
                />
              </div>
            </label>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.85fr_1.15fr_0.65fr]">
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#111827]">
                <ClipboardCheck className="h-4 w-4 text-[#1E93AB]" />
                EPP activos
              </h2>
              <span className="text-xs font-bold text-gray-500">{activeItems.length} activos</span>
            </div>
            <div className="space-y-2">
              {activeItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={cn(
                    'w-full rounded-md border p-3 text-left transition',
                    selectedItem?.id === item.id
                      ? 'border-[#1E93AB] bg-[#F3F2EC]'
                      : 'border-[#DCDCDC] bg-white hover:border-[#1E93AB]'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#134686]">{item.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.certification ?? 'Sin certificacion'} {item.size ? `- Talla ${item.size}` : ''}
                      </p>
                    </div>
                    <StatusPill item={item} />
                  </div>
                </button>
              ))}
              {activeItems.length === 0 && (
                <div className="rounded-md border border-dashed border-[#DCDCDC] p-6 text-center text-sm text-gray-500">
                  Este trabajador no tiene EPP activos para inspeccionar.
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#134686]">{selectedItem.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Entregado: {selectedItem.assignedDate} {selectedItem.certification ? `- ${selectedItem.certification}` : ''}
                    </p>
                  </div>
                  <StatusPill item={selectedItem} />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-gray-500">Estado</span>
                    <select
                      className={fieldClass}
                      value={selectedItem.condition}
                      onChange={(event) => updateItem(selectedItem.id, { condition: event.target.value as EppCondition })}
                    >
                      <option value="BUENO">Bueno</option>
                      <option value="MALO">Malo</option>
                    </select>
                  </label>
                  <label className="flex items-end gap-2 rounded-md border border-[#DCDCDC] px-3 py-2 text-sm font-bold text-[#134686]">
                    <input
                      type="checkbox"
                      checked={selectedItem.cleaningOk}
                      onChange={(event) => updateItem(selectedItem.id, { cleaningOk: event.target.checked })}
                      className="h-4 w-4 accent-[#1E93AB]"
                    />
                    Limpieza conforme
                  </label>
                  <label className="flex items-end gap-2 rounded-md border border-[#DCDCDC] px-3 py-2 text-sm font-bold text-[#134686]">
                    <input
                      type="checkbox"
                      checked={selectedItem.useOk}
                      onChange={(event) => updateItem(selectedItem.id, { useOk: event.target.checked })}
                      className="h-4 w-4 accent-[#1E93AB]"
                    />
                    Uso conforme
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-gray-500">Observacion</span>
                    <textarea
                      className={cn(fieldClass, 'min-h-24 resize-y')}
                      value={selectedItem.observation}
                      onChange={(event) => updateItem(selectedItem.id, { observation: event.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-gray-500">Recomendacion / accion</span>
                    <textarea
                      className={cn(fieldClass, 'min-h-24 resize-y')}
                      value={selectedItem.recommendation}
                      onChange={(event) => updateItem(selectedItem.id, { recommendation: event.target.value })}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      updateItem(selectedItem.id, { photoName: file?.name });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-black transition',
                      selectedItem.photoName ? 'bg-green-100 text-green-700' : 'bg-[#F3F2EC] text-[#134686] hover:bg-[#DCDCDC]'
                    )}
                  >
                    {selectedItem.photoName ? <Camera className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
                    {selectedItem.photoName ? selectedItem.photoName : 'Tomar/Subir foto'}
                  </button>
                </div>

                <div className="rounded-md border border-[#DCDCDC] bg-[#F3F2EC] p-3">
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_auto_auto]">
                    <input
                      className={fieldClass}
                      value={deactivationReason}
                      onChange={(event) => setDeactivationReason(event.target.value)}
                      placeholder="Motivo de baja/reemplazo si corresponde"
                    />
                    <button
                      type="button"
                      onClick={() => deactivateSelected('BAJA')}
                      className="rounded-md border border-[#E62727] px-3 py-2 text-sm font-black text-[#E62727] transition hover:bg-red-50"
                    >
                      Dar de baja
                    </button>
                    <button
                      type="button"
                      onClick={() => deactivateSelected('REEMPLAZADO')}
                      className="rounded-md bg-[#FF7F11] px-3 py-2 text-sm font-black text-white transition hover:bg-[#E62727]"
                    >
                      Reemplazar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-[#DCDCDC] p-8 text-center text-gray-500">
                Selecciona un trabajador con EPP activos para inspeccionarlos.
              </div>
            )}
          </Panel>

          <div className="space-y-4">
            <Panel className="bg-[#134686] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#FFB26B]">Resumen</p>
                  <h2 className="mt-2 text-lg font-bold">{selectedWorker?.full_name || 'Sin trabajador'}</h2>
                </div>
                <BadgeCheck className="h-8 w-8 text-[#FF7F11]" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Activos</p>
                  <p className="mt-1 text-2xl font-black">{activeItems.length}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Observados</p>
                  <p className="mt-1 text-2xl font-black">{observedCount}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Fotos</p>
                  <p className="mt-1 text-2xl font-black">{photoCount}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Inspector</p>
                  <p className="mt-1 text-sm font-black">{inspectedBy}</p>
                </div>
              </div>
            </Panel>

            <Panel>
              <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-[#134686]">Firmas</h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSignatureTarget('worker')}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-black transition',
                    workerSignatureUrl ? 'border-green-200 bg-green-50 text-green-700' : 'border-[#DCDCDC] text-[#134686] hover:border-[#1E93AB]'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    Trabajador
                  </span>
                  <span>{workerSignatureUrl ? 'Firmado' : 'Pendiente'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureTarget('responsible')}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-black transition',
                    responsibleSignatureUrl ? 'border-green-200 bg-green-50 text-green-700' : 'border-[#DCDCDC] text-[#134686] hover:border-[#1E93AB]'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    Responsable
                  </span>
                  <span>{responsibleSignatureUrl ? 'Firmado' : 'Pendiente'}</span>
                </button>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <SignatureDialog
        open={Boolean(signatureTarget)}
        title={signatureTarget === 'worker' ? `Firma del trabajador: ${selectedWorker?.full_name}` : `Firma inspector: ${inspectedBy}`}
        onClose={() => setSignatureTarget(null)}
        onSave={saveSignature}
      />
    </IndustrialLayout>
  );
}
