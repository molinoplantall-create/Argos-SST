'use client';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-bold text-[#134686]">Ocurrió un error inesperado</h2>
      <p className="max-w-md text-sm text-gray-500">
        {error.message || 'Algo falló al cargar esta sección. Puedes intentar de nuevo o volver al inicio.'}
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-lg bg-[#1E93AB] px-4 py-2 text-sm font-bold text-white hover:bg-[#167082]">
          Reintentar
        </button>
        <a href="/" className="rounded-lg border border-[#DCDCDC] px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
