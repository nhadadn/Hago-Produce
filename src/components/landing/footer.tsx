import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-hago-primary-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Hago Produce</h3>
            <p className="text-sm text-hago-primary-200 leading-relaxed">
              Plataforma B2B para la gestión integral de facturación, órdenes de compra
              y análisis de negocio para la industria de productos frescos en Canadá.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-sm font-semibold text-hago-primary-100 uppercase tracking-wider mb-4">
              Plataforma
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  Características
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  Portal Administrativo
                </Link>
              </li>
              <li>
                <Link href="/portal/login" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  Portal de Clientes
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-hago-primary-100 uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-hago-primary-800 pt-8">
          <p className="text-center text-xs text-hago-primary-300">
            &copy; {currentYear} Hago Produce. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
