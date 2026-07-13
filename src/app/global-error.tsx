'use client';
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F3F2EC] p-6 text-center">
        <h2 className="text-lg font-bold text-[#134686]">Ocurrió un error inesperado</h2>
        <p className="max-w-md text-sm text-gray-500">{error.message || 'Algo falló en la aplicación.'}</p>
        <button onClick={reset} className="rounded-lg bg-[#1E93AB] px-4 py-2 text-sm font-bold text-white hover:bg-[#167082]">
          Reintentar
        </button>
      </body>
    </html>
  );
}
