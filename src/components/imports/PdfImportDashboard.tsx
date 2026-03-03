
'use client'

import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { FileItem, SupplierSummary, calculateDiffs, UploadResponse, CurrentPricesResponse } from '@/types/imports'
import FileDropzone from './FileDropzone'
import FileQueueItem from './FileQueueItem'
import ResultCard from './ResultCard'

function postFormData(
  url: string,
  formData: FormData,
  token: string
): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.setRequestHeader(
      'Authorization',
      `Bearer ${token}`
    )
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return
      
      const contentType = xhr.getResponseHeader(
        'content-type'
      ) || ''
      
      if (contentType.includes('application/json')) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({ status: xhr.status, data })
        } catch {
          reject(new Error(
            `JSON parse error: ${xhr.responseText
              .substring(0, 200)}`
          ))
        }
      } else {
        // El servidor retornó HTML (página de error)
        // Extraer el mensaje de error si es posible
        const errorMatch = xhr.responseText
          .match(/<pre>(.*?)<\/pre>/s)
        const errorMsg = errorMatch
          ? errorMatch[1]
          : `Server returned HTML (status: ${xhr.status})`
        reject(new Error(errorMsg))
      }
    }
    xhr.onerror = () => reject(
      new Error('Network request failed')
    )
    xhr.send(formData)
  })
}

export default function PdfImportDashboard() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Cargar proveedores al montar
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const token = localStorage.getItem('accessToken')
        // Fix: Traer todos los proveedores activos (limit=100)
        const res = await fetch('/api/v1/suppliers?limit=100&isActive=true', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          console.log('Suppliers cargados:', data.data || [])
          setSuppliers(data.data || []) // Ajuste para extraer data.data si la respuesta viene envuelta
        }
      } catch (error) {
        // En producción se usaría un toast o sistema de notificaciones
        console.error('Error fetching suppliers:', error)
      }
    }
    fetchSuppliers()
  }, [])

  // Agregar archivos a la cola
  const handleFilesAdded = (newFiles: File[]) => {
    const newItems: FileItem[] = newFiles.map(file => ({
      id: uuidv4(),
      file,
      status: 'PENDING',
      supplierId: null,
      supplierName: null,
      previousPrices: null
    }))
    setFiles(prev => [...prev, ...newItems])
  }

  // Eliminar archivo
  const handleRemove = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Seleccionar proveedor y buscar precios anteriores
  const handleSupplierSelect = async (fileId: string, id: string, supplierName: string) => {
    // 1. Actualizar estado local con supplier seleccionado
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, supplierId: id, supplierName, previousPrices: null } // Reset previousPrices while loading
        : f
    ))

    // 2. Fetch precios actuales (contexto para diffs)
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/suppliers/${id}/current-prices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data: CurrentPricesResponse = await res.json()
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, previousPrices: data.prices }
            : f
        ))
      }
    } catch (error) {
      console.error('Error fetching current prices:', error)
    }
  }

  // Reintentar (resetea a PENDING)
  const handleRetry = (fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'PENDING', error: undefined, result: undefined, diffs: undefined }
        : f
    ))
  }

  // Procesar cola (secuencial)
  const processQueue = async () => {
    if (isProcessing) return

    const pendingFiles = files.filter(f => f.status === 'PENDING' && f.supplierId)
    if (pendingFiles.length === 0) return

    setIsProcessing(true)

    // Procesamos secuencialmente con for...of para control total
    for (const fileItem of pendingFiles) {
      if (!fileItem.supplierId) continue

      // 1. Marcar como PROCESSING
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'UPLOADING' } : f
      ))

      try {
        // 2. Preparar FormData
        const formData = new FormData()
        console.log('Enviando supplierId:', fileItem.supplierId)
        formData.append('file', fileItem.file)
        formData.append('supplierId', fileItem.supplierId)

        // 3. POST Upload con XMLHttpRequest para evitar RSC header
        const token = localStorage.getItem('accessToken')
        if (!token) {
          throw new Error('No hay sesión activa (Token no encontrado)')
        }
        
        const { status, data: result } = await postFormData(
          '/api/v1/imports/upload',
          formData,
          token
        )

        if (status < 200 || status >= 300) {
          throw new Error(`Error ${status}: ${result?.error?.message || 'Error desconocido'}`)
        }

        if (!result.success) {
          throw new Error(result.error?.message || 'El servidor reportó un error en la importación')
        }

        // 4. Calcular diferencias (in-memory, client-side)
        // Usamos el estado ACTUAL de files para obtener previousPrices actualizado
        // (Nota: en un loop async, el estado de React no se actualiza inmediatamente en 'files',
        // pero aquí fileItem.previousPrices ya tiene lo que tenía al inicio del loop)
        const diffs = calculateDiffs(result.processedProducts, fileItem.previousPrices)

        // 5. Marcar como COMPLETED con resultados
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'COMPLETED', result, diffs } 
            : f
        ))

      } catch (error: any) {
        // 6. Manejo de error
        console.error('[UPLOAD ERROR]', error.message)
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'ERROR', error: error.message || 'Error desconocido' } 
            : f
        ))
      }
    }

    setIsProcessing(false)
  }

  // Trigger automático o manual para procesar
  // Opción A: Botón "Procesar Todo"
  // Opción B: Auto-start (preferimos manual para control del usuario)

  const pendingCount = files.filter(f => f.status === 'PENDING' && f.supplierId).length
  const canProcess = pendingCount > 0 && !isProcessing

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Listas de Precios</h1>
        <p className="text-gray-500 mt-1">Sube archivos PDF de proveedores para actualizar precios.</p>
      </div>

      {/* Dropzone */}
      <FileDropzone 
        onFilesAdded={handleFilesAdded} 
        disabled={isProcessing} 
      />

      {/* Lista de Archivos */}
      {files.length > 0 && (
        <div className="space-y-6">
          
          {/* Cola de Pendientes y En Proceso */}
          <div className="space-y-3">
            {files.filter(f => f.status !== 'COMPLETED').map(file => (
              file.status === 'ERROR' ? (
                 // Si está en error, mostramos ResultCard para permitir retry
                 <ResultCard key={file.id} item={file} onRetry={handleRetry} />
              ) : (
                 <FileQueueItem 
                   key={file.id}
                   item={file}
                   suppliers={suppliers}
                   onSupplierSelect={handleSupplierSelect}
                   onRemove={handleRemove}
                 />
              )
            ))}
          </div>

          {/* Botón de Acción Principal */}
          {pendingCount > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={processQueue}
                disabled={!canProcess}
                className={`
                  px-6 py-2 rounded-md text-white font-medium transition-colors shadow-sm
                  ${canProcess 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'}
                `}
              >
                {isProcessing 
                  ? 'Procesando...' 
                  : `Procesar ${pendingCount} archivo${pendingCount !== 1 ? 's' : ''}`
                }
              </button>
            </div>
          )}

          {/* Resultados Completados */}
          {files.some(f => f.status === 'COMPLETED') && (
            <div className="pt-8 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Importaciones Completadas</h2>
              <div className="space-y-4">
                {files.filter(f => f.status === 'COMPLETED').map(file => (
                  <ResultCard key={file.id} item={file} onRetry={handleRetry} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
