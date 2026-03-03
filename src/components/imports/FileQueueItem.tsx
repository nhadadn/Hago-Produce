
'use client'

import React from 'react'
import { FileText, Loader2, X } from 'lucide-react'
import { FileItem, SupplierSummary } from '@/types/imports'

interface FileQueueItemProps {
  item: FileItem
  suppliers: SupplierSummary[]
  onSupplierSelect: (
    fileId: string,
    supplierId: string,
    supplierName: string
  ) => void
  onRemove: (fileId: string) => void
}

export default function FileQueueItem({
  item,
  suppliers,
  onSupplierSelect,
  onRemove
}: FileQueueItemProps) {
  
  // Calcular tamaño en MB
  const fileSizeMB = (item.file.size / (1024 * 1024)).toFixed(1)

  // Determinar clases de borde según status
  const getBorderColor = () => {
    switch (item.status) {
      case 'PENDING':
        // Si ya tiene supplier seleccionado, mostramos "ready" (verde claro)
        // aunque técnicamente el status siga siendo PENDING hasta que se inicie la subida.
        // Pero visualmente queremos feedback de "listo".
        return item.supplierId ? 'border-green-400' : 'border-gray-300'
      case 'UPLOADING':
        return 'border-blue-400'
      case 'COMPLETED':
        return 'border-green-600'
      case 'ERROR':
        return 'border-red-400'
      default:
        return 'border-gray-300'
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    if (!selectedId) return

    const selectedSupplier = suppliers.find(s => s.id === selectedId)
    if (selectedSupplier) {
      onSupplierSelect(item.id, selectedId, selectedSupplier.name)
    }
  }

  const isProcessing = item.status === 'UPLOADING'
  const isCompleted = item.status === 'COMPLETED'
  // Permitir eliminar en PENDING (con o sin supplier) y ERROR
  const canRemove = item.status === 'PENDING' || item.status === 'ERROR'

  // Si está completado, este componente podría no renderizarse si se usa ResultCard,
  // pero seguimos la especificación visual por si se mantiene en lista.
  
  return (
    <div 
      className={`
        relative flex items-center justify-between p-4 mb-3 bg-white 
        border-l-4 rounded shadow-sm transition-colors
        ${getBorderColor()}
      `}
    >
      {/* Icono y Detalles del Archivo */}
      <div className="flex items-center space-x-4 overflow-hidden">
        <div className="flex-shrink-0">
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          ) : (
            <FileText className={`w-8 h-8 ${item.error ? 'text-red-500' : 'text-gray-400'}`} />
          )}
        </div>
        
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">
            {item.file.name}
          </p>
          <p className="text-xs text-gray-500">
            {fileSizeMB} MB
          </p>
          {item.error && (
            <p className="text-xs text-red-600 mt-1 truncate max-w-xs">
              {item.error}
            </p>
          )}
        </div>
      </div>

      {/* Selector de Proveedor y Acciones */}
      <div className="flex items-center space-x-4">
        <div className="w-48">
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            value={item.supplierId || ''}
            onChange={handleSelectChange}
            disabled={isProcessing || isCompleted}
          >
            <option value="" disabled>
              Seleccionar Proveedor
            </option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
            title="Eliminar archivo"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
