import { BarChart3, Globe2, FileCheck, Truck, ShieldCheck, Zap } from 'lucide-react';

const features = [
  {
    name: 'Control de Inventarios',
    description: 'Gestión de lotes, empaque y producto terminado. Control de mermas y existencias en tiempo real.',
    icon: FileCheck,
  },
  {
    name: 'Facturación Electrónica',
    description: 'Facturación integrada con complementos de comercio exterior. Agiliza tus cobros y cumple con el SAT.',
    icon: Zap,
  },
  {
    name: 'Logística y Embarques',
    description: 'Planificación de cargas y seguimiento de pedidos. Documentación de exportación simplificada.',
    icon: Truck,
  },
  {
    name: 'Reportes Inteligentes',
    description: 'Análisis de ventas, costos y márgenes por producto. Información clave para hacer crecer tu negocio.',
    icon: BarChart3,
  },
  {
    name: 'Multi-idioma y Divisas',
    description: 'Soporte para múltiples monedas y tipos de cambio. Documentos en inglés y español para tus clientes.',
    icon: Globe2,
  },
  {
    name: 'Seguridad y Cumplimiento',
    description: 'Control de acceso seguro y respaldo de información. Tu operación siempre disponible y protegida.',
    icon: ShieldCheck,
  },
];

export function Features() {
  return (
    <div id="features" className="py-24 bg-white sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-hago-primary-600">Todo lo que necesitas</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Potencia tu operación agrícola
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Hago Produce integra todas las herramientas necesarias para gestionar tu negocio de exportación de manera eficiente y segura.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16 group">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-hago-primary-600 group-hover:bg-hago-primary-700 transition-colors">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
