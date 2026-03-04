
import { Metadata } from 'next'
import PdfImportDashboard from '@/components/imports/PdfImportDashboard'

export const metadata: Metadata = {
  title: 'Importación de Precios | Hago Produce',
  description: 'Carga PDFs de proveedores para actualizar precios automáticamente',
}

export default function ImportsPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[600px]">
        <PdfImportDashboard />
      </div>
    </div>
  )
}
