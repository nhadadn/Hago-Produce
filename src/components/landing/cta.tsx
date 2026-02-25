import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <div id="contact" className="bg-hago-primary-700">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            ¿Listo para optimizar tu operación?
            <br />
            Empieza a usar Hago Produce hoy.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-hago-primary-100">
            Únete a las empresas agrícolas que ya están transformando su gestión con nuestra plataforma integral.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/login">
              <Button size="lg" className="bg-white text-hago-primary-600 hover:bg-hago-primary-50 font-semibold h-12 px-8">
                Comenzar Ahora
              </Button>
            </Link>
            <Link href="#features" className="text-sm font-semibold leading-6 text-white group flex items-center">
              Más información <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
