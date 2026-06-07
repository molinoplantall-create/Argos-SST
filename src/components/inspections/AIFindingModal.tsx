'use client';

import React, { useState, useRef } from 'react';
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
  Loader2
} from 'lucide-react';
import { AIBadge } from './AIBadge';
import { SeveritySelector } from './SeveritySelector';
import { clsx } from 'clsx';

interface AIFindingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIFindingModal: React.FC<AIFindingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'upload' | 'form'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [severity, setSeverity] = useState('B');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    location: '',
    findingType: 'Condición',
    description: '',
    immediateAction: '',
  });

  const [aiFilled, setAiFilled] = useState({
    location: false,
    findingType: false,
    description: false,
    immediateAction: false,
  });

  if (!isOpen) return null;

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
    // Simular escaneo de IA
    setTimeout(() => {
      setIsScanning(false);
      setStep('form');
      // Simular auto-completado
      setFormData({
        location: 'Taller de Mantenimiento Mecánico - Zona B',
        findingType: 'Condición',
        description: 'Se observa derrame de aceite hidráulico cerca del motor principal sin contención secundaria.',
        immediateAction: 'Colocación de bandejas de goteo y material absorbente.',
      });
      setAiFilled({
        location: true,
        findingType: true,
        description: true,
        immediateAction: true,
      });
      setSeverity('A');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-md p-4">
      <div className="bg-[#F8FAFC] rounded-[2.5rem] shadow-premium w-full max-w-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100 bg-white/50">
          <div>
            <h2 className="text-2xl font-[900] text-[#1e293b] tracking-tight flex items-center gap-2">
              <AlertOctagon className="w-7 h-7 text-[#1E93AB]" />
              NUEVA INSPECCIÓN SSOMA
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Registro de Hallazgo Asistido por IA</p>
          </div>
          <button 
            onClick={onClose} 
            className="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-2xl transition-all hover:rotate-90"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          {step === 'upload' ? (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "relative group cursor-pointer border-4 border-dashed rounded-[2rem] transition-all duration-500 overflow-hidden",
                  isScanning ? "border-[#1E93AB] bg-[#1E93AB]/5" : "border-gray-200 hover:border-[#1E93AB]/50 bg-white hover:bg-[#F1F5F9]"
                )}
              >
                <div className="aspect-video flex flex-col items-center justify-center p-12 text-center relative z-10">
                  {previewUrl ? (
                    <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" alt="Preview" />
                  ) : null}
                  
                  <div className="bg-[#1E93AB] p-5 rounded-3xl shadow-lg shadow-[#1E93AB]/30 mb-6 group-hover:scale-110 transition-transform">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-black text-gray-700 mb-2">Capturar Evidencia</h3>
                  <p className="text-sm text-gray-400 font-bold max-w-xs">
                    Toma una foto o arrastra la imagen aquí para que la IA inicie el análisis técnico.
                  </p>
                </div>

                {/* Laser Scan Animation */}
                {isScanning && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1E93AB]/10 to-transparent animate-scan-line z-20 h-20 w-full" />
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-[#1E93AB] shadow-[0_0_15px_#1E93AB] z-30 animate-scan-line" />
                    <div className="absolute inset-0 flex items-center justify-center z-40">
                      <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-[#1E93AB]/20 flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-[#1E93AB] animate-spin" />
                        <span className="font-black text-[#1E93AB] text-sm uppercase tracking-widest">Escaneando Hallazgo...</span>
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
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-6">
                {/* Location Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Ubicación
                    </label>
                    {aiFilled.location && <AIBadge />}
                  </div>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-white border-2 border-gray-100 focus:border-[#1E93AB] rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-700 outline-none transition-all"
                  />
                </div>

                {/* Finding Type Selector */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Tipo de Hallazgo
                    </label>
                    {aiFilled.findingType && <AIBadge />}
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl">
                    <button 
                      onClick={() => setFormData({...formData, findingType: 'Acto'})}
                      className={clsx(
                        "py-2 rounded-xl text-xs font-black transition-all",
                        formData.findingType === 'Acto' ? "bg-white text-[#1E93AB] shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}
                    >ACTO</button>
                    <button 
                      onClick={() => setFormData({...formData, findingType: 'Condición'})}
                      className={clsx(
                        "py-2 rounded-xl text-xs font-black transition-all",
                        formData.findingType === 'Condición' ? "bg-white text-[#1E93AB] shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}
                    >CONDICIÓN</button>
                  </div>
                </div>
              </div>

              {/* Severity Selector */}
              <SeveritySelector value={severity} onChange={setSeverity} />

              {/* Description Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Descripción del Hallazgo
                  </label>
                  {aiFilled.description && <AIBadge />}
                </div>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white border-2 border-gray-100 focus:border-[#1E93AB] rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none transition-all min-h-[100px] resize-none"
                />
              </div>

              {/* Immediate Action Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Acción Inmediata
                  </label>
                  {aiFilled.immediateAction && <AIBadge />}
                </div>
                <textarea 
                  value={formData.immediateAction}
                  onChange={(e) => setFormData({...formData, immediateAction: e.target.value})}
                  className="w-full bg-white border-2 border-gray-100 focus:border-[#1E93AB] rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none transition-all min-h-[80px] resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setStep('upload')}
                  className="flex-1 py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Reiniciar
                </button>
                <button 
                  className="flex-[2] py-4 bg-[#1E93AB] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#1E93AB]/30 hover:bg-[#167082] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Guardar en Archivo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
