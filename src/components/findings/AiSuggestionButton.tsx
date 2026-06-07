'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useFeedback } from '@/components/common/FeedbackUI';

/**
 * Interfaz para la respuesta estructurada de la IA
 */
export interface AiSuggestion {
  suggestedObservation: string;
  suggestedCause: string;
  suggestedRecommendation: string;
  suggestedFindingType: 'ACTO_INSEGURO' | 'CONDICION_INSEGURA' | 'OBSERVACION_POSITIVA';
  suggestedSeverity: 'A' | 'B' | 'C';
}

interface AiSuggestionButtonProps {
  /** URL de la imagen ya subida a Supabase Storage */
  photoUrl?: string;
  /** Contexto adicional para mejorar la precisión de la IA */
  context: {
    areaName?: string;
    subareaName?: string;
    inspectionType?: string;
    existingObservation?: string;
  };
  /** Callback cuando la IA devuelve una sugerencia exitosa */
  onSuggestion: (suggestion: AiSuggestion) => void;
  /** Estado de deshabilitado externo */
  disabled?: boolean;
}

/**
 * Componente que integra la llamada al backend de IA
 * Diseñado para ser insertado cerca del campo de "Fotos" en el formulario de hallazgos.
 */
export const AiSuggestionButton: React.FC<AiSuggestionButtonProps> = ({
  photoUrl,
  context,
  onSuggestion,
  disabled
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useFeedback();

  const handleGetSuggestion = async () => {
    if (!photoUrl) {
      showToast('Por favor, sube una foto primero para que la IA pueda analizarla.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/suggest-finding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoUrl,
          ...context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al conectar con el servicio de IA');
      }

      const suggestion: AiSuggestion = await response.json();
      
      // Enviamos la sugerencia al formulario padre
      onSuggestion(suggestion);

    } catch (error: any) {
      console.error('Error obteniendo sugerencia de IA:', error);
      showToast(`No pudimos obtener la sugerencia: ${error.message}. Por favor, completa el campo manualmente.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGetSuggestion}
      disabled={isLoading || disabled || !photoUrl}
      className={`
        relative overflow-hidden group
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
        ${isLoading 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-[#1E93AB] text-white hover:bg-[#167082] shadow-sm hover:shadow-md active:scale-95'
        }
        disabled:opacity-50 disabled:grayscale
      `}
    >
      {/* Efecto de brillo sutil para resaltar que es IA */}
      {!isLoading && (
        <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-45 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
      )}

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      
      <span>
        {isLoading ? 'Analizando imagen...' : 'Sugerir Texto con IA'}
      </span>
    </button>
  );
};
