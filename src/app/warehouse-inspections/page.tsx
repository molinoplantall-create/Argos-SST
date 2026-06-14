'use client';

import React, { useMemo, useRef, useState } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { SignatureDialog } from '@/components/common/SignatureDialog';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Bot,
  Calendar,
  Camera,
  CheckCircle2,
  FileDown,
  FileSignature,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  UserRound,
  Warehouse,
  XCircle,
} from 'lucide-react';

type InspectionType = 'PLANEADA_MENSUAL' | 'PLANEADA_CSST' | 'PLANEADA_GERENCIAL' | 'NO_PLANEADA' | 'OTRO';
type CauseType = 'AI' | 'CI' | 'AS' | 'CS' | 'NA';
type RiskLevel = 'A' | 'B' | 'C';
type SignatureTarget = 'inspector' | 'responsible' | null;

type WarehouseItem = {
  id: string;
  zone: string;
  causeType: CauseType;
  riskLevel: RiskLevel;
  observation: string;
  correctiveAction: string;
  responsible: string;
  dueDate: string;
  status: 'PENDIENTE' | 'EN_PROCESO' | 'CERRADO';
  photoName?: string;
};

const fieldClass =
  'w-full rounded-md border border-[#DCDCDC] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1E93AB] focus:ring-2 focus:ring-[#1E93AB]/20';

const inspectionTypes: { value: InspectionType; label: string }[] = [
  { value: 'PLANEADA_MENSUAL', label: 'Planeada mensual' },
  { value: 'PLANEADA_CSST', label: 'Planeada CSST' },
  { value: 'PLANEADA_GERENCIAL', label: 'Planeada gerencial' },
  { value: 'NO_PLANEADA', label: 'No planeada' },
  { value: 'OTRO', label: 'Otro' },
];

const areaTypes = ['Almacenes', 'Molino', 'Maestranza', 'Quemador', 'Chancado', 'Mantenimiento', 'Operaciones', 'Otro'];

const initialItems: WarehouseItem[] = [];

const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn('rounded-lg border border-[#DCDCDC] bg-white p-5 shadow-sm', className)}>
    {children}
  </section>
);

function riskDueDays(riskLevel: RiskLevel) {
  if (riskLevel === 'A') return 1;
  if (riskLevel === 'B') return 3;
  return 7;
}

function causeLabel(causeType: CauseType) {
  const labels: Record<CauseType, string> = {
    AI: 'Acto inseguro',
    CI: 'Condicion insegura',
    AS: 'Acto subestandar',
    CS: 'Condicion subestandar',
    NA: 'No aplica',
  };
  return labels[causeType];
}

function StatusPill({ item }: { item: WarehouseItem }) {
  if (item.status === 'CERRADO') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-black text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Cerrado
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black',
        item.riskLevel === 'A' ? 'bg-red-100 text-[#E62727]' : 'bg-orange-100 text-[#B45309]'
      )}
    >
      <XCircle className="h-3 w-3" />
      {item.status === 'EN_PROCESO' ? 'En proceso' : 'Pendiente'}
    </span>
  );
}

