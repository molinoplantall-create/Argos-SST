import { supabase } from '@/lib/supabase';

const PHOTOS_BUCKET = 'inspection-photos';
const DOCS_BUCKET = 'inspection-documents';

// ─── Compresión de imagen ──────────────────────────────────────────────────

interface CompressOptions {
  /** Ancho máximo en px. Default: 1280 (suficiente para fotos de campo) */
  maxWidth?: number;
  /** Alto máximo en px. Default: 1280 */
  maxHeight?: number;
  /** Calidad JPEG/WEBP entre 0 y 1. Default: 0.75 */
  quality?: number;
  /** Formato de salida. Default: 'image/webp' (mejor compresión) */
  outputFormat?: 'image/webp' | 'image/jpeg';
}

/**
 * Comprime una imagen usando el Canvas API del navegador.
 * Reduce drásticamente el tamaño de archivo sin perder calidad visual notable.
 * Una foto de 5MB de cámara pasa a ~200–400KB.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75,
    outputFormat = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calcular dimensiones manteniendo la proporción
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto 2D del canvas'));
        return;
      }

      // Fondo blanco para imágenes con transparencia (PNG)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al convertir canvas a blob'));
            return;
          }
          // Mantener el nombre original, cambiar extensión según formato
          const ext = outputFormat === 'image/webp' ? 'webp' : 'jpg';
          const baseName = file.name.replace(/\.[^.]+$/, '');
          const compressed = new File([blob], `${baseName}.${ext}`, {
            type: outputFormat,
            lastModified: Date.now(),
          });

          console.log(
            `[compressImage] ${file.name}: ${(file.size / 1024).toFixed(0)} KB → ${(compressed.size / 1024).toFixed(0)} KB (${Math.round((1 - compressed.size / file.size) * 100)}% reducción)`
          );
          resolve(compressed);
        },
        outputFormat,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen para compresión'));
    };

    img.src = objectUrl;
  });
}

// ─── Upload de fotos ──────────────────────────────────────────────────────

/**
 * Comprime y sube una foto de inspección a Supabase Storage.
 * Ruta: {user_id}/{inspection_id}/{timestamp}.webp
 */
export async function uploadInspectionPhoto(
  file: File,
  inspectionId: string
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null, path: null, error: 'Usuario no autenticado' };

  // Comprimir antes de subir
  let fileToUpload: File;
  try {
    fileToUpload = await compressImage(file, {
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 0.75,
      outputFormat: 'image/webp',
    });
  } catch (err) {
    console.warn('[storageService] Compresión fallida, se usará el archivo original.', err);
    fileToUpload = file;
  }

  const timestamp = Date.now();
  const filePath = `${user.id}/${inspectionId}/${timestamp}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/webp',
    });

  if (uploadError) {
    console.error('Error subiendo foto:', uploadError);
    return { url: null, path: null, error: uploadError.message };
  }

  // URL firmada válida por 1 hora
  const { data: signedData, error: signedError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrl(filePath, 3600);

  if (signedError) {
    return { url: null, path: filePath, error: signedError.message };
  }

  return { url: signedData.signedUrl, path: filePath, error: null };
}

/**
 * Obtiene una URL firmada para acceder a una foto existente.
 */
export async function getPhotoUrl(
  filePath: string,
  expiresIn = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Error generando URL firmada:', error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Genera URLs firmadas para múltiples fotos de una vez (más eficiente).
 */
export async function getPhotoUrls(
  filePaths: string[],
  expiresIn = 3600
): Promise<Record<string, string>> {
  if (filePaths.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(filePaths, expiresIn);

  if (error || !data) {
    console.error('Error generando URLs firmadas:', error);
    return {};
  }

  return Object.fromEntries(
    data
      .filter((item) => item.signedUrl)
      .map((item) => [item.path, item.signedUrl!])
  );
}

/**
 * Elimina una foto de Supabase Storage.
 */
export async function deletePhoto(filePath: string): Promise<boolean> {
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove([filePath]);
  if (error) {
    console.error('Error eliminando foto:', error);
    return false;
  }
  return true;
}

// ─── Upload de documentos PDF ─────────────────────────────────────────────

/**
 * Sube un documento PDF a Supabase Storage.
 */
export async function uploadDocument(
  file: File | Blob,
  filename: string
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null, path: null, error: 'Usuario no autenticado' };

  const timestamp = Date.now();
  const filePath = `${user.id}/${timestamp}_${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/pdf',
    });

  if (uploadError) {
    return { url: null, path: null, error: uploadError.message };
  }

  const { data: signedData } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(filePath, 3600);

  return { url: signedData?.signedUrl ?? null, path: filePath, error: null };
}
