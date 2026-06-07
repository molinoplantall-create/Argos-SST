'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, ImageIcon, Loader2, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadInspectionPhoto, deletePhoto } from '@/services/storageService';

export interface UploadedPhoto {
  url: string;
  path: string;
  preview: string; // URL temporal local (blob)
}

interface PhotoUploaderProps {
  inspectionId: string;
  /** Fotos ya guardadas (cargadas de la base de datos) */
  existingPhotos?: UploadedPhoto[];
  /** Llamado cuando se añade o elimina una foto */
  onChange?: (photos: UploadedPhoto[]) => void;
  /** Número máximo de fotos */
  maxPhotos?: number;
  disabled?: boolean;
  className?: string;
}

export default function PhotoUploader({
  inspectionId,
  existingPhotos = [],
  onChange,
  maxPhotos = 10,
  disabled = false,
  className,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);

      const remaining = maxPhotos - photos.length;
      const filesToProcess = Array.from(files).slice(0, remaining);

      if (filesToProcess.length === 0) {
        setError(`Máximo ${maxPhotos} fotos permitidas.`);
        return;
      }

      // Validar tipo y tamaño
      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) {
          setError('Solo se permiten imágenes (JPG, PNG, WEBP).');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Cada foto no puede superar los 10 MB.');
          return;
        }
      }

      setUploading(true);
      const newPhotos: UploadedPhoto[] = [];

      for (const file of filesToProcess) {
        const preview = URL.createObjectURL(file);
        setUploadStatus(`Comprimiendo ${file.name}...`);
        const { url, path, error: uploadError } = await uploadInspectionPhoto(file, inspectionId);
        setUploadStatus(`Subiendo al servidor...`);

        if (uploadError || !url || !path) {
          setError(`Error al subir "${file.name}": ${uploadError}`);
          URL.revokeObjectURL(preview);
          continue;
        }

        newPhotos.push({ url, path, preview });
      }

      setUploading(false);
      setUploadStatus('');

      if (newPhotos.length > 0) {
        const updated = [...photos, ...newPhotos];
        setPhotos(updated);
        onChange?.(updated);
      }
    },
    [inspectionId, maxPhotos, photos, onChange]
  );

  const handleRemove = async (index: number) => {
    const photo = photos[index];
    // Eliminar del storage
    await deletePhoto(photo.path);
    // Liberar memoria del preview
    URL.revokeObjectURL(photo.preview);

    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    onChange?.(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const canAddMore = photos.length < maxPhotos && !disabled;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-gray-500">
          Fotografías ({photos.length}/{maxPhotos})
        </span>
        {photos.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {photos.length} foto{photos.length > 1 ? 's' : ''} adjunta{photos.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grid de fotos existentes */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <div
              key={photo.path}
              className="relative aspect-square rounded-xl overflow-hidden group bg-gray-100 border border-[#DCDCDC]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.preview || photo.url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay con botón de eliminar */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600"
                  aria-label="Eliminar foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zona de carga */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            'rounded-xl border-2 border-dashed transition-all',
            dragOver ? 'border-[#1E93AB] bg-[#1E93AB]/5' : 'border-[#DCDCDC] bg-white hover:border-[#1E93AB]/50'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-[#1E93AB] animate-spin" />
                <Zap className="w-3.5 h-3.5 text-[#FF7F11] absolute -top-0.5 -right-0.5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-600">{uploadStatus || 'Procesando...'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Comprimiendo para ahorrar espacio</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 text-center px-4">
                Arrastra fotos aquí o usa los botones
              </p>

              {/* Botones de acción — en móvil el de cámara es el principal */}
              <div className="flex gap-2 flex-wrap justify-center">
                {/* Botón Cámara — solo visible en móvil/tablet con cámara */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#FF7F11] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#e66f00] transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span className="sm:inline">Tomar foto</span>
                </button>

                {/* Botón Galería/Explorador */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#DCDCDC] text-gray-600 rounded-xl text-sm font-bold hover:border-[#1E93AB] hover:text-[#1E93AB] transition-all active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Galería</span>
                </button>
              </div>

              <p className="text-xs text-gray-400">
                JPG, PNG o WEBP · Máx. 10 MB por foto
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando alcanzó el límite */}
      {!canAddMore && !uploading && (
        <div className="rounded-xl bg-[#F3F2EC] border border-[#DCDCDC] px-4 py-3 text-sm text-gray-500 text-center font-medium">
          Límite de {maxPhotos} fotos alcanzado
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button type="button" onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Input de galería (múltiple) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Input de cámara (capture=environment abre cámara trasera en móvil) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
