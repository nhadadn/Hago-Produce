import { logger } from '@/lib/logger/logger.service';
import { IPdfIngestor, PdfExtractionResult } from '@/lib/types/pdf.types';
import { PdfValidationError, PdfExtractionError, PdfTimeoutError } from '@/lib/errors/pdf.errors';

export class PdfIngestionService implements IPdfIngestor {
  private static readonly TIMEOUT_MS = 30_000;
  private static readonly MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

  /**
   * Extracts text and metadata from a PDF buffer.
   * Uses pdf-parse to simplify extraction in Node environment.
   * 
   * @param buffer - El buffer del archivo PDF
   * @param supplierId - El ID del proveedor para logging
   * @returns El resultado de la extracción incluyendo texto y metadatos
   */
  async extractFromBuffer(buffer: Buffer, supplierId: string): Promise<PdfExtractionResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validaciones
      if (!buffer || buffer.length === 0) {
        throw new PdfValidationError('PDF buffer is empty');
      }

      if (buffer.length > PdfIngestionService.MAX_SIZE_BYTES) {
        throw new PdfValidationError(`File size exceeds limit of ${PdfIngestionService.MAX_SIZE_BYTES / (1024 * 1024)}MB`);
      }

      if (buffer.length < 4 || buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
        throw new PdfValidationError('Invalid file format. Expected PDF magic bytes (%PDF)');
      }

      logger.debug(`[PdfIngestionService] Starting PDF extraction for supplier ${supplierId}, size: ${buffer.length} bytes`);

      // 2. Extraer con timeout
      const extractPromise = (async () => {
        try {
          // Lazy load pdf-parse to avoid top-level require issues in Next.js
          const pdfParse = require('pdf-parse');
          const data = await pdfParse(buffer);
          
          const rawText = data.text;
          const pageCount = data.numpages;

          if (!rawText || rawText.trim().length < 50) {
            throw new Error('PDF_EMPTY_OR_UNREADABLE');
          }

          return {
            text: rawText,
            pageCount: pageCount,
            metadata: {
              title: data.info?.Title,
              author: data.info?.Author,
              creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
              info: data.info,
              metadata: data.metadata
            },
            supplierId: supplierId,
            extractedAt: new Date(),
            fileSizeBytes: buffer.length
          } as PdfExtractionResult;
        } catch (error: any) {
          throw new Error(`PDF parsing failed: ${error.message}`);
        }
      })();

      // 3. Race con timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new PdfTimeoutError(`PDF extraction timed out after ${PdfIngestionService.TIMEOUT_MS}ms`));
        }, PdfIngestionService.TIMEOUT_MS);
      });

      const result = await Promise.race([extractPromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      logger.info(`[PdfIngestionService] PDF extracted successfully for ${supplierId} in ${duration}ms. Pages: ${result.pageCount}`);

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error instanceof PdfValidationError || error instanceof PdfTimeoutError) {
        logger.warn(`[PdfIngestionService] Validation/Timeout error for ${supplierId}: ${error.message}`);
        throw error;
      }

      logger.error(`[PdfIngestionService] Extraction failed for supplier ${supplierId}`, { 
        error: {
            message: error.message,
            name: error.name,
            stack: error.stack
        } 
      });
      
      throw new PdfExtractionError(`Failed to parse PDF: ${error.message}`);
    }
  }
}
