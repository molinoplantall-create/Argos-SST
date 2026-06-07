'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  Save, 
  MapPin, 
  AlertOctagon, 
  FileText, 
  Zap,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/common/FeedbackUI';
import { AIBadge } from './AIBadge';
import { SeveritySelector } from './SeveritySelector';
import { clsx } from 'clsx';

interface NewInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewInspectionModal: React.FC<NewInspectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const router = useRouter();
  const { showToast } = useFeedback();
  
  const [step, setStep] = useState<'upload' | 'form'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    area_id: '',
    location_details: '',
    finding_type: 'Condición',
    cause_type: 'CI' as 'AI' | 'CI',
    description: '',
    immediate_action: '',
    severity: 'B',
    inspection_purpose: 'Verificar el cumplimiento de los estándares establecidos en Planta Saramarca II',
    hazard_id: '',
  });

  const [aiFilled, setAiFilled] = useState({
    area_id: false,
    location_details: false,
    finding_type: false,
    cause_type: false,
    description: false,
    immediate_action: false,
    hazard_id: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
    }
  }, [isOpen]);

  const fetchMetadata = async () => {
    const [areasRes, hazardsRes] = await Promise.all([
      supabase.from('areas').select('*').order('name'),
      supabase.from('iperc_hazards').select('*').order('code')
    ]);

    if (areasRes.data) setAreas(areasRes.data);
    if (hazardsRes.data) setHazards(hazardsRes.data);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      startScanning();
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    // Simular escaneo de IA para la UI/UX solicitada
    setTimeout(() => {
      setIsScanning(false);
      setStep('form');
      
      // Simular auto-completado por IA
      setFormData(prev => ({
        ...prev,
        location_details: 'Zona de Chancadora - Nivel 1',
        finding_type: 'Condición',
        cause_type: 'CI',
        description: 'Se observa falta de guarda de seguridad para la cardan y poleas en el motor principal.',
        immediate_action: 'Instalar guarda de seguridad provisional y señalizar área.',
        severity: 'A',
        hazard_id: hazards.find(h => h.code.includes('MEC'))?.id || '',
      }));
      
      setAiFilled({
        area_id: false,
        location_details: true,
        finding_type: true,
        cause_type: true,
        description: true,
        immediate_action: true,
        hazard_id: true,
      });
    }, 2800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Obtener el tipo de inspección por defecto (MENSUAL)
      const { data: typeData } = await supabase
        .from('inspection_types')
        .select('id')
        .eq('name', 'MENSUAL')
        .single();

      // 1. Crear Inspección
      const { data: ins, error: insErr } = await supabase
        .from('inspections')
        .insert({
          area_id: formData.area_id || areas[0]?.id,
          type_id: typeData?.id || null,
          inspection_code: `SSOMA-${Date.now().toString().slice(-6)}`,
          status: 'COMPLETADA',
          summary: formData.inspection_purpose,
          inspector_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (insErr) throw insErr;

      // 2. Registrar Hallazgo con Causa e IPERC
      const { error: findErr } = await supabase
        .from('findings')
        .insert({
          inspection_id: ins.id,
          observation: formData.description,
          severity: formData.severity,
          cause_type: formData.cause_type,
          hazard_id: formData.hazard_id || null,
          status: 'ABIERTO'
        });

      if (findErr) throw findErr;

      showToast('Inspección registrada con éxito', 'success');
      onSuccess();
      onClose();
      router.push(`/inspections/${ins.id}`);
    } catch (error: any) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#F8FAFC] rounded-[3rem] shadow-premium w-full max-w-5xl h-[90vh] my-auto overflow-hidden flex flex-col border border-white/50 animate-in fade-in zoom-in duration-300">
        
        {/* Header Premium */}
        <div className="px-10 py-8 flex justify-between items-center border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shrink-0">
          <div>
            <h2 className="text-2xl font-[900] text-[#1e293b] tracking-tight flex items-center gap-3">
              <div className="bg-[#1E93AB]/10 p-2 rounded-xl">
                <AlertOctagon className="w-7 h-7 text-[#1E93AB]" />
              </div>
              NUEVA INSPECCIÓN SSOMA
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <div className="h-1 w-8 bg-[#1E93AB] rounded-full" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SISTEMA DE PREVENCIÓN ASISTIDO POR IA</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="bg-gray-100 hover:bg-gray-200 p-3 rounded-2xl transition-all hover:rotate-90 group"
          >
            <X className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
          {step === 'upload' ? (
            <div className="space-y-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "relative group cursor-pointer border-4 border-dashed rounded-[2.5rem] transition-all duration-700 overflow-hidden",
                  isScanning ? "border-[#1E93AB] bg-[#1E93AB]/5" : "border-gray-100 hover:border-[#1E93AB]/30 bg-white hover:bg-[#F8FAFC]"
                )}
              >
                <div className="aspect-video flex flex-col items-center justify-center p-12 text-center relative z-10">
                  {previewUrl && (
                    <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[2px]" alt="Preview" />
                  )}
                  
                  <div className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-gray-200 mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <Camera className="w-12 h-12 text-[#1E93AB]" />
                  </div>
                  
                  <h3 className="text-2xl font-[900] text-gray-800 mb-3">Evidencia Fotográfica</h3>
                  <p className="text-sm text-gray-400 font-bold max-w-sm leading-relaxed">
                    Sube una imagen del hallazgo. Nuestro motor de IA analizará la condición para auto-generar la ficha técnica.
                  </p>
                  
                  <button className="mt-8 px-8 py-3 bg-white border-2 border-[#1E93AB]/20 text-[#1E93AB] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1E93AB] hover:text-white transition-all shadow-sm">
                    Seleccionar Archivo
                  </button>
                </div>

                {/* Laser Scan Animation */}
                {isScanning && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1E93AB]/0 via-[#1E93AB]/20 to-[#1E93AB]/0 animate-scan-line z-20 h-40 w-full" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#1E93AB] shadow-[0_0_20px_#1E93AB] z-30 animate-scan-line" />
                    <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/5">
                      <div className="bg-white/95 backdrop-blur-xl px-8 py-5 rounded-[2rem] shadow-2xl border border-[#1E93AB]/30 flex flex-col items-center gap-4 animate-bounce">
                        <Loader2 className="w-8 h-8 text-[#1E93AB] animate-spin" />
                        <div className="text-center">
                          <span className="block font-black text-[#1E93AB] text-sm uppercase tracking-tighter">Procesando con IA</span>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Identificando Riesgos...</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*" 
              />
              
              <div className="flex items-center justify-center gap-4 text-gray-300">
                <div className="h-px w-12 bg-gray-100" />
                <span className="text-[10px] font-black uppercase tracking-widest">O continúa manualmente</span>
                <div className="h-px w-12 bg-gray-100" />
              </div>
              
              <button 
                onClick={() => setStep('form')}
                className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-[#1E93AB] transition-colors"
              >
                Omitir escaneo y llenar formulario
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              {/* Grid de Datos Maestros */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1E93AB]" /> Área / Unidad
                  </label>
                  <select 
                    required
                    value={formData.area_id}
                    onChange={(e) => setFormData({...formData, area_id: e.target.value})}
                    className="w-full bg-white border-2 border-gray-100 focus:border-[#1E93AB] rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none transition-all appearance-none"
                  >
                    <option value="">Seleccionar Área</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#1E93AB]" /> Causa (AI/CI)
                    </label>
                    {aiFilled.cause_type && <AIBadge />}
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, cause_type: 'AI'})}
                      className={clsx(
                        "py-3 rounded-xl text-[10px] font-black transition-all duration-300 whitespace-nowrap px-2 overflow-hidden text-ellipsis",
                        formData.cause_type === 'AI' ? "bg-[#E62727] text-white shadow-lg scale-[1.02]" : "text-gray-400 hover:text-gray-600"
                      )}
                    >AI (ACTO)</button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, cause_type: 'CI'})}
                      className={clsx(
                        "py-3 rounded-xl text-[10px] font-black transition-all duration-300 whitespace-nowrap px-2",
                        formData.cause_type === 'CI' ? "bg-[#7C3AED] text-white shadow-lg scale-[1.02]" : "text-gray-400 hover:text-gray-600"
                      )}
                    >CI (CONDICIÓN)</button>
                  </div>
                </div>
              </div>

              {/* Objeto de la Inspección */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#1E93AB]" /> Objeto de la Inspección
                </label>
                <input 
                  type="text" 
                  value={formData.inspection_purpose}
                  onChange={(e) => setFormData({...formData, inspection_purpose: e.target.value})}
                  className="w-full bg-white border-2 border-gray-100 focus:border-[#1E93AB] rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none transition-all"
                />
              </div>

              {/* Peligro IPERC */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#1E93AB]" /> Peligro (IPERC)
                  </label>
                  {aiFilled.hazard_id && <AIBadge />}
                </div>
                <select 
                  value={formData.hazard_id}
                  onChange={(e) => setFormData({...formData, hazard_id: e.target.value})}
                  className="w-full bg-white border-2 border-gray-100 focus:border-[#1E93AB] rounded-2xl px-6 py-4 text-[13px] font-bold text-gray-700 outline-none transition-all appearance-none overflow-hidden text-ellipsis"
                >
                  <option value="">Seleccionar Peligro del IPERC...</option>
                  {hazards.map(h => (
                    <option key={h.id} value={h.id}>{h.code} - {h.description}</option>
                  ))}
                </select>
              </div>

              {/* Ubicación Específica */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#1E93AB]" /> Ubicación Detallada
                  </label>
                  {aiFilled.location_details && <AIBadge />}
                </div>
                <input 
                  type="text" 
                  value={formData.location_details}
                  onChange={(e) => setFormData({...formData, location_details: e.target.value})}
                  placeholder="Ej: Molino Sag - Lado Norte"
                  className="w-full bg-white border-2 border-gray-100 focus:border-[#1E93AB] rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              {/* Selector de Severidad */}
              <SeveritySelector 
                value={formData.severity} 
                onChange={(val) => setFormData({...formData, severity: val})} 
              />

              {/* Descripción */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1E93AB]" /> Descripción del Hallazgo
                  </label>
                  {aiFilled.description && <AIBadge />}
                </div>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white border-2 border-gray-100 focus:border-[#1E93AB] rounded-[2rem] px-6 py-5 text-sm font-bold text-gray-700 outline-none transition-all min-h-[120px] resize-none leading-relaxed"
                />
              </div>

              {/* Acción Inmediata */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Acción Inmediata Tomada
                  </label>
                  {aiFilled.immediate_action && <AIBadge />}
                </div>
                <textarea 
                  value={formData.immediate_action}
                  onChange={(e) => setFormData({...formData, immediate_action: e.target.value})}
                  className="w-full bg-white border-2 border-gray-100 focus:border-[#1E93AB] rounded-[1.5rem] px-6 py-4 text-sm font-bold text-gray-700 outline-none transition-all min-h-[80px] resize-none leading-relaxed"
                />
              </div>

              {/* Footer con Botón Premium */}
              <div className="flex gap-6 pt-6 sticky bottom-0 bg-[#F8FAFC]/80 backdrop-blur-sm pb-2">
                <button 
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setPreviewUrl(null);
                  }}
                  className="flex-1 py-5 bg-white border-2 border-gray-100 text-gray-400 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-gray-50 hover:text-gray-600 transition-all"
                >
                  Regresar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2.5] py-5 bg-[#1E93AB] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.15em] shadow-2xl shadow-[#1E93AB]/40 hover:bg-[#167082] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {loading ? 'SINCRONIZANDO...' : 'GUARDAR EN ARCHIVO'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
