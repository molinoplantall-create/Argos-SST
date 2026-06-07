'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SignatureDialog({
  title,
  open,
  onClose,
  onSave,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  onSave: (signatureUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(ratio, ratio);
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = '#134686';
    context.lineWidth = 2.2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    setHasSignature(false);
    lastPointRef.current = null;
  }, [open]);

  if (!open) return null;

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = getPoint(event);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const lastPoint = lastPointRef.current;
    const currentPoint = getPoint(event);

    if (!context || !lastPoint) return;

    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(currentPoint.x, currentPoint.y);
    context.stroke();
    lastPointRef.current = currentPoint;
    setHasSignature(true);
  }

  function stopDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
  }

  function saveSignature() {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    onSave(canvas.toDataURL('image/png'));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-[#DCDCDC] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#DCDCDC] p-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#1E93AB]">Firma digital</p>
            <h2 className="mt-1 text-lg font-bold text-[#134686]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition hover:bg-[#F3F2EC] hover:text-[#E62727]"
            aria-label="Cerrar firma"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-md border border-[#DCDCDC] bg-[#F3F2EC] p-3">
            <canvas
              ref={canvasRef}
              className="h-56 w-full touch-none rounded border border-[#DCDCDC] bg-white"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={(event) => {
                if (isDrawingRef.current) stopDrawing(event);
              }}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={clearSignature}
              className="rounded-md border border-[#DCDCDC] px-4 py-2 text-sm font-bold text-[#134686] transition hover:border-[#E62727] hover:text-[#E62727]"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={saveSignature}
              disabled={!hasSignature}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-black text-white transition',
                hasSignature ? 'bg-[#FF7F11] hover:bg-[#E62727]' : 'cursor-not-allowed bg-gray-300'
              )}
            >
              Guardar firma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
