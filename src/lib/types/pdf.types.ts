export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: Date;
    [key: string]: unknown;
  };
  supplierId: string;
  extractedAt: Date;
  fileSizeBytes: number;
}

export interface IPdfIngestor {
  extractFromBuffer(
    buffer: Buffer,
    supplierId: string
  ): Promise<PdfExtractionResult>;
}
