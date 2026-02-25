import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-hago-gray-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <div className="text-8xl font-bold text-hago-primary-800 mb-4">404</div>
        <h1 className="text-2xl font-bold text-hago-gray-900 mb-2">
          Página no encontrada
        </h1>
        <p className="text-hago-gray-600 mb-6">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-hago-primary-800 px-8 text-sm font-medium text-white transition-colors hover:bg-hago-primary-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hago-primary-900 disabled:pointer-events-none disabled:opacity-50"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
