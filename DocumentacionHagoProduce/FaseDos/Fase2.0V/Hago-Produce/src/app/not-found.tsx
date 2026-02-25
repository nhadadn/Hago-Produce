import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-6xl font-bold text-hago-primary-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Página no encontrada</h2>
      <p className="text-gray-600 mb-8 max-w-md text-center">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Link href="/">
        <Button size="lg">Volver al Inicio</Button>
      </Link>
    </div>
  );
}
