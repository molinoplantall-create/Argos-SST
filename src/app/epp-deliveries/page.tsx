'use client';

import React, { useEffect, useMemo, useState } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { SignatureDialog } from '@/components/common/SignatureDialog';
import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/common/FeedbackUI';
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileDown,
  FileSignature,
  HardHat,
  PackageCheck,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CatalogItem = {
  id: string;
  name: string;
  body_zone: string;
  unit: string;
  certification?: string;
  unit_price?: number;
};

type Worker = {
  id: string;
  full_name: string;
  document_number: string;
  position: string;
  area: string;
};

type WorkerAssignment = {
  id: string;
  epp_name: string;
  body_zone?: string;
  size?: string;
  certification?: string;
  assigned_date: string;
  status: string;
};

type DeliveryItem = CatalogItem & {
  quantity: number;
  size?: string;
  observation?: string;
  workerSignatureUrl?: string;
  signedAt?: string;
};

const fieldClass =
  'w-full rounded-md border border-[#DCDCDC] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1E93AB] focus:ring-2 focus:ring-[#1E93AB]/20';

const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn('rounded-lg border border-[#DCDCDC] bg-white p-5 shadow-sm', className)}>
    {children}
  </section>
);

type SignatureTarget =
  | { type: 'worker'; itemIndex: number; title: string }
  | { type: 'responsible'; title: string };

