export class PdfValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfValidationError';
  }
}

export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfExtractionError';
  }
}

export class PdfTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfTimeoutError';
  }
}
