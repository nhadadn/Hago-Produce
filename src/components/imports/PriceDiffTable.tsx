
'use client'

import React, { useState } from 'react'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { PriceDiff } from '@/types/imports'

interface PriceDiffTableProps {
  diffs: PriceDiff[]
  currency: string
}

type FilterType = 'all' | 'changed' | 'new'

export default function PriceDiffTable({ diffs, currency }: PriceDiffTableProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredDiffs = diffs.filter(diff => {
    if (filter === 'all') return true
    if (filter === 'changed') return diff.changeType === 'increased' || diff.changeType === 'decreased'
    if (filter === 'new') return diff.changeType === 'new'
    return true
  })

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)} ${currency}`
  }

  const renderChangeColumn = (diff: PriceDiff) => {
    switch (diff.changeType) {
      case 'increased':
        return (
          <div className="flex items-center text-red-600 font-medium">
            <ArrowUp className="w-4 h-4 mr-1" />
            +{diff.changePercent}%
          </div>
        )
      case 'decreased':
        return (
          <div className="flex items-center text-green-600 font-medium">
            <ArrowDown className="w-4 h-4 mr-1" />
            {diff.changePercent}%
          </div>
        )
      case 'new':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Nuevo
          </span>
        )
      case 'unchanged':
        return (
          <div className="flex items-center text-gray-400">
            <Minus className="w-4 h-4 mr-1" />
            Sin cambio
          </div>
        )
      default:
        return null
    }
  }

  const getPreviousPriceDisplay = (diff: PriceDiff) => {
    if (diff.changeType === 'new' || diff.previousPrice === null) {
      return <span className="text-gray-400">—</span>
    }
    return formatPrice(diff.previousPrice)
  }

  return (
    <div className="w-full space-y-4">
      {/* Filtros */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setFilter('changed')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filter === 'changed'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Con cambio
        </button>
        <button
          type="button"
          onClick={() => setFilter('new')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filter === 'new'
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Nuevos
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Anterior
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Nuevo
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Cambio
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDiffs.length > 0 ? (
              filteredDiffs.map((diff, idx) => (
                <tr key={`${diff.productName}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium truncate max-w-[200px]" title={diff.productName}>
                    {diff.productName}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500 whitespace-nowrap">
                    {getPreviousPriceDisplay(diff)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 whitespace-nowrap">
                    {formatPrice(diff.newPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                    <div className="flex justify-end">
                      {renderChangeColumn(diff)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No hay resultados para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
