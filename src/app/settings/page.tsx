'use client';

import React, { useEffect, useState } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { supabase } from '@/lib/supabase';
import { seedInitialData } from '@/lib/seedData';
import { Settings as SettingsIcon, Map, Users, Database, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useFeedback } from '@/components/common/FeedbackUI';

export default function SettingsPage() {
  const { showToast, showConfirm } = useFeedback();
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('areas')
        .select('*, subareas(count)');

      if (error) throw error;
      setAreas(data || []);
    } catch (err: any) {
      console.error('Error 400 - Consulta de Configuración:', err);
      setError('Error al cargar la configuración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = () => {
    showConfirm({
      title: 'Inicializar Datos Maestros',
      message: 'Esto cargará datos maestros iniciales (Áreas, Subáreas, Tipos). ¿Estás seguro de que deseas continuar?',
      onConfirm: async () => {
        setSeeding(true);
        const result = await seedInitialData();
        setSeeding(false);

        if (result.success) {
          showToast('¡Sistema inicializado con éxito!', 'success');
          loadData();
        } else {
          showToast(`Error al inicializar: ${result.error}`, 'error');
        }
      }
    });
  };

  return (
    <IndustrialLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" /> Configuración del Sistema
          </h1>
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E93AB] text-white rounded-lg font-bold hover:bg-[#167082] transition-all disabled:opacity-50"
          >
            {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {seeding ? 'Inicializando...' : 'Inicializar Datos Maestros'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card de Áreas */}
          <div className="card-industrial lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Map className="w-5 h-5 text-[#FF7F11]" /> Gestión de Áreas
              </h2>
              <button className="text-sm text-[#1E93AB] font-bold">+ Agregar Área</button>
            </div>

            {error ? (
              <div className="bg-red-50 p-4 rounded-md flex items-center text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" /> {error}
              </div>
            ) : (
              <div className="space-y-4">
                {areas.map(area => (
                  <div key={area.id} className="flex justify-between items-center p-3 border border-[#DCDCDC] rounded-md hover:border-[#FF7F11] transition-colors">
                    <div>
                      <p className="font-bold">{area.name}</p>
                      <p className="text-xs text-gray-500">{area.description || 'Sin descripción'}</p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-md">
                      {area.subareas?.[0]?.count || 0} Subáreas
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card de Roles/Usuarios */}
          <div className="card-industrial">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1E93AB]" /> Roles y Permisos
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-md border border-[#DCDCDC]">
                <p className="font-bold text-sm">Superadmin</p>
                <p className="text-xs text-gray-500">Acceso total al sistema</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-md border border-[#DCDCDC]">
                <p className="font-bold text-sm">Inspector</p>
                <p className="text-xs text-gray-500">Registro de inspecciones y fotos</p>
              </div>
            </div>
            <button className="mt-6 w-full py-2 border border-[#DCDCDC] rounded-md text-sm hover:bg-gray-50">
              Gestionar Usuarios
            </button>
          </div>
        </div>
      </div>
    </IndustrialLayout>
  );
}
