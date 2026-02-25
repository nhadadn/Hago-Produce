import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-4xl font-bold text-hago-primary-900">Hago Produce</h1>
        <p className="text-gray-600">Sprint 4: Validation & Checkpoints</p>
      </div>
      
      <div className="grid gap-4 text-center">
        <h2 className="text-2xl font-semibold mb-4">Bienvenido al Portal</h2>
        <p className="mb-8 max-w-md mx-auto text-gray-600">
          Plataforma de gestión para IMMEX. Control de inventarios, pedimentos y cumplimiento normativo.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">Iniciar Sesión</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">Registrarse</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
