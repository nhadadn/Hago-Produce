import { PdfIngestionService } from '@/lib/services/documents/pdf-ingestion.service'
import fs from 'fs'

async function analyzePdf() {
  // Obtener la ruta del archivo del argumento
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('❌ Error: Debes proporcionar la ruta del archivo PDF')
    console.log('Uso: npx tsx src/scripts/analyze-pdf.ts "<ruta-del-archivo.pdf>"')
    process.exit(1)
  }

  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: El archivo no existe en la ruta: ${filePath}`)
      process.exit(1)
    }

    // Leer el archivo
    console.log(`📖 Leyendo archivo: ${filePath}`)
    const buffer = fs.readFileSync(filePath)
    console.log(`📊 Tamaño del archivo: ${buffer.length} bytes`)

    // Crear el servicio y extraer el texto
    const service = new PdfIngestionService()
    console.log('🔍 Extrayendo texto del PDF...')
    
    const result = await service.extractFromBuffer(buffer, 'analyze-script')
    
    // Mostrar resultados
    console.log('\n' + '='.repeat(60))
    console.log('📋 RESULTADOS DEL ANÁLISIS')
    console.log('='.repeat(60))
    console.log(`📄 Número de páginas: ${result.pageCount}`)
    console.log(`📝 Total de caracteres: ${result.text.length}`)
    console.log(`📅 Fecha de extracción: ${result.extractedAt.toISOString()}`)
    console.log(`🏷️  Título del PDF: ${result.metadata.title || 'No disponible'}`)
    console.log(`👤 Autor: ${result.metadata.author || 'No disponible'}`)
    
    const chunkSize = 1500
    const chunks: string[] = []
    for (let i = 0; i < result.text.length; i += chunkSize) {
      chunks.push(result.text.substring(i, Math.min(i + chunkSize, result.text.length)))
    }
    console.log(`\nTotal de chunks (1500 chars): ${chunks.length}`)
    for (let idx = 0; idx < chunks.length; idx++) {
      const c = chunks[idx]
      const start = c.substring(0, Math.min(100, c.length))
      const end = c.substring(Math.max(0, c.length - Math.min(100, c.length)))
      const header = `── CHUNK ${idx + 1}/${chunks.length} ──────────────────────────────────`
      const sep = '────────────────────────────────────────────────────────'
      console.log(`\n${header}`)
      console.log(`INICIO: ${start}`)
      console.log(`FIN:    ${end}`)
      console.log(`TOTAL:  ${c.length}`)
      console.log(sep)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Análisis completado exitosamente')
    
  } catch (error: any) {
    console.error('\n❌ Error durante el análisis:')
    console.error(`   ${error.message}`)
    
    if (error.name === 'PdfValidationError') {
      console.error('   ⚠️  El archivo no parece ser un PDF válido o está corrupto')
    } else if (error.name === 'PdfExtractionError') {
      console.error('   ⚠️  Error al extraer el texto del PDF')
    } else if (error.name === 'PdfTimeoutError') {
      console.error('   ⏰  La extracción tardó demasiado tiempo')
    }
    
    process.exit(1)
  }
}

// Ejecutar el script
analyzePdf().catch(error => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})
