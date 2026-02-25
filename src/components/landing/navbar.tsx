import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-hago-primary-900 tracking-tight">
            Hago Produce
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-hago-primary-600 transition-colors">
            Características
          </Link>
          <Link href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-hago-primary-600 transition-colors">
            Testimonios
          </Link>
          <Link href="#contact" className="text-sm font-medium text-gray-600 hover:text-hago-primary-600 transition-colors">
            Contacto
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-medium hidden md:inline-flex">
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/portal/login">
            <Button className="text-sm font-medium bg-hago-primary-600 hover:bg-hago-primary-700 text-white">
              Portal Clientes
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
