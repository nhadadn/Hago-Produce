
'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileWarning } from 'lucide-react'

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void
  disabled?: boolean
}

export default function FileDropzone({ onFilesAdded, disabled = false }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFiles = (fileList: FileList): File[] => {
    const validFiles: File[] = []
    let hasInvalidType = false
    let hasInvalidSize = false

    Array.from(fileList).forEach(file => {
      // Validar tipo (PDF)
      if (file.type !== 'application/pdf') {
        hasInvalidType = true
        return
      }
      
      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        hasInvalidSize = true
        return
      }

      validFiles.push(file)
    })

    if (hasInvalidType) {
      setError('Solo se permiten archivos PDF.')
    } else if (hasInvalidSize) {
      setError('El tamaño máximo por archivo es 10MB.')
    } else {
      setError(null)
    }

    return validFiles
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(false)
    setError(null)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(e.dataTransfer.files)
      if (validFiles.length > 0) {
        onFilesAdded(validFiles)
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    setError(null)
    
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files)
      if (validFiles.length > 0) {
        onFilesAdded(validFiles)
      }
    }
    // Reset input value to allow selecting same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full h-48 
          border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
          ${disabled 
            ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed' 
            : isDragging
              ? 'bg-blue-50 border-blue-500'
              : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
          }
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload 
            className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} 
          />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Haz click para subir</span> o arrastra y suelta
          </p>
          <p className="text-xs text-gray-500">
            PDFs (MAX. 10MB)
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
        />
      </div>

      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
          <FileWarning className="w-4 h-4 mr-1.5" />
          {error}
        </div>
      )}
    </div>
  )
}
