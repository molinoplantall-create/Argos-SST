'use client';

import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useFeedback } from '@/components/common/FeedbackUI';

// Helper to merge tailwind classes
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface DownloadInspectionPdfButtonProps {
  inspectionId: string;
  className?: string;
  label?: string;
}

export const DownloadInspectionPdfButton: React.FC<DownloadInspectionPdfButtonProps> = ({
  inspectionId,
  className,
  label = 'Exportar PDF'
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { showToast } = useFeedback();

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/reports/inspection/${inspectionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el PDF');
      }

      // Create a blob from the PDF stream
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and click it to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inspeccion-${inspectionId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      showToast(`No se pudo generar el PDF: ${error.message}`, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
        "bg-[#1E93AB] text-white hover:bg-[#167082] active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        "shadow-sm hover:shadow-md",
        className
      )}
    >
      {isDownloading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      <span>{isDownloading ? 'Generando...' : label}</span>
    </button>
  );
};
