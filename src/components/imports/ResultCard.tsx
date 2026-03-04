
'use client'

import React, { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, AlertCircle, RotateCcw } from 'lucide-react'
import { FileItem } from '@/types/imports'
import PriceDiffTable from './PriceDiffTable'

interface ResultCardProps {
  item: FileItem
  onRetry: (fileId: string) => void
}

export default function ResultCard({ item, onRetry }: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // ESTADO PROCESSING
  if (item.status === 'UPLOADING') {
    return (
      <div className="flex items-center p-4 bg-white border border-blue-200 rounded-lg shadow-sm">
        <Loader2 className="w-6 h-6 mr-3 text-blue-500 animate-spin" />
        <div>
          <h3 className="text-sm font-medium text-gray-900">Procesando PDF...</h3>
          <p className="text-xs text-gray-500">{item.file.name}</p>
        </div>
      </div>
    )
  }

  // ESTADO ERROR
  if (item.status === 'ERROR' || item.error) {
    return (
      <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-lg shadow-sm">
        <div className="flex items-start">
          <XCircle className="w-6 h-6 mr-3 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">{item.file.name}</h3>
            <p className="text-sm text-red-600 mt-1">{item.error || 'Error desconocido al procesar el archivo.'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRetry(item.id)}
          className="flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reintentar
        </button>
      </div>
    )
  }

  // ESTADO COMPLETED (Solo renderizar si hay resultado)
  if (item.status === 'COMPLETED' && item.result) {
    const { result, diffs } = item
    const stats = result.matchingStats

    return (
      <div className="bg-white border border-green-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200">
        {/* Header Resumen */}
        <div 
          className="p-4 flex items-start justify-between cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start">
            <CheckCircle2 className="w-6 h-6 mr-3 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {result.supplierName}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  {result.templateUsed}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{item.file.name}</p>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                <span>
                  <strong>{result.itemsProcessed}</strong> precios actualizados
                </span>
                {result.itemsSkipped > 0 && (
                  <span className="text-amber-600 flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    {result.itemsSkipped} omitidos
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-400 mt-2 font-mono">
                L1: {stats.level1Matches} | L2: {stats.level2Matches} | L3: {stats.level3Matches} | Sin match: {stats.noMatches}
              </div>
            </div>
          </div>

          <div className="ml-4 flex-shrink-0 flex items-center">
            <button
              type="button"
              className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Detalle Expandible */}
        {isExpanded && diffs && (
          <div className="border-t border-gray-100 p-4 bg-gray-50 animate-in slide-in-from-top-2 duration-200">
            <PriceDiffTable diffs={diffs} currency={result.currency} />
          </div>
        )}
      </div>
    )
  }

  // Fallback por si acaso (no debería ocurrir con los tipos correctos)
  return null
}
