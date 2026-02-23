import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, Users } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-50">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center gap-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">Hago Produce</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Sistema de gestión integral para la comercialización de productos agrícolas.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium border border-green-200">
              Sistema Operativo
            </span>
            <span className="text-slate-400 text-sm">v1.0.0 (Phase 1C)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Admin Portal Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Portal Administrativo</CardTitle>
              <CardDescription className="text-base mt-2">
                Acceso para personal interno, contabilidad y gerencia. Gestión completa del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login" passHref>
                <Button className="w-full h-12 text-base group bg-slate-900 hover:bg-slate-800">
                  Iniciar Sesión
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Customer Portal Card */}
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Portal de Clientes</CardTitle>
              <CardDescription className="text-base mt-2">
                Acceso para clientes externos. Consulta de facturas, estados de cuenta y descargas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/portal/login" passHref>
                <Button variant="outline" className="w-full h-12 text-base group border-slate-300 hover:bg-slate-50">
                  Acceso Clientes
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-slate-400 mt-8">
          &copy; {new Date().getFullYear()} Hago Produce S.A. de C.V. &bull; Todos los derechos reservados.
        </div>
      </div>
    </main>
  );
}