export default function WarehouseInspectionsPage() {
  const [inspectionType, setInspectionType] = useState<InspectionType>('PLANEADA_MENSUAL');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [clientName, setClientName] = useState('MINERA INMACULADA CONCEPCION Y MILAGROSA E.I.R.L');
  const [ruc, setRuc] = useState('20534547715');
  const [project, setProject] = useState('Planta Saramarca II');
  const [inspectedAreas, setInspectedAreas] = useState('Almacenes');
  const [specificZone, setSpecificZone] = useState('Almacen principal');
  const [areaResponsible, setAreaResponsible] = useState('Responsable de almacen');
  const [objective, setObjective] = useState('Verificar el cumplimiento de estandares SSOMA, orden, limpieza y control operacional en almacenes.');
  const [inspectorName, setInspectorName] = useState('Luis Campos');
  const [items, setItems] = useState<WarehouseItem[]>(initialItems);
  const [selectedItemId, setSelectedItemId] = useState(initialItems[0].id);
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget>(null);
  const [inspectorSignatureUrl, setInspectorSignatureUrl] = useState('');
  const [responsibleSignatureUrl, setResponsibleSignatureUrl] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0];
  const openCount = useMemo(() => items.filter((item) => item.status !== 'CERRADO').length, [items]);
  const criticalCount = useMemo(() => items.filter((item) => item.riskLevel === 'A' && item.status !== 'CERRADO').length, [items]);
  const photoCount = useMemo(() => items.filter((item) => item.photoName).length, [items]);

  function updateItem(id: string, patch: Partial<WarehouseItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem() {
    const nextItem: WarehouseItem = {
      id: `warehouse-item-${Date.now()}`,
      zone: 'Nueva zona / labor',
      causeType: 'CI',
      riskLevel: 'C',
      observation: '',
      correctiveAction: '',
      responsible: areaResponsible,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'PENDIENTE',
    };

    setItems((current) => [...current, nextItem]);
    setSelectedItemId(nextItem.id);
  }

  function deleteSelectedItem() {
    if (!selectedItem) return;

    const remaining = items.filter((item) => item.id !== selectedItem.id);
    setItems(remaining);
    setSelectedItemId(remaining[0]?.id ?? '');
  }

  function applyRiskLevel(itemId: string, riskLevel: RiskLevel) {
    updateItem(itemId, {
      riskLevel,
      dueDate: new Date(Date.now() + riskDueDays(riskLevel) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
  }

  function suggestAction(item: WarehouseItem) {
    const observation = item.observation.trim().toLowerCase();
    let suggestion = 'Corregir condicion observada, registrar evidencia de cierre y verificar que no se repita.';

    if (observation.includes('5s') || observation.includes('orden') || observation.includes('limpieza')) {
      suggestion = 'Aplicar 5S, retirar materiales innecesarios, limpiar la zona y rotular ubicaciones.';
    }

    if (observation.includes('aceite') || observation.includes('derrame') || observation.includes('lubricante')) {
      suggestion = 'Contener y limpiar derrame, disponer residuo segun procedimiento y reponer kit antiderrame.';
    }

    if (observation.includes('extintor')) {
      suggestion = 'Actualizar inspeccion del extintor, verificar presion, acceso libre y tarjeta vigente.';
    }

    updateItem(item.id, { correctiveAction: suggestion });
  }

  function saveSignature(signatureUrl: string) {
    if (signatureTarget === 'inspector') setInspectorSignatureUrl(signatureUrl);
    if (signatureTarget === 'responsible') setResponsibleSignatureUrl(signatureUrl);
    setSignatureTarget(null);
  }

  async function downloadPdf() {
    if (items.length === 0) return;

    setIsGeneratingPdf(true);
    try {
      const response = await fetch('/api/reports/warehouse-inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentCode: 'SST-ALM-INS',
          revision: '00',
          inspectionType,
          inspectionDate,
          client: {
            legalName: clientName,
            ruc,
            project,
          },
          inspectedAreas: specificZone.trim() ? `${inspectedAreas} - ${specificZone}` : inspectedAreas,
          areaResponsible,
          objective,
          inspector: {
            fullName: inspectorName,
            signatureUrl: inspectorSignatureUrl,
          },
          responsibleSignatureUrl,
          items,
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
      link.download = `inspeccion-almacenes-${inspectionDate}.pdf`;
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
              <Warehouse className="h-4 w-4" />
              ARGOS SST / Luis Campos
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[#134686]">Inspecciones por area</h1>
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
                items.length === 0 || isGeneratingPdf ? 'cursor-not-allowed bg-gray-400' : 'bg-[#134686] hover:bg-[#1E93AB]'
              )}
            >
              <FileDown className="h-4 w-4" />
              {isGeneratingPdf ? 'Generando...' : 'PDF formato'}
            </button>
          </div>
        </div>

        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#111827]">
              <UserRound className="h-4 w-4 text-[#1E93AB]" />
              Datos generales
            </h2>
            <span className="rounded-full bg-[#F3F2EC] px-3 py-1 text-xs font-bold text-[#134686]">
              Formato inspeccion de areas
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <label className="space-y-1 lg:col-span-2">
              <span className="text-xs font-bold text-gray-500">Razon social</span>
              <input className={fieldClass} value={clientName} onChange={(event) => setClientName(event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-gray-500">RUC</span>
              <input className={fieldClass} value={ruc} onChange={(event) => setRuc(event.target.value)} />
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
            <label className="space-y-1">
              <span className="text-xs font-bold text-gray-500">Tipo de inspeccion</span>
              <select className={fieldClass} value={inspectionType} onChange={(event) => setInspectionType(event.target.value as InspectionType)}>
                {inspectionTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-gray-500">Area / modulo</span>
              <select className={fieldClass} value={inspectedAreas} onChange={(event) => setInspectedAreas(event.target.value)}>
                {areaTypes.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-gray-500">Proyecto / unidad</span>
              <input className={fieldClass} value={project} onChange={(event) => setProject(event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-gray-500">Zona especifica</span>
              <input className={fieldClass} value={specificZone} onChange={(event) => setSpecificZone(event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold text-gray-500">Responsable del area</span>
              <input className={fieldClass} value={areaResponsible} onChange={(event) => setAreaResponsible(event.target.value)} />
            </label>
            <label className="space-y-1 lg:col-span-4">
              <span className="text-xs font-bold text-gray-500">Objetivo de la inspeccion</span>
              <textarea className={cn(fieldClass, 'min-h-20 resize-y')} value={objective} onChange={(event) => setObjective(event.target.value)} />
            </label>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.82fr_1.18fr_0.65fr]">
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#111827]">
                <AlertTriangle className="h-4 w-4 text-[#1E93AB]" />
                Zonas / hallazgos
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 rounded-md bg-[#FF7F11] px-3 py-2 text-xs font-black text-white transition hover:bg-[#E62727]"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={cn(
                    'w-full rounded-md border p-3 text-left transition',
                    selectedItem?.id === item.id ? 'border-[#1E93AB] bg-[#F3F2EC]' : 'border-[#DCDCDC] bg-white hover:border-[#1E93AB]'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-[#1E93AB]">Item {index + 1} / Riesgo {item.riskLevel}</p>
                      <p className="mt-1 font-bold text-[#134686]">{item.zone}</p>
                      <p className="mt-1 text-xs text-gray-500">{causeLabel(item.causeType)}</p>
                    </div>
                    <StatusPill item={item} />
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[#1E93AB]">Detalle de inspeccion</p>
                    <h2 className="mt-1 text-xl font-bold text-[#134686]">{selectedItem.zone}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={deleteSelectedItem}
                    className="flex items-center gap-2 rounded-md border border-[#E62727] px-3 py-2 text-sm font-black text-[#E62727] transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-1 xl:col-span-2">
                    <span className="text-xs font-bold text-gray-500">Seccion / zona / labor</span>
                    <input className={fieldClass} value={selectedItem.zone} onChange={(event) => updateItem(selectedItem.id, { zone: event.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-gray-500">Causa</span>
                    <select className={fieldClass} value={selectedItem.causeType} onChange={(event) => updateItem(selectedItem.id, { causeType: event.target.value as CauseType })}>
                      <option value="AI">AI - Acto inseguro</option>
                      <option value="CI">CI - Condicion insegura</option>
                      <option value="AS">AS - Acto subestandar</option>
                      <option value="CS">CS - Condicion subestandar</option>
                      <option value="NA">No aplica</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-gray-500">Clasificacion</span>
                    <select className={fieldClass} value={selectedItem.riskLevel} onChange={(event) => applyRiskLevel(selectedItem.id, event.target.value as RiskLevel)}>
                      <option value="A">A - 24 horas</option>
                      <option value="B">B - 72 horas</option>
                      <option value="C">C - menor</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-gray-500">Observaciones</span>
                    <textarea
                      className={cn(fieldClass, 'min-h-28 resize-y')}
                      value={selectedItem.observation}
                      onChange={(event) => updateItem(selectedItem.id, { observation: event.target.value })}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-gray-500">Accion correctiva / recomendacion</span>
                    <textarea
                      className={cn(fieldClass, 'min-h-28 resize-y')}
                      value={selectedItem.correctiveAction}
                      onChange={(event) => updateItem(selectedItem.id, { correctiveAction: event.target.value })}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-gray-500">Responsable</span>
                    <input className={fieldClass} value={selectedItem.responsible} onChange={(event) => updateItem(selectedItem.id, { responsible: event.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-gray-500">Fecha compromiso</span>
                    <input className={fieldClass} type="date" value={selectedItem.dueDate} onChange={(event) => updateItem(selectedItem.id, { dueDate: event.target.value })} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-gray-500">Estado</span>
                    <select className={fieldClass} value={selectedItem.status} onChange={(event) => updateItem(selectedItem.id, { status: event.target.value as WarehouseItem['status'] })}>
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN_PROCESO">En proceso</option>
                      <option value="CERRADO">Cerrado</option>
                    </select>
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
                  <button
                    type="button"
                    onClick={() => suggestAction(selectedItem)}
                    className="flex items-center gap-2 rounded-md bg-[#1E93AB] px-3 py-2 text-sm font-black text-white transition hover:bg-[#134686]"
                  >
                    <Bot className="h-4 w-4" />
                    Sugerir texto IA
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-[#DCDCDC] p-8 text-center text-gray-500">
                Agrega una zona o hallazgo para iniciar la inspeccion.
              </div>
            )}
          </Panel>

          <div className="space-y-4">
            <Panel className="bg-[#134686] text-white">
              <p className="text-xs font-black uppercase tracking-widest text-[#FFB26B]">Resumen</p>
              <h2 className="mt-2 text-lg font-bold">{project}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Items</p>
                  <p className="mt-1 text-2xl font-black">{items.length}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Abiertos</p>
                  <p className="mt-1 text-2xl font-black">{openCount}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Criticos A</p>
                  <p className="mt-1 text-2xl font-black">{criticalCount}</p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-300">Fotos</p>
                  <p className="mt-1 text-2xl font-black">{photoCount}</p>
                </div>
              </div>
            </Panel>

            <Panel>
              <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-[#134686]">Firmas</h2>
              <label className="mb-3 block space-y-1">
                <span className="text-xs font-bold text-gray-500">Inspector</span>
                <input className={fieldClass} value={inspectorName} onChange={(event) => setInspectorName(event.target.value)} />
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSignatureTarget('inspector')}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-black transition',
                    inspectorSignatureUrl ? 'border-green-200 bg-green-50 text-green-700' : 'border-[#DCDCDC] text-[#134686] hover:border-[#1E93AB]'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    Inspector
                  </span>
                  <span>{inspectorSignatureUrl ? 'Firmado' : 'Pendiente'}</span>
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
        title={signatureTarget === 'inspector' ? `Firma inspector: ${inspectorName}` : `Firma responsable: ${areaResponsible}`}
        onClose={() => setSignatureTarget(null)}
        onSave={saveSignature}
      />
    </IndustrialLayout>
  );
}
