import { PdfIngestionService } from '@/lib/services/documents/pdf-ingestion.service';
import { logger } from '@/lib/logger/logger.service';
import { PdfValidationError, PdfExtractionError, PdfTimeoutError } from '@/lib/errors/pdf.errors';

// Mock logger
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock pdf-parse
const mockGetText = jest.fn();
const mockGetInfo = jest.fn();
const mockDestroy = jest.fn().mockResolvedValue(undefined);

const MockPDFParse = jest.fn().mockImplementation(() => ({
  getText: mockGetText,
  getInfo: mockGetInfo,
  destroy: mockDestroy
}));

jest.mock('pdf-parse', () => ({
  PDFParse: MockPDFParse
}));

describe('PdfIngestionService', () => {
  let service: PdfIngestionService;
  const supplierId = 'supplier-123';
  // Valid PDF buffer starts with %PDF
  const validPdfBuffer = Buffer.from('%PDF-1.5 Content');
  
  beforeEach(() => {
    service = new PdfIngestionService();
    jest.clearAllMocks();
    
    // Default success mocks
    mockGetText.mockResolvedValue({
      text: 'Extracted text',
      pages: [],
      total: 1
    });
    
    mockGetInfo.mockResolvedValue({
      info: {
        Title: 'Test PDF',
        Author: 'Tester',
        CreationDate: 'D:20240101120000',
      },
      metadata: {},
      total: 1
    });
  });

  it('should extract text from a valid PDF', async () => {
    const result = await service.extractFromBuffer(validPdfBuffer, supplierId);

    expect(result.text).toBe('Extracted text');
    expect(result.pageCount).toBe(1);
    expect(result.metadata.title).toBe('Test PDF');
    expect(MockPDFParse).toHaveBeenCalledTimes(1);
    expect(mockGetText).toHaveBeenCalledTimes(1);
    expect(mockGetInfo).toHaveBeenCalledTimes(1);
    expect(mockDestroy).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Extraction successful'));
  });

  it('should throw PdfValidationError for empty buffer', async () => {
    const emptyBuffer = Buffer.alloc(0);
    await expect(service.extractFromBuffer(emptyBuffer, supplierId))
      .rejects
      .toThrow(PdfValidationError);
  });

  it('should throw PdfValidationError for files > 10MB', async () => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
    await expect(service.extractFromBuffer(largeBuffer, supplierId))
      .rejects
      .toThrow(PdfValidationError);
  });

  it('should throw PdfValidationError for invalid magic bytes', async () => {
    const invalidBuffer = Buffer.from('NOT A PDF');
    await expect(service.extractFromBuffer(invalidBuffer, supplierId))
      .rejects
      .toThrow(PdfValidationError);
  });

  it('should throw PdfExtractionError when pdf-parse fails', async () => {
    mockGetText.mockRejectedValueOnce(new Error('Parsing failed'));
    
    await expect(service.extractFromBuffer(validPdfBuffer, supplierId))
      .rejects
      .toThrow(PdfExtractionError);
      
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Extraction failed'), expect.any(Error));
  });

  it('should throw PdfTimeoutError when extraction takes too long', async () => {
    jest.useFakeTimers();
    
    // Create a promise that never resolves (or takes too long)
    mockGetText.mockImplementation(() => new Promise(() => {}));
    
    const extractPromise = service.extractFromBuffer(validPdfBuffer, supplierId);
    
    // Allow async operations (dynamic import) to complete and timer to be scheduled
    // We need to flush microtasks because the service uses await import() before setting the timer
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
    
    // Advance time by 31 seconds
    jest.advanceTimersByTime(31000);
    
    await expect(extractPromise).rejects.toThrow(PdfTimeoutError);
    
    jest.useRealTimers();
  });

  it('should warn when no text is extracted', async () => {
    mockGetText.mockResolvedValueOnce({
      text: '',
      pages: [],
      total: 1
    });
    
    mockGetInfo.mockResolvedValueOnce({
      info: {},
      metadata: {},
      total: 1
    });

    const result = await service.extractFromBuffer(validPdfBuffer, supplierId);
    
    expect(result.text).toBe('');
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('PDF processed but no text extracted'));
  });
});
