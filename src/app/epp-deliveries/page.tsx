'use client';

import React, { useEffect, useMemo, useState } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { Panel } from '@/components/common/Panel';
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
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/lib/useIsAdmin';

type CatalogItem = {
  id: string;
  name: string;
  body_zone: string;
  unit: string;
  brand?: string;
  certification?: string;
  unit_price?: number;
  currency?: string;
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
  epp_id?: string;
  epp_name: string;
  body_zone?: string;
  size?: string;
  brand?: string;
  certification?: string;
  assigned_date: string;
  status: string;
  current_condition?: string;
  unit_price?: number;
  currency?: string;
  observation?: string;
  delivery_item_id?: string;
};

type DeliveryItem = CatalogItem & {
  quantity: number;
  size?: string;
  observation?: string;
  workerSignatureUrl?: string;
  signedAt?: string;
};

type RecentDelivery = {
  id: string;
  document_code?: string;
  delivery_date: string;
  status: string;
  delivered_by_signature_url?: string;
  workers?: { full_name?: string } | null;
  epp_delivery_items?: { count: number; worker_signature_url?: string }[];
};

const fieldClass =
  'w-full rounded-md border border-[#DCDCDC] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1E93AB] focus:ring-2 focus:ring-[#1E93AB]/20';

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



const moneyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

function formatMoney(value?: number) {
  return moneyFormatter.format(Number(value ?? 0));
}

type SignatureTarget =
  | { type: 'worker'; itemIndex: number; title: string }
  | { type: 'responsible'; title: string };

