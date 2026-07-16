'use client';

import React, { useEffect, useState } from 'react';
import IndustrialLayout from '@/components/layout/IndustrialLayout';
import { supabase } from '@/lib/supabase';
import { FileText, Plus, Search, Filter, AlertCircle } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('documents')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (err: any) {
        console.error('Error 400 - Consulta de Documentos:', err);
        setError('Error al cargar documentos SST. Verifique RLS en la tabla "documents".');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <IndustrialLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Documentación SST</h1>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo Documento
          </button>
        </div>

        <div className="card-industrial">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por tipo o creador..." 
                className="w-full pl-10 pr-4 py-2 border border-[#DCDCDC] rounded-md"
              />
            </div>
          </div>

          {error ? (
            <div className="bg-red-50 p-4 rounded-md flex items-center text-red-700">
              <AlertCircle className="mr-2" /> {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#DCDCDC] text-sm text-gray-500">
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Creador</th>
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCDCDC]">
                  {loading ? (
                    <tr><td colSpan={5} className="py-10 text-center">Cargando...</td></tr>
                  ) : documents.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-gray-400">No hay documentos registrados.</td></tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="py-4 font-medium">{doc.type}</td>
                        <td className="py-4">{doc.profiles?.full_name}</td>
                        <td className="py-4">{formatDate(doc.created_at)}</td>
                        <td className="py-4">
                          <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded-full font-bold">
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button className="text-[#1E93AB] hover:underline">Abrir</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </IndustrialLayout>
  );
}
