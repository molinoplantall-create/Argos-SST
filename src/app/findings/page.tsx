'use client';

import React, { useEffect, useState } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { SupabaseInspectionRepository } from '@/infrastructure/repositories/SupabaseInspectionRepository';
import { Finding } from '@/domain/entities/Finding';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, CheckCircle2, Filter, Search } from 'lucide-react';

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repo = new SupabaseInspectionRepository();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // En una implementación real, esto traería todos los hallazgos de todas las inspecciones
        const data = await repo.getFindingsByInspectionId(''); // Placeholder para "todos"
        setFindings(data);
      } catch (err: any) {
        console.error('Error 400 - Consulta de Hallazgos:', err);
        setError('Error al conectar con el módulo de hallazgos. Verifique RLS o esquema.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <IndustrialLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Gestión de Hallazgos</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 border border-[#DCDCDC] rounded-lg flex items-center gap-4">
            <div className="bg-[#E62727] p-2 rounded-md">
              <AlertTriangle className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Críticos</p>
              <p className="text-xl font-bold">03</p>
            </div>
          </div>
          <div className="bg-white p-4 border border-[#DCDCDC] rounded-lg flex items-center gap-4">
            <div className="bg-[#FF7F11] p-2 rounded-md">
              <Clock className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Pendientes</p>
              <p className="text-xl font-bold">12</p>
            </div>
          </div>
          <div className="bg-white p-4 border border-[#DCDCDC] rounded-lg flex items-center gap-4">
            <div className="bg-green-600 p-2 rounded-md">
              <CheckCircle2 className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Cerrados</p>
              <p className="text-xl font-bold">45</p>
            </div>
          </div>
        </div>

        <div className="card-industrial">
           {/* Contenido de tabla similar a Inspecciones pero orientado a hallazgos */}
           {loading ? (
             <div className="text-center py-10 text-gray-400">Cargando hallazgos...</div>
           ) : error ? (
             <div className="text-center py-10 text-red-500">{error}</div>
           ) : (
             <div className="text-center py-10 text-gray-400">Seleccione una inspección para ver sus hallazgos o use los filtros.</div>
           )}
        </div>
      </div>
    </IndustrialLayout>
  );
}
