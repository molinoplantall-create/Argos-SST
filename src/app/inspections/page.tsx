'use client';

import React, { useEffect, useState } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { SupabaseInspectionRepository } from '@/infrastructure/repositories/SupabaseInspectionRepository';
import { Inspection } from '@/domain/entities/Inspection';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Filter, AlertCircle, FileText } from 'lucide-react';
import { DownloadInspectionPdfButton } from '@/components/reports/DownloadInspectionPdfButton';
import { NewInspectionModal } from '@/components/inspections/NewInspectionModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const repo = new SupabaseInspectionRepository();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await repo.getAll();
        setInspections(data);
      } catch (err: any) {
        console.error('Error 400 - Consulta de Inspecciones:', err);
        setError('Error al cargar las inspecciones. Verifique la conexión con la base de datos.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  if (error) {
    return (
      <IndustrialLayout>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
          <AlertCircle className="text-red-500 mr-3" />
          <p className="text-red-700">{error}</p>
        </div>
      </IndustrialLayout>
    );
  }

  return (
    <IndustrialLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Inspecciones Mensuales</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#FF7F11] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-[#e66f00] transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva Inspección
          </button>
        </div>

        <div className="card-industrial">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por inspector o área..." 
                className="w-full pl-10 pr-4 py-2 border border-[#DCDCDC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7F11]"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-[#DCDCDC] rounded-md hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" /> Filtros
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#DCDCDC] text-sm text-gray-500">
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Área</th>
                  <th className="pb-3 font-medium">Inspector</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCDCDC]">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="py-4 bg-gray-50 rounded-md mb-2 h-12"></td>
                    </tr>
                  ))
                ) : inspections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      No se encontraron inspecciones registradas.
                    </td>
                  </tr>
                ) : (
                  inspections.map((ins) => (
                    <tr key={ins.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-4 text-sm">{formatDate(ins.date)}</td>
                      <td className="py-4 text-sm font-medium">{ins.areaId}</td>
                      <td className="py-4 text-sm text-gray-600">{ins.inspectorId}</td>
                      <td className="py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                          ins.status === 'COMPLETADA' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                        )}>
                          {ins.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="text-[#1E93AB] hover:underline text-sm font-medium">Ver Detalles</button>
                          <DownloadInspectionPdfButton 
                            inspectionId={ins.id} 
                            label="PDF"
                            className="px-2 py-1 text-[10px]" 
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NewInspectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </IndustrialLayout>
  );
}
