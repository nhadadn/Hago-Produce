'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Hero() {
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [customerLoggedIn, setCustomerLoggedIn] = useState(false);

  useEffect(() => {
    setAdminLoggedIn(!!localStorage.getItem('accessToken'));
    setCustomerLoggedIn(!!localStorage.getItem('customerAccessToken'));
  }, []);

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-hago-primary-100/50 via-white to-white"></div>

      <div className="container px-4 md:px-6 mx-auto text-center">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-hago-primary-100 text-hago-primary-800 hover:bg-hago-primary-200/80 mb-8">
          Hago Produce v1.0 &mdash; Sistema de Gestión Integral
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
          Simplifica la Gestión de tu <span className="text-hago-primary-600">Negocio Agrícola</span>
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Plataforma todo-en-uno para facturación, control de inventarios y reportes en tiempo real.
          Diseñada específicamente para exportadores y productores.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
          {/* Admin Portal Card */}
          <Card className="border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-hago-primary-100 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-hago-primary-700" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Portal Administrativo</CardTitle>
              <CardDescription className="text-base mt-2 text-gray-600">
                Acceso para personal interno. Gestión completa de operaciones, facturación y contabilidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={adminLoggedIn ? '/dashboard' : '/login'} passHref>
                <Button className="w-full h-12 text-base font-semibold bg-hago-primary-600 hover:bg-hago-primary-700 text-white shadow-md group">
                  {adminLoggedIn ? 'Ir al Dashboard' : 'Iniciar Sesión'}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Customer Portal Card */}
          <Card className="border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-hago-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-hago-secondary-700" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Portal de Clientes</CardTitle>
              <CardDescription className="text-base mt-2 text-gray-600">
                Acceso para clientes externos. Descarga de facturas, estados de cuenta y reportes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={customerLoggedIn ? '/portal/dashboard' : '/portal/login'} passHref>
                <Button variant="outline" className="w-full h-12 text-base font-semibold border-gray-300 hover:bg-gray-50 text-gray-700 group">
                  {customerLoggedIn ? 'Ir al Portal' : 'Acceso Clientes'}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
