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

export function formatDate(value?: string | null | Date): string {
  if (!value) return '—';
  const strValue = value instanceof Date ? value.toISOString() : value;
  // Si viene como 'YYYY-MM-DD' puro (inputs date, columnas date de Postgres),
  // parsear los componentes directamente para evitar corrimientos de zona horaria.
  const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(strValue.split('T')[0]);
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    return `${day}/${month}/${year}`;
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