export default function EppDeliveriesPage() {
  const { showToast, showConfirm } = useFeedback();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<RecentDelivery[]>([]);

  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [deliveredBy, setDeliveredBy] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEppId, setSelectedEppId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('');
  const [certification, setCertification] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);
  const [observation, setObservation] = useState('Conforme');
  const [responsibleSignatureUrl, setResponsibleSignatureUrl] = useState('');
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget | null>(null);
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  const [editingDocumentCode, setEditingDocumentCode] = useState('');
  const [editingStatus, setEditingStatus] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [workerCurrentEpps, setWorkerCurrentEpps] = useState<WorkerAssignment[]>([]);
  const [showCurrentEpps, setShowCurrentEpps] = useState(true);
  const [showAllCurrentEpps, setShowAllCurrentEpps] = useState(false);
  const [loadingCurrentEpps, setLoadingCurrentEpps] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<WorkerAssignment | null>(null);

  const isAdmin = useIsAdmin();

  async function loadRecentDeliveries() {
    const { data } = await supabase
      .from('epp_deliveries')
      .select('id, document_code, delivery_date, status, delivered_by_signature_url, workers(full_name), epp_delivery_items(count, worker_signature_url)')
      .order('created_at', { ascending: false })
      .limit(8);
    if (data) setRecentDeliveries(data as RecentDelivery[]);
  }

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
        supabase.from('epp_deliveries').select('id, document_code, delivery_date, status, delivered_by_signature_url, workers(full_name), epp_delivery_items(count, worker_signature_url)').order('created_at', { ascending: false }).limit(8)
      ]);
      if (wRes.data) setWorkers(wRes.data);
      if (cRes.data) {
        setCatalog(cRes.data);
        if (cRes.data.length > 0) setSelectedEppId(cRes.data[0].id);
      }
      if (dRes.data) setRecentDeliveries(dRes.data as RecentDelivery[]);
    }
    loadData();
  }, []);

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
  const selectedEpp = catalog.find((c) => c.id === selectedEppId);

  useEffect(() => {
    if (selectedEpp) {
      setCertification(selectedEpp.certification ?? '');
      setUnitPrice(Number(selectedEpp.unit_price ?? 0));
    }
  }, [selectedEpp]);

  const totalEstimated = useMemo(
    () => items.reduce((sum, item) => sum + (item.unit_price ?? 0) * item.quantity, 0),
    [items]
  );
  const signedItems = useMemo(() => items.filter((item) => item.workerSignatureUrl).length, [items]);
  const filteredCatalog = catalog.filter((item) =>
    `${item.name} ${item.body_zone} ${item.certification ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function loadWorkerCurrentEpps(workerId: string) {
    setLoadingCurrentEpps(true);
    try {
      const { data: assignmentRows, error: assignmentError } = await supabase
        .from('worker_epp_assignments')
        .select('id, epp_id, epp_name, body_zone, size, brand, certification, assigned_date, status, current_condition, delivery_item_id, epp_delivery_items(unit_price, currency, brand)')
        .eq('worker_id', workerId)
        .order('assigned_date', { ascending: false });

      if (assignmentError) {
        console.error('Error cargando assignments:', assignmentError.message);
      }

      let rows = assignmentRows ?? [];

      // Fallback: si no hay assignments, reconstruir desde epp_delivery_items
      if (rows.length === 0) {
        const { data: legacy } = await supabase
          .from('epp_delivery_items')
          .select('id, epp_id, epp_name, body_zone, size, brand, certification, unit_price, currency, epp_deliveries!inner(worker_id, delivery_date, status, delivered_by_id)')
          .eq('epp_deliveries.worker_id', workerId)
          .order('epp_deliveries.delivery_date', { ascending: false });

        if (legacy && legacy.length > 0) {
          rows = legacy.map((a: any) => ({
            id: a.id,
            epp_id: a.epp_id,
            epp_name: a.epp_name,
            body_zone: a.body_zone,
            size: a.size,
            brand: a.brand ?? null,
            certification: a.certification,
            unit_price: Number(a.unit_price ?? 0),
            currency: a.currency ?? 'PEN',
            assigned_date: a.epp_deliveries?.delivery_date ?? '',
            status: 'ACTIVO',
            current_condition: 'BUENO',
            delivery_item_id: a.id,
            epp_delivery_items: [] as { unit_price: any; currency: any; brand: any }[],
          }));
        }
      }

      const normalized = rows.map((assignment: any) => {
        const deliveredItem = Array.isArray(assignment.epp_delivery_items)
          ? assignment.epp_delivery_items[0]
          : assignment.epp_delivery_items;
        const catalogItem = catalog.find((item) => item.id === assignment.epp_id || item.name === assignment.epp_name);
        const deliveredPrice = Number(deliveredItem?.unit_price ?? 0);
        const catalogPrice = Number(catalogItem?.unit_price ?? 0);
        return {
          ...assignment,
          unit_price: deliveredPrice > 0 ? deliveredPrice : (assignment.unit_price > 0 ? assignment.unit_price : catalogPrice),
          currency: deliveredItem?.currency ?? catalogItem?.currency ?? assignment.currency ?? 'PEN',
        };
      }).sort((a: any, b: any) => {
        if (a.status === 'ACTIVO' && b.status !== 'ACTIVO') return -1;
        if (a.status !== 'ACTIVO' && b.status === 'ACTIVO') return 1;
        return String(b.assigned_date ?? '').localeCompare(String(a.assigned_date ?? ''));
      });

      setWorkerCurrentEpps(normalized);
    } finally {
      setLoadingCurrentEpps(false);
    }
  }

  async function selectWorker(workerId: string, fallbackWorker?: Worker) {
    const worker = fallbackWorker ?? workers.find((w) => w.id === workerId);
    if (!worker) return;
    setSelectedWorkerId(worker.id);
    setWorkerSearch(`${worker.document_number} - ${worker.full_name}`);
    setItems([]);
    setResponsibleSignatureUrl('');
    setSignatureTarget(null);
    setEditingDeliveryId(null);
    setEditingDocumentCode('');
    setEditingStatus('');
    setWorkerCurrentEpps([]);
    setShowCurrentEpps(true);
    setShowAllCurrentEpps(false);
    await loadWorkerCurrentEpps(worker.id);
  }

  async function toggleAssignmentStatus(assignment: WorkerAssignment) {
    if (!isAdmin) return;
    const isActive = assignment.status === 'ACTIVO';
    const newStatus = isActive ? 'BAJA' : 'ACTIVO';
    showConfirm({
      title: isActive ? 'Dar de baja EPP' : 'Reactivar EPP',
      message: isActive
        ? `¿Confirmas dar de baja "${assignment.epp_name}"? El registro se conservará en historial.`
        : `¿Confirmas reactivar "${assignment.epp_name}"? Volverá a mostrarse como activo.`,
      onConfirm: async () => {
        const { error } = await supabase
          .from('worker_epp_assignments')
          .update({ status: newStatus, current_condition: isActive ? 'BAJA' : 'BUENO', deactivated_at: isActive ? new Date().toISOString() : null })
          .eq('id', assignment.id);
        if (error) { showToast(error.message, 'error'); return; }
        showToast(`EPP ${assignment.epp_name} marcado como ${newStatus}`, 'success');
        if (selectedWorkerId) await loadWorkerCurrentEpps(selectedWorkerId);
      },
    });
  }

  async function confirmDeleteAssignment(assignment: WorkerAssignment) {
    if (!isAdmin) return;
    showConfirm({
      title: 'Eliminar EPP asignado',
      message: `¿Confirmas eliminar definitivamente "${assignment.epp_name}" de los EPP actuales del trabajador?`,
      onConfirm: async () => {
        try {
          setLoadingCurrentEpps(true);
          const { error } = await supabase.from('worker_epp_assignments').delete().eq('id', assignment.id);
          if (error) throw error;
          showToast('EPP eliminado de la lista del trabajador.', 'success');
          if (selectedWorkerId) await loadWorkerCurrentEpps(selectedWorkerId);
        } catch (e: any) {
          showToast(e.message, 'error');
          setLoadingCurrentEpps(false);
        }
      },
    });
  }

  async function saveAssignmentEdit(id: string, updates: Partial<WorkerAssignment>) {
    try {
      setLoadingCurrentEpps(true);
      const { unit_price, delivery_item_id, ...assignmentUpdates } = updates;
      const { error } = await supabase.from('worker_epp_assignments').update(assignmentUpdates).eq('id', id);
      if (error) throw error;
      if (unit_price !== undefined && delivery_item_id) {
        await supabase.from('epp_delivery_items').update({ unit_price }).eq('id', delivery_item_id);
      }
      showToast('Asignación actualizada', 'success');
      if (selectedWorkerId) await loadWorkerCurrentEpps(selectedWorkerId);
      setEditingAssignment(null);
    } catch (e: any) {
      showToast(e.message, 'error');
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
        unit_price: Number(unitPrice) || 0,
        currency: selectedEpp.currency ?? 'PEN',
        observation: observation.trim() || undefined,
      },
    ]);
    setQuantity(1);
    setSize('');
    setUnitPrice(Number(selectedEpp.unit_price ?? 0));
    setObservation('Conforme');
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  function updateItem(index: number, updates: Partial<DeliveryItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }

  function clearEditingState() {
    setEditingDeliveryId(null);
    setEditingDocumentCode('');
    setEditingStatus('');
  }

  async function loadDeliveryForEdit(deliveryId: string) {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('epp_deliveries')
        .select(`id, document_code, delivery_date, status, delivered_by_signature_url, worker_id,
          workers(id, full_name, document_number, position, area),
          epp_delivery_items(id, epp_id, epp_name, body_zone, quantity, unit, size, certification, unit_price, currency, observation, worker_signature_url, signed_at)`)
        .eq('id', deliveryId)
        .single();
      if (error) throw error;
      const worker = Array.isArray(data.workers) ? data.workers[0] : data.workers;
      if (worker?.id) {
        const exists = workers.some((item) => item.id === worker.id);
        if (!exists) setWorkers((current) => [...current, worker as Worker]);
        setSelectedWorkerId(worker.id);
        setWorkerSearch(`${worker.document_number} - ${worker.full_name}`);
        setWorkerCurrentEpps([]);
        setShowCurrentEpps(true);
        setShowAllCurrentEpps(false);
        await loadWorkerCurrentEpps(worker.id);
      }
      setEditingDeliveryId(data.id);
      setEditingDocumentCode(data.document_code ?? '');
      setEditingStatus(data.status ?? '');
      setDeliveryDate(data.delivery_date);
      setResponsibleSignatureUrl(data.delivered_by_signature_url ?? '');
      setItems((data.epp_delivery_items ?? []).map((item: any) => ({
        id: item.epp_id ?? item.id,
        name: item.epp_name,
        body_zone: item.body_zone ?? '',
        unit: item.unit ?? 'Unidad',
        certification: item.certification ?? undefined,
        unit_price: Number(item.unit_price ?? 0),
        currency: item.currency ?? 'PEN',
        quantity: Number(item.quantity ?? 1),
        size: item.size ?? undefined,
        observation: item.observation ?? undefined,
        workerSignatureUrl: item.worker_signature_url ?? undefined,
        signedAt: item.signed_at ?? undefined,
      })));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Entrega cargada para editar.', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function signItem(index: number, signatureUrl: string) {
    setItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, workerSignatureUrl: signatureUrl, signedAt: new Date().toISOString() } : item
      )
    );
  }

  async function saveSignature(signatureUrl: string) {
    if (signatureTarget?.type === 'worker') {
      signItem(signatureTarget.itemIndex, signatureUrl);
      await saveDelivery('BORRADOR', { silent: true });
    }
    if (signatureTarget?.type === 'responsible') setResponsibleSignatureUrl(signatureUrl);
    setSignatureTarget(null);
  }

  async function saveDelivery(status: 'BORRADOR' | 'FIRMADO', options?: { silent?: boolean }) {
    if (!selectedWorker || items.length === 0) return null;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('client_id, id').eq('id', user!.id).single();
      const docCode = editingDocumentCode || `R-SST-EPP-${Date.now().toString().slice(-4)}`;
      const deliveryPayload = {
        client_id: profile!.client_id,
        worker_id: selectedWorker.id,
        delivered_by_id: profile!.id,
        delivery_date: deliveryDate,
        status,
        document_code: docCode,
        delivered_by_signature_url: responsibleSignatureUrl || null
      };
      let delivery: any;
      if (editingDeliveryId) {
        const { data: updatedDelivery, error: deliveryError } = await supabase
          .from('epp_deliveries').update(deliveryPayload).eq('id', editingDeliveryId).select().single();
        if (deliveryError) throw deliveryError;
        delivery = updatedDelivery;
        const { error: e1 } = await supabase.from('worker_epp_assignments').delete().eq('delivery_id', editingDeliveryId);
        if (e1) throw e1;
        const { error: e2 } = await supabase.from('epp_delivery_items').delete().eq('delivery_id', editingDeliveryId);
        if (e2) throw e2;
      } else {
        const { data: insertedDelivery, error: deliveryError } = await supabase
          .from('epp_deliveries').insert(deliveryPayload).select().single();
        if (deliveryError) throw deliveryError;
        delivery = insertedDelivery;
      }
      if (options?.silent && !editingDeliveryId) {
        setEditingDeliveryId(delivery.id);
        setEditingDocumentCode(docCode);
      }
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
        currency: item.currency ?? 'PEN',
        observation: item.observation || null,
        worker_signature_url: item.workerSignatureUrl || null,
        signed_at: item.signedAt || null
      }));
      const { data: insertedItems, error: itemsError } = await supabase.from('epp_delivery_items').insert(deliveryItems).select();
      if (itemsError) throw itemsError;

      // Solo promover a EPP actuales los ítems que el trabajador ya firmó
      const signedForAssignment = items.filter(item => item.workerSignatureUrl);
      if (signedForAssignment.length > 0) {
        if (editingDeliveryId) {
          await supabase.from('worker_epp_assignments').delete().eq('delivery_id', delivery.id);
        }
        const assignments = signedForAssignment.map((item) => {
          // Buscar el delivery_item_id correspondiente: mismo orden que items original
          const originalIdx = items.indexOf(item);
          return {
            client_id: profile!.client_id,
            worker_id: selectedWorker.id,
            epp_id: item.id,
            delivery_id: delivery.id,
            delivery_item_id: insertedItems?.[originalIdx]?.id || null,
            epp_name: item.name,
            body_zone: item.body_zone,
            size: item.size || null,
            certification: item.certification || null,
            assigned_date: deliveryDate,
            quantity: item.quantity,
            status: 'ACTIVO',
            current_condition: 'BUENO',
          };
        });
        const { error: assignmentsError } = await supabase.from('worker_epp_assignments').insert(assignments);
        if (assignmentsError) {
          showToast(`Entrega guardada. Aviso: ${assignmentsError.message}`, 'error');
          console.error('worker_epp_assignments insert error:', assignmentsError);
        }
      } else if (editingDeliveryId) {
        // Borrador sin firmas: limpiar assignments previos del delivery
        await supabase.from('worker_epp_assignments').delete().eq('delivery_id', delivery.id);
      }
      if (options?.silent) {
        showToast('Firmado y guardado', 'success');
      } else {
        showToast(editingDeliveryId ? `Entrega actualizada como ${status}` : `Entrega guardada como ${status}`, 'success');
      }
      await loadRecentDeliveries();
      await loadWorkerCurrentEpps(selectedWorker.id);
      if (!options?.silent) {
        setItems([]);
        setResponsibleSignatureUrl('');
        clearEditingState();
      }
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
      await saveDelivery(isFullySigned ? 'FIRMADO' : 'BORRADOR');
      const response = await fetch('/api/reports/epp-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentCode: 'R-MIC&M-SSO-008',
          revision: '02',
          deliveryDate,
          client: { legalName: 'ARGOS SST CLIENTE', ruc: '20000000000', address: 'LIMA', activity: 'MINERIA' },
          worker: { fullName: selectedWorker.full_name, documentNumber: selectedWorker.document_number, position: selectedWorker.position, area: selectedWorker.area },
          deliveredBy: { fullName: deliveredBy, signatureUrl: responsibleSignatureUrl },
          items: items.map((item) => ({
            name: item.name, bodyZone: item.body_zone, deliveryDate, quantity: item.quantity,
            unit: item.unit, size: item.size, certification: item.certification,
            unitPrice: item.unit_price, currency: item.currency ?? 'PEN',
            observation: item.observation, workerSignatureUrl: item.workerSignatureUrl,
          })),
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || 'No se pudo generar el PDF.');
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
      <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1E93AB]">
              <ShieldCheck className="h-4 w-4" />
              ARGOS SST / {deliveredBy}
            </div>
            <h1 className="mt-1 text-xl font-bold text-[#134686]">Entrega de EPP</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {editingDeliveryId && (
              <button
                type="button"
                onClick={() => { setItems([]); setResponsibleSignatureUrl(''); clearEditingState(); }}
                className="flex items-center gap-2 rounded-md border border-[#DCDCDC] bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:border-[#1E93AB] hover:text-[#1E93AB]"
              >
                Cancelar edicion
              </button>
            )}
            <button
              onClick={() => saveDelivery('BORRADOR')}
              disabled={saving || items.length === 0}
              className="flex items-center gap-2 rounded-md border border-[#DCDCDC] bg-white px-4 py-2 text-sm font-bold text-[#134686] transition hover:border-[#1E93AB] hover:text-[#1E93AB] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingDeliveryId ? 'Actualizar borrador' : 'Guardar borrador'}
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={items.length === 0 || isGeneratingPdf || saving}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white transition',
                items.length === 0 || isGeneratingPdf || saving ? 'cursor-not-allowed bg-gray-400' : 'bg-[#134686] hover:bg-[#1E93AB]'
              )}
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {isGeneratingPdf ? 'Generando...' : editingDeliveryId ? 'Actualizar y Generar PDF' : 'Guardar y Generar PDF'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          {/* ── COLUMNA IZQUIERDA ── */}
          <div className="space-y-3">
            {/* Panel: Datos de entrega */}
            <Panel>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#111827]">
                  <UserRound className="h-4 w-4 text-[#1E93AB]" />
                  Datos de entrega
                </h2>
                <span className="rounded-full bg-[#F3F2EC] px-3 py-1 text-xs font-bold text-[#134686]">
                  {editingDeliveryId ? `Editando ${editingDocumentCode || 'entrega'}` : 'R-MICM-SSO-008'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1 xl:col-span-2">
                  <span className="text-xs font-bold text-gray-500">Buscar trabajador por DNI o nombre</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      list="delivery-workers-list"
                      className={cn(fieldClass, 'pl-9')}
                      value={workerSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setWorkerSearch(value);
                        const found = workers.find((w) => value.includes(w.document_number) || value.includes(w.full_name));
                        if (found) selectWorker(found.id);
                      }}
                    />
                    <datalist id="delivery-workers-list">
                      {workers.map((w) => (
                        <option key={w.id} value={`${w.document_number} - ${w.full_name}`} />
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
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Responsable</span>
                  <input className={fieldClass} value={deliveredBy} onChange={(e) => setDeliveredBy(e.target.value)} />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Fecha</span>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input type="date" className={cn(fieldClass, 'pl-9')} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                  </div>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setSignatureTarget({ type: 'responsible', title: `Firma del responsable: ${deliveredBy}` })}
                    className={cn(
                      'flex h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition',
                      responsibleSignatureUrl ? 'bg-green-100 text-green-700' : 'bg-[#134686] text-white hover:bg-[#1E93AB]'
                    )}
                  >
                    <FileSignature className="h-4 w-4" />
                    {responsibleSignatureUrl ? 'Responsable firmado' : 'Firmar responsable'}
                  </button>
                </div>
              </div>
            </Panel>

            {/* Panel: EPP Entregado */}
            <Panel>
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                    onChange={(e) => {
                      const term = e.target.value;
                      setSearchTerm(term);
                      // Si el EPP seleccionado no está en los resultados filtrados, seleccionar el primero visible
                      const filtered = catalog.filter((item) =>
                        `${item.name} ${item.body_zone} ${item.certification ?? ''}`.toLowerCase().includes(term.toLowerCase())
                      );
                      if (filtered.length > 0 && !filtered.some(item => item.id === selectedEppId)) {
                        setSelectedEppId(filtered[0].id);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.3fr_0.35fr_0.35fr_0.55fr_0.9fr_1fr_auto]">
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">EPP</span>
                  <select className={fieldClass} value={selectedEppId} onChange={(e) => setSelectedEppId(e.target.value)}>
                    {filteredCatalog.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.body_zone}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Cantidad</span>
                  <input type="number" min={1} className={fieldClass} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Talla</span>
                  <input className={fieldClass} value={size} onChange={(e) => setSize(e.target.value)} />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Precio</span>
                  <input type="number" min={0} step="0.01" className={fieldClass} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Certificacion</span>
                  <input className={fieldClass} value={certification} onChange={(e) => setCertification(e.target.value)} placeholder="ANSI, NIOSH..." />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Observacion</span>
                  <input className={fieldClass} value={observation} onChange={(e) => setObservation(e.target.value)} />
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

              <div className="mt-3 hidden md:block overflow-x-auto">
                <table className="w-full min-w-[1024px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#DCDCDC] text-xs uppercase tracking-widest text-gray-500">
                      <th className="px-2 pb-3">EPP</th>
                      <th className="px-2 pb-3">Fecha</th>
                      <th className="px-2 pb-3">Certificacion</th>
                      <th className="px-2 pb-3 text-center">Cant.</th>
                      <th className="px-2 pb-3">Talla</th>
                      <th className="px-2 pb-3 text-right">Precio</th>
                      <th className="px-2 pb-3">Obs.</th>
                      <th className="px-2 pb-3">Firma trabajador</th>
                      <th className="px-2 pb-3 text-right">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {items.map((item, index) => (
                      <tr key={`${item.id}-${index}`} className="align-middle">
                        <td className="px-2 py-2 font-bold text-[#134686]">{item.name}</td>
                        <td className="px-2 py-2 text-gray-600">{deliveryDate}</td>
                        <td className="px-2 py-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2 py-1 text-xs font-bold text-gray-700">
                            <BadgeCheck className="h-3 w-3 text-[#1E93AB]" />
                            {item.certification ?? 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number" min={1} value={item.quantity}
                            onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                            disabled={!!item.workerSignatureUrl}
                            className="w-16 rounded border border-[#DCDCDC] px-2 py-1 text-sm outline-none focus:border-[#1E93AB] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-2 py-2">
                          {(() => {
                            const availableSizes = (catalog.find(c => c.id === item.id) as any)?.available_sizes || [];
                            const locked = !!item.workerSignatureUrl;
                            return availableSizes.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {availableSizes.map((s: string) => (
                                  <button key={s} type="button"
                                    onClick={() => !locked && updateItem(index, { size: s })}
                                    disabled={locked}
                                    className={cn('rounded-md border px-2 py-1 text-xs font-bold',
                                      locked ? 'border-[#DCDCDC] bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : item.size === s ? 'border-[#FF7F11] bg-[#FF7F11] text-white' : 'border-[#DCDCDC] bg-white text-gray-700 hover:border-[#1E93AB]'
                                    )}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <input type="text" placeholder="Ej: M, 42" value={item.size ?? ''}
                                onChange={(e) => updateItem(index, { size: e.target.value })}
                                disabled={locked}
                                className="w-20 rounded border border-[#DCDCDC] px-2 py-1 text-sm outline-none focus:border-[#1E93AB] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                              />
                            );
                          })()}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1 items-end">
                            <div className="flex gap-1">
                              <select value={item.currency ?? 'PEN'} onChange={(e) => updateItem(index, { currency: e.target.value })}
                                disabled={!!item.workerSignatureUrl}
                                className="w-12 rounded border border-[#DCDCDC] px-1 py-1 text-xs outline-none focus:border-[#1E93AB] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                                <option value="PEN">S/</option>
                                <option value="USD">$</option>
                              </select>
                              <input type="number" step="0.01" min="0" value={item.unit_price ?? 0}
                                onChange={(e) => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                                disabled={!!item.workerSignatureUrl}
                                className="w-20 rounded border border-[#DCDCDC] px-2 py-1 text-sm outline-none text-right focus:border-[#1E93AB] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-bold">
                              Sub: {item.currency === 'USD' ? '$' : 'S/'} {((item.unit_price ?? 0) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={item.observation ?? ''} onChange={(e) => updateItem(index, { observation: e.target.value })}
                            disabled={!!item.workerSignatureUrl}
                            className="w-full min-w-[120px] rounded border border-[#DCDCDC] px-2 py-1 text-sm outline-none focus:border-[#1E93AB] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-2 py-2">
                          {item.workerSignatureUrl ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-black text-green-700">
                              <FileSignature className="h-3 w-3" /> Firmado
                            </span>
                          ) : (
                            <button type="button"
                              onClick={() => setSignatureTarget({ type: 'worker', itemIndex: index, title: `Firma de ${selectedWorker?.full_name} por ${item.name}` })}
                              className="inline-flex items-center gap-1 rounded-md border border-[#DCDCDC] px-2 py-1 text-xs font-black text-[#134686] transition hover:border-[#1E93AB] hover:text-[#1E93AB]"
                            >
                              <FileSignature className="h-3 w-3" /> Firmar
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {!item.workerSignatureUrl && (
                            <button type="button" onClick={() => removeItem(index)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                              aria-label="Eliminar EPP"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-gray-400">
                          Agrega EPPs desde el catálogo para este trabajador.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 space-y-2 md:hidden">
                {items.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[#DCDCDC] p-4 text-center text-sm text-gray-400">
                    Agrega EPPs desde el catálogo para este trabajador.
                  </div>
                ) : (
                  items.map((item, index) => {
                    const catalogItem = catalog.find(c => c.id === item.id) as CatalogItem & { available_sizes?: string[] } | undefined;
                    const availableSizes = catalogItem?.available_sizes || [];
                    const locked = !!item.workerSignatureUrl;
                    return (
                      <div key={`${item.id}-${index}`} className="flex flex-col gap-3 rounded-md border border-[#DCDCDC] bg-[#F3F2EC] p-3 text-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <HardHat className="h-4 w-4 flex-shrink-0 text-[#1E93AB]" />
                            <div className="min-w-0">
                              <p className="font-bold leading-tight text-[#134686]">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {[item.body_zone, item.certification || 'Pendiente'].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </div>
                          {!locked && (
                            <button type="button" onClick={() => removeItem(index)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="block text-gray-500 mb-1">Fecha</span>
                            <span className="font-bold">{deliveryDate}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500 mb-1">Precio</span>
                            <div className="flex gap-1 items-center">
                              <select value={item.currency ?? 'PEN'} onChange={(e) => updateItem(index, { currency: e.target.value })}
                                disabled={locked}
                                className="w-12 rounded border border-[#DCDCDC] px-1 py-1 outline-none focus:border-[#1E93AB] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                                <option value="PEN">S/</option>
                                <option value="USD">$</option>
                              </select>
                              <input type="number" step="0.01" min="0" value={item.unit_price ?? 0}
                                onChange={(e) => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                                disabled={locked}
                                className="w-full rounded border border-[#DCDCDC] px-2 py-1 outline-none focus:border-[#1E93AB] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <span className="block text-gray-500 mb-1">Cant.</span>
                            <input type="number" min={1} value={item.quantity}
                              onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                              disabled={locked}
                              className="w-full rounded border border-[#DCDCDC] px-2 py-1 outline-none focus:border-[#1E93AB] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <span className="block text-gray-500 mb-1">Talla</span>
                            {availableSizes.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {availableSizes.map((s: string) => (
                                  <button key={s} type="button"
                                    onClick={() => !locked && updateItem(index, { size: s })}
                                    disabled={locked}
                                    className={cn('rounded border px-1.5 py-0.5 text-[10px] font-bold',
                                      locked ? 'border-[#DCDCDC] bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : item.size === s ? 'border-[#FF7F11] bg-[#FF7F11] text-white' : 'border-[#DCDCDC] bg-white text-gray-700 hover:border-[#1E93AB]'
                                    )}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <input type="text" placeholder="Ej: M" value={item.size ?? ''}
                                onChange={(e) => updateItem(index, { size: e.target.value })}
                                disabled={locked}
                                className="w-full rounded border border-[#DCDCDC] px-2 py-1 outline-none focus:border-[#1E93AB] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                              />
                            )}
                          </div>
                          <div className="col-span-2">
                            <span className="block text-gray-500 mb-1">Observación</span>
                            <input type="text" placeholder="Observación..." value={item.observation ?? ''}
                              onChange={(e) => updateItem(index, { observation: e.target.value })}
                              disabled={locked}
                              className="w-full rounded border border-[#DCDCDC] px-2 py-1 outline-none focus:border-[#1E93AB] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-1 flex items-center justify-between border-t border-[#DCDCDC] pt-2">
                          <span className="text-xs font-bold text-gray-500">Firma:</span>
                          {item.workerSignatureUrl ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-black text-green-700">
                              <FileSignature className="h-3 w-3" /> Firmado
                            </span>
                          ) : (
                            <button type="button" onClick={() => setSignatureTarget({ type: 'worker', itemIndex: index, title: `Firma de ${selectedWorker?.full_name} por ${item.name}` })}
                              className="inline-flex items-center gap-1 rounded-md border border-[#DCDCDC] px-2 py-1 text-xs font-black text-[#134686] transition hover:border-[#1E93AB] hover:text-[#1E93AB]">
                              <FileSignature className="h-3 w-3" /> Firmar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>

            {/* Panel: EPP actuales del trabajador */}
            {selectedWorkerId && (
              <Panel>
                <button type="button" onClick={() => setShowCurrentEpps((v) => !v)}
                  className="flex w-full items-center justify-between gap-2"
                >
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#111827]">
                    <CheckCircle2 className="h-4 w-4 text-[#1E93AB]" />
                    EPP actuales del trabajador
                    {loadingCurrentEpps ? (
                      <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    ) : (
                      <span className={cn('ml-1 rounded-full px-2 py-0.5 text-xs font-black',
                        workerCurrentEpps.length > 0 ? 'bg-[#1E93AB]/10 text-[#1E93AB]' : 'bg-gray-100 text-gray-500'
                      )}>
                        {workerCurrentEpps.filter((e) => e.status === 'ACTIVO').length} activos / {workerCurrentEpps.length} total
                      </span>
                    )}
                  </h2>
                  {showCurrentEpps ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-400" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />}
                </button>

                {showCurrentEpps && (
                  <div className="mt-3">
                    {loadingCurrentEpps ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando EPPs del trabajador...
                      </div>
                    ) : workerCurrentEpps.length === 0 ? (
                      <p className="italic text-sm text-gray-400">Este trabajador no tiene EPPs asignados actualmente.</p>
                    ) : (
                      <div className={cn('grid grid-cols-1 gap-2', !showAllCurrentEpps && workerCurrentEpps.length > 4 ? 'max-h-[300px] overflow-y-auto pr-1' : '')}>
                        {workerCurrentEpps.map((epp, index) => (
                          <React.Fragment key={epp.id}>
                            {(index === 0 || workerCurrentEpps[index - 1]?.status !== epp.status) && (
                              <div className="flex items-center gap-2 pt-1">
                                <span className={cn('rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest',
                                  epp.status === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                )}>
                                  {epp.status === 'ACTIVO' ? 'Activos' : 'De baja'}
                                </span>
                                <span className="text-xs font-bold text-gray-400">
                                  {workerCurrentEpps.filter((item) => item.status === epp.status).length}
                                </span>
                              </div>
                            )}
                            <div className={cn(
                              'grid grid-cols-1 gap-3 rounded-md border px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto_auto_auto_auto]',
                              epp.status === 'ACTIVO' ? 'border-[#DCDCDC] bg-[#F3F2EC]' : 'border-red-200 bg-red-50'
                            )}>
                              <div className="flex min-w-0 items-center gap-2">
                                <HardHat className="h-4 w-4 flex-shrink-0 text-[#1E93AB]" />
                                <div className="min-w-0">
                                  <p className="font-bold leading-tight text-[#134686]">{epp.epp_name}</p>
                                  <p className="text-xs leading-tight text-gray-500">
                                    {[epp.body_zone, epp.size ? `Talla ${epp.size}` : null, epp.certification].filter(Boolean).join(' · ')}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-gray-600">{epp.assigned_date}</span>
                              {isAdmin ? (
                                <button type="button" onClick={() => toggleAssignmentStatus(epp)}
                                  className={cn('w-fit rounded-md px-2 py-1 text-[10px] font-black transition',
                                    epp.status === 'ACTIVO'
                                      ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                                      : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                                  )}
                                  title={epp.status === 'ACTIVO' ? 'Click para dar de baja' : 'Click para reactivar'}
                                >
                                  {epp.status === 'ACTIVO' ? 'ACTIVO' : 'BAJA'}
                                </button>
                              ) : (
                                <span className={cn('w-fit rounded-full px-2 py-1 text-xs font-black',
                                  epp.status === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                )}>
                                  {epp.status === 'ACTIVO' ? 'ACTIVO' : 'BAJA'}
                                </span>
                              )}
                              <span className={cn('w-fit rounded-full px-2 py-1 text-xs font-black',
                                epp.current_condition === 'MALO' ? 'bg-red-100 text-red-700'
                                  : epp.current_condition === 'REGULAR' ? 'bg-amber-100 text-amber-700'
                                  : 'bg-[#1E93AB]/10 text-[#1E93AB]'
                              )}>
                                {epp.current_condition || 'BUENO'}
                              </span>
                              <span className="text-right text-xs font-black text-[#134686]">{formatMoney(epp.unit_price)}</span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                    {!loadingCurrentEpps && workerCurrentEpps.length > 4 && (
                      <button type="button" onClick={() => setShowAllCurrentEpps((v) => !v)}
                        className="mt-2 text-xs font-black text-[#1E93AB] hover:text-[#134686]">
                        {showAllCurrentEpps ? 'Ver menos' : 'Ver todos'}
                      </button>
                    )}
                  </div>
                )}
              </Panel>
            )}
          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div className="space-y-3">
            {/* Panel: Resumen */}
            <Panel className="bg-[#134686] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#FFB26B]">Resumen</p>
                  <h2 className="mt-2 text-lg font-bold">{selectedWorker?.full_name || 'Sin trabajador'}</h2>
                </div>
                <PackageCheck className="h-8 w-8 flex-shrink-0 text-[#FF7F11]" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Items entrega</p>
                  <p className="mt-1 text-2xl font-black">{items.length}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Total entrega</p>
                  <p className="mt-1 truncate text-2xl font-black">S/ {totalEstimated.toFixed(2)}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Firmas EPP</p>
                  <p className="mt-1 text-2xl font-black">{signedItems}/{items.length}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3 overflow-hidden">
                  <p className="text-xs text-gray-300">Total activos</p>
                  <p className="mt-1 truncate text-2xl font-black">
                    S/ {workerCurrentEpps.filter(e => e.status === 'ACTIVO').reduce((s, e) => s + (e.unit_price ?? 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm text-gray-200">
                <div className="flex justify-between gap-2 border-t border-white/10 pt-2">
                  <span className="shrink-0 text-gray-400">Fecha</span>
                  <strong className="truncate">{deliveryDate}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="shrink-0 text-gray-400">Responsable</span>
                  <strong className="truncate">{deliveredBy}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="shrink-0 text-gray-400">Estado</span>
                  <StatusBadge
                    status={getDeliveryStatus({
                      status: editingDeliveryId ? editingStatus : 'BORRADOR',
                      delivered_by_signature_url: responsibleSignatureUrl,
                      epp_delivery_items: items.map((item) => ({ worker_signature_url: item.workerSignatureUrl })),
                    })}
                  />
                </div>
              </div>
            </Panel>

            {/* Panel: Historial de entregas */}
            <Panel>
              <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-[#134686]">Historial de entregas</h2>
              {recentDeliveries.length === 0 ? (
                <p className="text-sm text-gray-500">No hay entregas registradas aún.</p>
              ) : (
                <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                  {recentDeliveries.map((delivery) => (
                    <div key={delivery.id} className="rounded-md border border-[#E5E7EB] p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#1E93AB]">{delivery.document_code || 'SIN COD'}</p>
                          <p className="mt-0.5 truncate text-sm font-bold text-[#134686]">{delivery.workers?.full_name}</p>
                        </div>
                        <StatusBadge status={getDeliveryStatus(delivery)} />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
                        <span>{delivery.delivery_date} · {delivery.epp_delivery_items?.[0]?.count ?? 0} EPP</span>
                        <button type="button" onClick={() => loadDeliveryForEdit(delivery.id)} disabled={saving}
                          className="inline-flex items-center gap-1 rounded-md border border-[#DCDCDC] bg-white px-2 py-1 font-black text-[#134686] transition hover:border-[#1E93AB] hover:text-[#1E93AB] disabled:opacity-50"
                        >
                          <Pencil className="h-3 w-3" />
                          Modificar
                        </button>
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
        open={signatureTarget !== null}
        onClose={() => setSignatureTarget(null)}
        onSave={saveSignature}
        title={signatureTarget?.title || ''}
      />

      {editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-[#134686]">Editar EPP asignado</h3>
            <div className="mb-3 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">Talla</label>
                <input type="text" className={fieldClass}
                  value={editingAssignment.size || ''}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, size: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Condición actual</label>
                <select className={fieldClass}
                  value={editingAssignment.current_condition || 'BUENO'}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, current_condition: e.target.value })}
                >
                  <option value="BUENO">BUENO</option>
                  <option value="REGULAR">REGULAR</option>
                  <option value="MALO">MALO</option>
                  <option value="BAJA">BAJA</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Observación</label>
                <textarea className={fieldClass} rows={3}
                  value={editingAssignment.observation || ''}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, observation: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingAssignment(null)}
                className="rounded-md border border-[#DCDCDC] bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button"
                onClick={() => saveAssignmentEdit(editingAssignment.id, {
                  size: editingAssignment.size,
                  current_condition: editingAssignment.current_condition,
                  observation: editingAssignment.observation
                })}
                className="rounded-md bg-[#134686] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1E93AB]"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </IndustrialLayout>
  );
}
