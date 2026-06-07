'use client';

import React, { useEffect, useMemo, useState } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { SignatureDialog } from '@/components/common/SignatureDialog';
import {
  BadgeCheck,
  Calendar,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CatalogItem = {
  id: string;
  name: string;
  bodyZone: string;
  unit: string;
  certification?: string;
  unitPrice?: number;
};

type Worker = {
  id: string;
  fullName: string;
  documentNumber: string;
  position: string;
  area: string;
};

type DeliveryItem = CatalogItem & {
  quantity: number;
  size?: string;
  observation?: string;
  workerSignatureUrl?: string;
  signedAt?: string;
};

const catalog: CatalogItem[] = [
  { id: 'epp-001', name: 'Casco de Seguridad', bodyZone: 'Cabeza', unit: 'Unidad', certification: 'ANSI Z89.1', unitPrice: 38 },
  { id: 'epp-002', name: 'Lentes de Seguridad', bodyZone: 'Ojos', unit: 'Unidad', certification: 'ANSI Z87.1', unitPrice: 12 },
  { id: 'epp-003', name: 'Tapones Auditivos', bodyZone: 'Oidos', unit: 'Par', certification: 'NRR 25 dB', unitPrice: 3.5 },
  { id: 'epp-004', name: 'Respirador / Mascarilla', bodyZone: 'Respiratorio', unit: 'Unidad', certification: 'NIOSH N95', unitPrice: 8 },
  { id: 'epp-005', name: 'Chaleco Reflectivo', bodyZone: 'Torso', unit: 'Unidad', certification: 'ANSI 107', unitPrice: 24 },
  { id: 'epp-006', name: 'Guantes de Seguridad', bodyZone: 'Manos', unit: 'Par', certification: 'EN 388', unitPrice: 16 },
  { id: 'epp-007', name: 'Botas de Seguridad', bodyZone: 'Pies', unit: 'Par', certification: 'ASTM F2413', unitPrice: 120 },
];

const workers: Worker[] = [
  { id: 'worker-001', fullName: 'Juan Perez Garcia', documentNumber: '45678901', position: 'Operario', area: 'Produccion' },
  { id: 'worker-002', fullName: 'Carlos Lopez Rios', documentNumber: '52341678', position: 'Tecnico', area: 'Mantenimiento' },
  { id: 'worker-003', fullName: 'Miguel Torres Diaz', documentNumber: '61234567', position: 'Supervisor', area: 'Produccion' },
  { id: 'worker-004', fullName: 'Pedro Vargas Silva', documentNumber: '47891234', position: 'Operario', area: 'Almacen' },
];

const demoDeliveries = [
  {
    id: 'R-MICM-SSO-008-0001',
    worker: 'Juan Perez Garcia',
    date: '2026-05-30',
    status: 'BORRADOR',
    items: 3,
  },
  {
    id: 'R-MICM-SSO-008-0002',
    worker: 'Carlos Lopez Rios',
    date: '2026-05-29',
    status: 'FIRMADO',
    items: 5,
  },
];

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
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0].id);
  const [workerSearch, setWorkerSearch] = useState(`${workers[0].documentNumber} - ${workers[0].fullName}`);
  const [deliveredBy, setDeliveredBy] = useState('Luis Campos');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEppId, setSelectedEppId] = useState(catalog[0].id);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('');
  const [certification, setCertification] = useState(catalog[0].certification ?? '');
  const [observation, setObservation] = useState('Conforme');
  const [responsibleSignatureUrl, setResponsibleSignatureUrl] = useState('');
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [items, setItems] = useState<DeliveryItem[]>([
    { ...catalog[0], quantity: 1, observation: 'Conforme', workerSignatureUrl: 'demo-signature-worker-1' },
    { ...catalog[5], quantity: 1, size: 'M', observation: 'Conforme' },
  ]);

  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId) ?? workers[0];
  const selectedEpp = catalog.find((item) => item.id === selectedEppId) ?? catalog[0];

  useEffect(() => {
    setCertification(selectedEpp.certification ?? '');
  }, [selectedEpp]);

  const totalEstimated = useMemo(
    () => items.reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0),
    [items]
  );
  const signedItems = useMemo(() => items.filter((item) => item.workerSignatureUrl).length, [items]);

  const filteredCatalog = catalog.filter((item) =>
    `${item.name} ${item.bodyZone} ${item.certification ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function selectWorker(workerId: string) {
    const worker = workers.find((item) => item.id === workerId) ?? workers[0];
    setSelectedWorkerId(worker.id);
    setWorkerSearch(`${worker.documentNumber} - ${worker.fullName}`);
    setItems([]);
    setResponsibleSignatureUrl('');
    setSignatureTarget(null);
  }

  function addItem() {
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

  async function downloadPdf() {
    if (items.length === 0) return;

    setIsGeneratingPdf(true);
    try {
      const response = await fetch('/api/reports/epp-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentCode: 'R-MIC&M-SSO-008',
          revision: '02',
          deliveryDate,
          client: {
            legalName: 'MINERA INMACULADA CONCEPCION Y MILAGROSA',
            ruc: '20534547715',
            address: 'CALLE TRUJILLO 351 - PALPA / SARAMARCA',
            activity: 'MINERIA',
          },
          worker: {
            fullName: selectedWorker.fullName,
            documentNumber: selectedWorker.documentNumber,
            position: selectedWorker.position,
            area: selectedWorker.area,
          },
          deliveredBy: {
            fullName: deliveredBy,
            signatureUrl: responsibleSignatureUrl,
          },
          items: items.map((item) => ({
            name: item.name,
            bodyZone: item.bodyZone,
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
      link.download = `entrega-epp-${selectedWorker.documentNumber}-${deliveryDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
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
              ARGOS SST / Luis Campos
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[#134686]">Entrega de EPP</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 rounded-md border border-[#DCDCDC] bg-white px-4 py-2 text-sm font-bold text-[#134686] transition hover:border-[#1E93AB] hover:text-[#1E93AB]">
              <Save className="h-4 w-4" />
              Guardar borrador
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={items.length === 0 || isGeneratingPdf}
              className={cn(
                'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white transition',
                items.length === 0 || isGeneratingPdf
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-[#134686] hover:bg-[#1E93AB]'
              )}
            >
              <FileDown className="h-4 w-4" />
              {isGeneratingPdf ? 'Generando...' : 'PDF formato'}
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
                        const found = workers.find((worker) => value.includes(worker.documentNumber) || value.includes(worker.fullName));
                        if (found) selectWorker(found.id);
                      }}
                    />
                    <datalist id="delivery-workers-list">
                      {workers.map((worker) => (
                        <option key={worker.id} value={`${worker.documentNumber} - ${worker.fullName}`} />
                      ))}
                    </datalist>
                  </div>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">DNI / Codigo</span>
                  <input className={fieldClass} value={selectedWorker.documentNumber} readOnly />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Cargo</span>
                  <input className={fieldClass} value={selectedWorker.position} readOnly />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">Area</span>
                  <input className={fieldClass} value={selectedWorker.area} readOnly />
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
                        {item.name} - {item.bodyZone}
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
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#FF7F11] px-4 text-sm font-black text-white transition hover:bg-[#E62727] lg:w-auto"
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
                                  title: `Firma de ${selectedWorker.fullName} por ${item.name}`,
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
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel className="bg-[#134686] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#FFB26B]">Resumen</p>
                  <h2 className="mt-2 text-xl font-bold">{selectedWorker.fullName || 'Sin trabajador'}</h2>
                </div>
                <PackageCheck className="h-8 w-8 text-[#FF7F11]" />
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
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Responsable</p>
                  <p className="mt-1 text-lg font-black">{responsibleSignatureUrl ? 'Firmado' : 'Pendiente'}</p>
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
                  <strong>BORRADOR</strong>
                </div>
              </div>
            </Panel>

            <Panel>
              <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-[#134686]">Ultimas entregas</h2>
              <div className="space-y-3">
                {demoDeliveries.map((delivery) => (
                  <div key={delivery.id} className="rounded-md border border-[#E5E7EB] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-[#1E93AB]">{delivery.id}</p>
                        <p className="mt-1 font-bold text-[#134686]">{delivery.worker}</p>
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
                      <span>{delivery.date}</span>
                      <span>{delivery.items} EPP</span>
                    </div>
                  </div>
                ))}
              </div>
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