export default function EppDeliveriesPage() {
  const { showToast } = useFeedback();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);

  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [deliveredBy, setDeliveredBy] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEppId, setSelectedEppId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('');
  const [certification, setCertification] = useState('');
  const [observation, setObservation] = useState('Conforme');
  const [responsibleSignatureUrl, setResponsibleSignatureUrl] = useState('');
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget | null>(null);
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [workerCurrentEpps, setWorkerCurrentEpps] = useState<WorkerAssignment[]>([]);
  const [showCurrentEpps, setShowCurrentEpps] = useState(true);
  const [loadingCurrentEpps, setLoadingCurrentEpps] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile) setDeliveredBy(profile.full_name);
      }

      const [wRes, cRes, dRes] = await Promise.all([
        supabase.from('workers').select('*').eq('status', 'ACTIVO').order('full_name'),
        supabase.from('epp_catalog').select('*').eq('is_active', true).order('name'),
        supabase.from('epp_deliveries').select('id, document_code, delivery_date, status, workers(full_name), epp_delivery_items(count)').order('created_at', { ascending: false }).limit(5)
      ]);

      if (wRes.data) setWorkers(wRes.data);
      if (cRes.data) {
        setCatalog(cRes.data);
        if (cRes.data.length > 0) setSelectedEppId(cRes.data[0].id);
      }
      if (dRes.data) setRecentDeliveries(dRes.data);
    }
    loadData();
  }, []);

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
  const selectedEpp = catalog.find((c) => c.id === selectedEppId);

  useEffect(() => {
    if (selectedEpp) setCertification(selectedEpp.certification ?? '');
  }, [selectedEpp]);

  const totalEstimated = useMemo(
    () => items.reduce((sum, item) => sum + (item.unit_price ?? 0) * item.quantity, 0),
    [items]
  );
  const signedItems = useMemo(() => items.filter((item) => item.workerSignatureUrl).length, [items]);

  const filteredCatalog = catalog.filter((item) =>
    `${item.name} ${item.body_zone} ${item.certification ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function selectWorker(workerId: string) {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) return;
    setSelectedWorkerId(worker.id);
    setWorkerSearch(`${worker.document_number} - ${worker.full_name}`);
    setItems([]);
    setResponsibleSignatureUrl('');
    setSignatureTarget(null);
    setWorkerCurrentEpps([]);
    setShowCurrentEpps(true);

    // Cargar EPPs actuales del trabajador
    setLoadingCurrentEpps(true);
    try {
      let { data: assignments } = await supabase
        .from('worker_epp_assignments')
        .select('id, epp_name, body_zone, size, certification, assigned_date, status')
        .eq('worker_id', worker.id)
        .eq('status', 'ACTIVO')
        .order('assigned_date', { ascending: false });

      if (!assignments || assignments.length === 0) {
        // Fallback: cargar desde epp_delivery_items
        const { data: legacy } = await supabase
          .from('epp_delivery_items')
          .select('id, epp_name, body_zone, size, certification, epp_deliveries!inner(worker_id, delivery_date)')
          .eq('epp_deliveries.worker_id', worker.id);
        
        if (legacy) {
          assignments = legacy.map((a: any) => ({
            id: a.id,
            epp_name: a.epp_name,
            body_zone: a.body_zone,
            size: a.size,
            certification: a.certification,
            assigned_date: a.epp_deliveries?.delivery_date || new Date().toISOString().slice(0, 10),
            status: 'ACTIVO'
          })).sort((a, b) => b.assigned_date.localeCompare(a.assigned_date));
        }
      }

      if (assignments) {
        const uniqueAssignments = [];
        const seenNames = new Set();
        for (const a of assignments) {
          if (!seenNames.has(a.epp_name)) {
            seenNames.add(a.epp_name);
            uniqueAssignments.push(a);
          }
        }
        setWorkerCurrentEpps(uniqueAssignments);
      }
    } finally {
      setLoadingCurrentEpps(false);
    }
  }

  function addItem() {
    if (!selectedEpp) return;
    setItems((current) => [
      ...current,
      {
        ...selectedEpp,
        quantity,
        size: size.trim() || undefined,
        certification: certification.trim() || undefined,
        observation: observation.trim() || undefined,
      },
    ]);
    setQuantity(1);
    setSize('');
    setObservation('Conforme');
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function signItem(index: number, signatureUrl: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              workerSignatureUrl: signatureUrl,
              signedAt: new Date().toISOString(),
            }
          : item
      )
    );
  }

  function saveSignature(signatureUrl: string) {
    if (signatureTarget?.type === 'worker') {
      signItem(signatureTarget.itemIndex, signatureUrl);
    }

    if (signatureTarget?.type === 'responsible') {
      setResponsibleSignatureUrl(signatureUrl);
    }

    setSignatureTarget(null);
  }

  async function saveDelivery(status: 'BORRADOR' | 'FIRMADO') {
    if (!selectedWorker || items.length === 0) return null;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('client_id, id').eq('id', user!.id).single();
      
      const docCode = `R-SST-EPP-${Date.now().toString().slice(-4)}`;

      const { data: delivery, error: deliveryError } = await supabase.from('epp_deliveries').insert({
        client_id: profile!.client_id,
        worker_id: selectedWorker.id,
        delivered_by_id: profile!.id,
        delivery_date: deliveryDate,
        status,
        document_code: docCode,
        delivered_by_signature_url: responsibleSignatureUrl || null
      }).select().single();

      if (deliveryError) throw deliveryError;

      const deliveryItems = items.map(item => ({
        delivery_id: delivery.id,
        epp_id: item.id,
        epp_name: item.name,
        body_zone: item.body_zone,
        quantity: item.quantity,
        unit: item.unit,
        size: item.size || null,
        certification: item.certification || null,
        unit_price: item.unit_price || 0,
        observation: item.observation || null,
        worker_signature_url: item.workerSignatureUrl || null,
        signed_at: item.signedAt || null
      }));

      const { data: insertedItems, error: itemsError } = await supabase.from('epp_delivery_items').insert(deliveryItems).select();

      if (itemsError) throw itemsError;

      // Siempre crear asignaciones de EPP al trabajador (independiente del estado de firma)
      const assignments = items.map((item, idx) => ({
        client_id: profile!.client_id,
        worker_id: selectedWorker.id,
        epp_id: item.id,
        delivery_id: delivery.id,
        delivery_item_id: insertedItems?.[idx]?.id || null,
        epp_name: item.name,
        body_zone: item.body_zone,
        size: item.size || null,
        certification: item.certification || null,
        assigned_date: deliveryDate,
        status: 'ACTIVO'
      }));
      const { error: assignmentsError } = await supabase.from('worker_epp_assignments').insert(assignments);
      if (assignmentsError) throw assignmentsError;

      showToast(`Entrega guardada exitosamente como ${status}`, 'success');
      
      const { data: dRes } = await supabase.from('epp_deliveries').select('id, document_code, delivery_date, status, workers(full_name), epp_delivery_items(count)').order('created_at', { ascending: false }).limit(5);
      if (dRes) setRecentDeliveries(dRes);

      setItems([]);
      setResponsibleSignatureUrl('');
      return delivery;
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
      const isFullySigned = responsibleSignatureUrl && items.every(i => i.workerSignatureUrl);
      const deliveryStatus = isFullySigned ? 'FIRMADO' : 'BORRADOR';
      
      await saveDelivery(deliveryStatus);

      const response = await fetch('/api/reports/epp-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentCode: 'R-MIC&M-SSO-008',
          revision: '02',
          deliveryDate,
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
          deliveredBy: {
            fullName: deliveredBy,
            signatureUrl: responsibleSignatureUrl,
          },
          items: items.map((item) => ({
            name: item.name,
            bodyZone: item.body_zone,
            deliveryDate,
            quantity: item.quantity,
            unit: item.unit,
            size: item.size,
            certification: item.certification,
            observation: item.observation,
            workerSignatureUrl: item.workerSignatureUrl,
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
      link.download = `entrega-epp-${selectedWorker.document_number}-${deliveryDate}.pdf`;
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
              ARGOS SST / {deliveredBy}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[#134686]">Entrega de EPP</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => saveDelivery('BORRADOR')}
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

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <Panel>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#111827]">
                  <UserRound className="h-4 w-4 text-[#1E93AB]" />
                  Datos de entrega
                </h2>
                <span className="rounded-full bg-[#F3F2EC] px-3 py-1 text-xs font-bold text-[#134686]">
                  R-MICM-SSO-008
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1 xl:col-span-2">
                  <span className="text-xs font-bold text-gray-500">Buscar trabajador por DNI o nombre</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      list="delivery-workers-list"
                      className={cn(fieldClass, 'pl-9')}
                      value={workerSearch}
                      onChange={(event) => {
                        const value = event.target.value;
                        setWorkerSearch(value);
                        const found = workers.find((worker) => value.includes(worker.document_number) || value.includes(worker.full_name));
                        if (found) selectWorker(found.id);
                      }}
                    />
                    <datalist id="delivery-workers-list">
                      {workers.map((worker) => (
                        <option key={worker.id} value={`${worker.document_number} - ${worker.full_name}`} />
                      ))}
                    </datalist>
                  </div>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">DNI / Codigo</span>
                  <input className={fieldClass} value={selectedWorker?.document_number || ''} readOnly />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Cargo</span>
                  <input className={fieldClass} value={selectedWorker?.position || ''} readOnly />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Area</span>
                  <input className={fieldClass} value={selectedWorker?.area || ''} readOnly />
                </label>
                <label className="space-y-1 md:col-span-1">
                  <span className="text-xs font-bold text-gray-500">Responsable</span>
                  <input className={fieldClass} value={deliveredBy} onChange={(event) => setDeliveredBy(event.target.value)} />
                </label>
                <label className="space-y-1 md:col-span-1">
                  <span className="text-xs font-bold text-gray-500">Fecha</span>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      className={cn(fieldClass, 'pl-9')}
                      value={deliveryDate}
                      onChange={(event) => setDeliveryDate(event.target.value)}
                    />
                  </div>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setSignatureTarget({ type: 'responsible', title: `Firma del responsable: ${deliveredBy}` })}
                    className={cn(
                      'flex h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition',
                      responsibleSignatureUrl
                        ? 'bg-green-100 text-green-700'
                        : 'bg-[#134686] text-white hover:bg-[#1E93AB]'
                    )}
                  >
                    <FileSignature className="h-4 w-4" />
                    {responsibleSignatureUrl ? 'Responsable firmado' : 'Firmar responsable'}
                  </button>
                </div>
              </div>
            </Panel>

            {/* Panel: EPP actuales del trabajador */}
            {selectedWorkerId && (
              <Panel>
                <button
                  type="button"
                  onClick={() => setShowCurrentEpps((v) => !v)}
                  className="flex w-full items-center justify-between gap-2"
                >
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#111827]">
                    <CheckCircle2 className="h-4 w-4 text-[#1E93AB]" />
                    EPP actuales del trabajador
                    {loadingCurrentEpps ? (
                      <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    ) : (
                      <span className={cn(
                        'ml-1 rounded-full px-2 py-0.5 text-xs font-black',
                        workerCurrentEpps.length > 0
                          ? 'bg-[#1E93AB]/10 text-[#1E93AB]'
                          : 'bg-gray-100 text-gray-500'
                      )}>
                        {workerCurrentEpps.length} activos
                      </span>
                    )}
                  </h2>
                  {showCurrentEpps
                    ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    : <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  }
                </button>

                {showCurrentEpps && (
                  <div className="mt-4">
                    {loadingCurrentEpps ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando EPPs del trabajador...
                      </div>
                    ) : workerCurrentEpps.length === 0 ? (
                      <p className="italic text-sm text-gray-400">
                        Este trabajador no tiene EPPs asignados actualmente.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {workerCurrentEpps.map((epp) => (
                          <div
                            key={epp.id}
                            className="flex items-center gap-2 rounded-md border border-[#DCDCDC] bg-[#F3F2EC] px-3 py-2 text-sm"
                          >
                            <HardHat className="h-4 w-4 flex-shrink-0 text-[#1E93AB]" />
                            <div>
                              <p className="font-bold text-[#134686] leading-tight">{epp.epp_name}</p>
                              <p className="text-xs text-gray-500 leading-tight">
                                {[epp.body_zone, epp.size ? `Talla ${epp.size}` : null, epp.certification].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            )}

            <Panel>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#111827]">
                  <HardHat className="h-4 w-4 text-[#1E93AB]" />
                  EPP entregado
                </h2>
                <div className="relative w-full md:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    className={cn(fieldClass, 'pl-9')}
                    placeholder="Buscar en catalogo"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.35fr_0.35fr_0.35fr_0.9fr_1fr_auto]">
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">EPP</span>
                  <select className={fieldClass} value={selectedEppId} onChange={(event) => setSelectedEppId(event.target.value)}>
                    {filteredCatalog.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.body_zone}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Cantidad</span>
                  <input
                    type="number"
                    min={1}
                    className={fieldClass}
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Talla</span>
                  <input className={fieldClass} value={size} onChange={(event) => setSize(event.target.value)} />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Certificacion</span>
                  <input
                    className={fieldClass}
                    value={certification}
                    onChange={(event) => setCertification(event.target.value)}
                    placeholder="ANSI, NIOSH, EN, ASTM..."
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Observacion</span>
                  <input className={fieldClass} value={observation} onChange={(event) => setObservation(event.target.value)} />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!selectedEpp}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#FF7F11] px-4 text-sm font-black text-white transition hover:bg-[#E62727] lg:w-auto disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </button>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#DCDCDC] text-xs uppercase tracking-widest text-gray-500">
                      <th className="pb-3">EPP</th>
                      <th className="pb-3">Fecha</th>
                      <th className="pb-3">Certificacion</th>
                      <th className="pb-3 text-center">Cant.</th>
                      <th className="pb-3">Talla</th>
                      <th className="pb-3">Obs.</th>
                      <th className="pb-3">Firma trabajador</th>
                      <th className="pb-3 text-right">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {items.map((item, index) => (
                      <tr key={`${item.id}-${index}`} className="align-middle">
                        <td className="py-3 font-bold text-[#134686]">{item.name}</td>
                        <td className="py-3 text-gray-600">{deliveryDate}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2 py-1 text-xs font-bold text-gray-700">
                            <BadgeCheck className="h-3 w-3 text-[#1E93AB]" />
                            {item.certification ?? 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-3 text-gray-600">{item.size ?? '-'}</td>
                        <td className="py-3 text-gray-600">{item.observation ?? '-'}</td>
                        <td className="py-3">
                          {item.workerSignatureUrl ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-black text-green-700">
                              <FileSignature className="h-3 w-3" />
                              Firmado
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setSignatureTarget({
                                  type: 'worker',
                                  itemIndex: index,
                                  title: `Firma de ${selectedWorker?.full_name} por ${item.name}`,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-[#DCDCDC] px-2 py-1 text-xs font-black text-[#134686] transition hover:border-[#1E93AB] hover:text-[#1E93AB]"
                            >
                              <FileSignature className="h-3 w-3" />
                              Firmar
                            </button>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Eliminar EPP"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400">
                          Agrega EPPs desde el catálogo para este trabajador.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel className="overflow-hidden bg-[#134686] text-white">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-[#FFB26B]">Resumen</p>
                  <h2 className="mt-2 truncate text-xl font-bold">{selectedWorker?.full_name || 'Sin trabajador'}</h2>
                </div>
                <PackageCheck className="h-8 w-8 flex-shrink-0 text-[#FF7F11]" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Items</p>
                  <p className="mt-1 text-2xl font-black">{items.length}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Valor ref.</p>
                  <p className="mt-1 text-2xl font-black">S/ {totalEstimated.toFixed(2)}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Firmas EPP</p>
                  <p className="mt-1 text-2xl font-black">{signedItems}/{items.length}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3 overflow-hidden">
                  <p className="text-xs text-gray-300">Responsable</p>
                  <p className="mt-1 truncate text-base font-black">{responsibleSignatureUrl ? 'Firmado' : 'Pendiente'}</p>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm text-gray-200">
                <div className="flex justify-between gap-3">
                  <span>Fecha</span>
                  <strong>{deliveryDate}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Responsable</span>
                  <strong>{deliveredBy}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Estado</span>
                  <strong>NUEVO</strong>
                </div>
              </div>
            </Panel>

            <Panel>
              <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-[#134686]">Ultimas entregas</h2>
              {recentDeliveries.length === 0 ? (
                <p className="text-sm text-gray-500">No hay entregas registradas aún.</p>
              ) : (
                <div className="space-y-3">
                  {recentDeliveries.map((delivery) => (
                    <div key={delivery.id} className="rounded-md border border-[#E5E7EB] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black text-[#1E93AB]">{delivery.document_code || 'SIN COD'}</p>
                          <p className="mt-1 font-bold text-[#134686]">{delivery.workers?.full_name}</p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-[10px] font-black',
                            delivery.status === 'FIRMADO'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {delivery.status}
                        </span>
                      </div>
                      <div className="mt-3 flex justify-between text-xs text-gray-500">
                        <span>{delivery.delivery_date}</span>
                        <span>{delivery.epp_delivery_items?.[0]?.count ?? 0} EPP</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>
      <SignatureDialog
        open={Boolean(signatureTarget)}
        title={signatureTarget?.title ?? ''}
        onClose={() => setSignatureTarget(null)}
        onSave={saveSignature}
      />
    </IndustrialLayout>
  );
}
