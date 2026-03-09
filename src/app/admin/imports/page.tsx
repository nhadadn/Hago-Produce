
import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import PdfImportDashboard from '@/components/imports/PdfImportDashboard'

export const metadata: Metadata = {
  title: 'Importación de Precios | Hago Produce',
  description: 'Carga PDFs de proveedores para actualizar precios automáticamente',
}

export default function ImportsPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link 
          href="/product-prices" 
          className={buttonVariants({ variant: "outline" })}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a Precios
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[600px]">
        <PdfImportDashboard />
      </div>
    </div>
  )
}
