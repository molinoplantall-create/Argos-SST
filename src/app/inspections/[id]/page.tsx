'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/common/FeedbackUI';
import { 
  ClipboardCheck, 
  ChevronLeft, 
  Plus, 
  Save, 
  AlertTriangle, 
  Camera, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InspectionExecutionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useFeedback();
  
  const [inspection, setInspection] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado para el nuevo ítem
  const [newItem, setNewItem] = useState({
    section_name: '',
    area_label: '',
    positive_evidence: '',
    observations: '',
    is_compliant: true
  });

  useEffect(() => {
    if (id) {
      loadInspectionData();
    }
  }, [id]);

  const loadInspectionData = async () => {
    try {
      setLoading(true);
      // Cargar cabecera
      const { data: ins, error: insErr } = await supabase
        .from('inspections')
        .select('*, areas(name), subareas(name), inspection_types(name)')
        .eq('id', id)
        .single();

      if (insErr) throw insErr;
      setInspection(ins);

      // Cargar ítems
      const { data: its, error: itsErr } = await supabase
        .from('inspection_items')
        .select('*')
        .eq('inspection_id', id)
        .order('created_at', { ascending: true });

      if (itsErr) throw itsErr;
      setItems(its || []);
    } catch (error: any) {
      console.error('Error loading inspection:', error);
      showToast('Error al cargar la inspección', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.section_name) {
      showToast('El nombre de la sección es obligatorio', 'error');
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('inspection_items')
        .insert({
          inspection_id: id,
          item_number: items.length + 1,
          section_name: newItem.section_name,
          area_label: newItem.area_label,
          positive_evidence: newItem.positive_evidence,
          observations: newItem.observations,
          is_compliant: newItem.is_compliant
        })
        .select()
        .single();

      if (error) throw error;

      setItems([...items, data]);
      setNewItem({
        section_name: '',
        area_label: '',
        positive_evidence: '',
        observations: '',
        is_compliant: true
      });
      showToast('Ítem agregado', 'success');
    } catch (error: any) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('inspection_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setItems(items.filter(i => i.id !== itemId));
      showToast('Ítem eliminado', 'success');
    } catch (error: any) {
      showToast('Error al eliminar ítem', 'error');
    }
  };

  if (loading) {
    return (
      <IndustrialLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-[#FF7F11] animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse">Cargando Formato de Inspección...</p>
        </div>
      </IndustrialLayout>
    );
  }

  return (
    <IndustrialLayout>
      <div className="space-y-6 pb-20">
        {/* Header con navegación */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-[#DCDCDC] shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/inspections')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#1a1a1a]">
                Ejecución: {inspection?.inspection_code || 'S/C'}
              </h1>
              <p className="text-sm text-gray-500">
                {inspection?.areas?.name} / {inspection?.subareas?.name} • {inspection?.inspection_types?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => router.push(`/inspections`)}
              className="flex-1 md:flex-none px-6 py-2 border border-[#DCDCDC] rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              Guardar Borrador
            </button>
            <button className="flex-1 md:flex-none px-6 py-2 bg-[#FF7F11] text-white rounded-lg font-bold hover:bg-[#e66f00] shadow-md transition-all">
              Finalizar y Firmar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal: Check-list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-industrial">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#FF7F11]" /> 
                Checklist de Inspección
              </h2>

              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-[#DCDCDC] rounded-xl text-gray-400">
                    <p>No hay ítems registrados. Comienza agregando uno abajo.</p>
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div key={item.id} className="p-4 border border-[#DCDCDC] rounded-xl hover:border-[#1E93AB] transition-colors group relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-[#1E93AB] bg-[#1E93AB]/10 px-2 py-0.5 rounded-full">
                          ÍTEM #{item.item_number}
                        </span>
                        <div className="flex items-center gap-2">
                           <span className={cn(
                             "text-[10px] font-bold px-2 py-0.5 rounded-full",
                             item.is_compliant ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                           )}>
                             {item.is_compliant ? 'CUMPLE' : 'NO CUMPLE'}
                           </span>
                           <button 
                             onClick={() => handleDeleteItem(item.id)}
                             className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded-md transition-all"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-800">{item.section_name}</h4>
                      {item.area_label && <p className="text-xs text-gray-500 mb-2 italic">Ubicación: {item.area_label}</p>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Evidencia Positiva</p>
                          <p className="text-sm text-gray-600">{item.positive_evidence || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Observaciones</p>
                          <p className="text-sm text-gray-600">{item.observations || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Formulario para agregar ítem */}
              <div className="mt-8 pt-6 border-t border-[#DCDCDC] bg-gray-50 p-6 rounded-xl">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Agregar nuevo punto de inspección
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sección / Elemento a Inspeccionar</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Estado de extintores, Tableros eléctricos..."
                      className="input-industrial w-full"
                      value={newItem.section_name}
                      onChange={(e) => setNewItem({...newItem, section_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ubicación Específica</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Almacén central"
                      className="input-industrial w-full"
                      value={newItem.area_label}
                      onChange={(e) => setNewItem({...newItem, area_label: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Resultado</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setNewItem({...newItem, is_compliant: true})}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 font-bold transition-all",
                          newItem.is_compliant ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-400"
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" /> CUMPLE
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewItem({...newItem, is_compliant: false})}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 font-bold transition-all",
                          !newItem.is_compliant ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-400"
                        )}
                      >
                        <XCircle className="w-4 h-4" /> NO CUMPLE
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Evidencia Positiva / Notas</label>
                    <textarea 
                      placeholder="Describe lo que está bien..."
                      className="input-industrial w-full min-h-[60px]"
                      value={newItem.positive_evidence}
                      onChange={(e) => setNewItem({...newItem, positive_evidence: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Observaciones / Deficiencias</label>
                    <textarea 
                      placeholder="Describe fallas o mejoras..."
                      className="input-industrial w-full min-h-[60px]"
                      value={newItem.observations}
                      onChange={(e) => setNewItem({...newItem, observations: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddItem}
                  disabled={saving}
                  className="mt-4 w-full py-3 bg-[#1E93AB] text-white rounded-lg font-bold hover:bg-[#167082] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Registrar Ítem en Formato
                </button>
              </div>
            </div>
          </div>

          {/* Columna Lateral: Hallazgos Críticos */}
          <div className="space-y-6">
            <div className="card-industrial bg-orange-50/30 border-orange-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" /> Hallazgos Críticos
              </h2>
              <p className="text-xs text-orange-700 mb-6">
                Si detectas una condición de riesgo alto, regístrala aquí para seguimiento inmediato.
              </p>
              
              <button 
                onClick={() => router.push('/findings')}
                className="w-full py-2 bg-white border border-orange-300 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nuevo Hallazgo
              </button>
            </div>

            <div className="card-industrial">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#1E93AB]" /> Fotos de Inspección
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#1E93AB] hover:text-[#1E93AB] cursor-pointer transition-all">
                   <Plus className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IndustrialLayout>
  );
}
