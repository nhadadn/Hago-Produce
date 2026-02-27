import { logger } from '@/lib/logger/logger.service';
import { IPdfIngestor, PdfExtractionResult } from '@/lib/types/pdf.types';
import { PdfValidationError, PdfExtractionError, PdfTimeoutError } from '@/lib/errors/pdf.errors';

export class PdfIngestionService implements IPdfIngestor {
  private static readonly TIMEOUT_MS = 30_000;
  private static readonly MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

  /**
   * Extracts text and metadata from a PDF buffer.
   * Uses lazy loading for pdf-parse to avoid open handles in tests.
   * 
   * @param buffer - The PDF file buffer
   * @param supplierId - The ID of the supplier for logging
   * @returns The extraction result including text and metadata
   * @throws PdfValidationError if the file is invalid (size, format, empty)
   * @throws PdfTimeoutError if extraction takes longer than 30s
   * @throws PdfExtractionError if parsing fails
   * 
   * @example
   * ```ts
   * const service = new PdfIngestionService();
   * const result = await service.extractFromBuffer(fileBuffer, 'supplier-123');
   * // logger.info(result.text);
   * ```
   */
  async extractFromBuffer(buffer: Buffer, supplierId: string): Promise<PdfExtractionResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validations
      
      // Check for empty buffer
      if (!buffer || buffer.length === 0) {
        throw new PdfValidationError('PDF buffer is empty');
      }

      // Check file size
      if (buffer.length > PdfIngestionService.MAX_SIZE_BYTES) {
        throw new PdfValidationError(`File size exceeds limit of ${PdfIngestionService.MAX_SIZE_BYTES / (1024 * 1024)}MB`);
      }

      // Check magic bytes (%PDF)
      // The first 4 bytes should be %PDF
      if (buffer.length < 4 || buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
        throw new PdfValidationError('Invalid file format. Expected PDF magic bytes (%PDF)');
      }

      logger.debug(`[PdfIngestionService] Starting PDF extraction for supplier ${supplierId}, size: ${buffer.length} bytes`);

      // 2. Lazy load pdf-parse
      // Using dynamic import to handle ESM/CJS compatibility better in test environments
      let PDFParseClass: any;
      
      try {
        const pdfParseModule = await import('pdf-parse');
        
        // Handle different module formats
        if (pdfParseModule.PDFParse) {
           PDFParseClass = pdfParseModule.PDFParse;
        } else if (pdfParseModule.default && pdfParseModule.default.PDFParse) {
           PDFParseClass = pdfParseModule.default.PDFParse;
        } else if (typeof pdfParseModule.default === 'function') {
           // Fallback for v1 default export
           throw new Error('Unexpected pdf-parse v1 detected. Please use v2+.');
        }

        if (!PDFParseClass) {
          logger.error(`[PdfIngestionService] Failed to load PDFParse class. Module keys: ${Object.keys(pdfParseModule).join(', ')}`);
          throw new Error(`Could not find PDFParse class in module`);
        }
      } catch (importError: any) {
        logger.error(`[PdfIngestionService] Failed to import pdf-parse: ${importError.message}`);
        throw new PdfExtractionError(`Failed to load PDF parser library: ${importError.message}`);
      }

      // 3. Extract with timeout using Promise.race()
      let parser: any;
      let extractPromise: Promise<any>;

      try {
        // Convert Buffer to Uint8Array 
        // We create a copy to ensure it's a standard Uint8Array
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length);
        const data = new Uint8Array(arrayBuffer);
        
        parser = new PDFParseClass({ 
          data,
          // Disable font face rendering to improve performance and stability
          disableFontFace: true,
        });
        
        // We need both text and info
        extractPromise = Promise.all([
          parser.getText(),
          parser.getInfo()
        ]);
      } catch (e: any) {
        throw new PdfExtractionError(`Failed to initialize PDF parser: ${e.message}`);
      }
      
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => 
        timeoutId = setTimeout(() => reject(
          new PdfTimeoutError(`PDF extraction timeout after ${PdfIngestionService.TIMEOUT_MS}ms`)
        ), PdfIngestionService.TIMEOUT_MS)
      );

      let results: [any, any];
      try {
        results = await Promise.race([
          extractPromise,
          timeoutPromise
        ]);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        // Clean up worker/resources
        if (parser && parser.destroy) {
          await parser.destroy().catch((e: any) => logger.warn(`[PdfIngestionService] Failed to destroy parser: ${e.message}`));
        }
      }

      const [textData, infoData] = results;

      // 4. Process result
      const processingTime = Date.now() - startTime;
      
      if (!textData.text || textData.text.trim().length === 0) {
        logger.warn(`[PdfIngestionService] PDF processed but no text extracted (possible image-only PDF) for supplier ${supplierId}`);
      }

      const result: PdfExtractionResult = {
        text: textData.text || '',
        pageCount: infoData.total || 0,
        metadata: {
          title: infoData.info?.Title,
          author: infoData.info?.Author,
          creationDate: infoData.info?.CreationDate ? new Date(this.parsePdfDate(infoData.info.CreationDate)) : undefined,
          ...infoData.metadata,
        },
        supplierId,
        extractedAt: new Date(),
        fileSizeBytes: buffer.length,
      };

      logger.debug(`[PdfIngestionService] Extraction successful: ${result.pageCount} pages, ${result.fileSizeBytes} bytes in ${processingTime}ms for supplier ${supplierId}`);

      return result;

    } catch (error: any) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof PdfValidationError || error instanceof PdfTimeoutError) {
        logger.error(`[PdfIngestionService] Validation/Timeout error for supplier ${supplierId}: ${error.message}`);
        throw error;
      }

      // If it's a parsing error from pdf-parse
      logger.error(`[PdfIngestionService] Extraction failed for supplier ${supplierId}`, error);
      throw new PdfExtractionError(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Helper to parse PDF date strings like "D:20240101120000"
   */
  private parsePdfDate(dateStr: string): string | number | Date {
    // Simple fallback, real PDF date parsing can be complex
    // If it starts with D:, try to parse it
    if (typeof dateStr === 'string' && dateStr.startsWith('D:')) {
      const year = dateStr.substring(2, 6);
      const month = dateStr.substring(6, 8);
      const day = dateStr.substring(8, 10);
      return `${year}-${month}-${day}`;
    }
    return new Date();
  }
}
