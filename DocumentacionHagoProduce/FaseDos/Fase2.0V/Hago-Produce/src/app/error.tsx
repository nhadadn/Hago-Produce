'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Algo salió mal</h2>
      <p className="text-gray-600 mb-8 max-w-md text-center">
        Ha ocurrido un error inesperado en nuestros servidores.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Intentar de nuevo
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          Ir al Inicio
        </Button>
      </div>
    </div>
  );
}
