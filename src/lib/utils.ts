/*
  CONVENCIÓN DE Z-INDEX DEL PROYECTO:
  z-40      -> headers/nav sticky de IndustrialLayout
  z-50      -> overlays/drawers de navegación de IndustrialLayout
  z-[60]    -> modales de contenido normales de cada página (agregar/editar/catálogo)
  z-[70]    -> SignatureDialog y modales que se abren encima de otro modal
  z-[10000] -> Toast y ConfirmDialog globales
*/

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}
