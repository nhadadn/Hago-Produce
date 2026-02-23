import { google, sheets_v4 } from 'googleapis';
import { AllSheetsData, SheetData } from './types';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

async function withRetry<T>(operation: () => Promise<T>, description: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isLast = attempt === MAX_RETRIES;
      console.error('[GOOGLE_SHEETS_CLIENT_ERROR]', {
        description,
        attempt,
        maxRetries: MAX_RETRIES,
        error,
      });
      if (isLast) {
        break;
      }
      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unknown error in GoogleSheetsClient operation');
}

function parseValues<T = unknown>(values: string[][] | null | undefined): SheetData<T> {
  if (!values || values.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map((h) => String(h));

  const rows = dataRows.map((row) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? null;
    });
    return record as T;
  });

  return { headers, rows, rowCount: rows.length };
}

export class GoogleSheetsClient {
  private static instance: GoogleSheetsClient | null = null;

  private readonly sheets: sheets_v4.Sheets;

  private readonly spreadsheetId: string;

  private constructor() {
    const clientEmail = getEnv('GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL');
    const privateKeyRaw = getEnv('GOOGLE_SHEETS_PRIVATE_KEY');
    const privateKey = normalizePrivateKey(privateKeyRaw);

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = getEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  }

  static getInstance(): GoogleSheetsClient {
    if (!GoogleSheetsClient.instance) {
      GoogleSheetsClient.instance = new GoogleSheetsClient();
    }
    return GoogleSheetsClient.instance;
  }

  async readSheet<T = unknown>(spreadsheetId: string, range: string): Promise<SheetData<T>> {
    const response = await withRetry(
      () =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        }),
      `readSheet(${range})`,
    );

    const values = response.data.values as string[][] | null | undefined;
    const parsed = parseValues<T>(values);

    console.info('[GOOGLE_SHEETS_READ_SHEET]', {
      spreadsheetId,
      range,
      rowCount: parsed.rowCount,
    });

    return parsed;
  }

  async readDefaultSheet<T = unknown>(range: string): Promise<SheetData<T>> {
    return this.readSheet<T>(this.spreadsheetId, range);
  }

  async readAllSheets(): Promise<AllSheetsData> {
    const [products, suppliers, productPrices, customers, invoices] = await Promise.all([
      this.readDefaultSheet('Products!A:Z'),
      this.readDefaultSheet('Suppliers!A:Z'),
      this.readDefaultSheet('ProductPrices!A:Z'),
      this.readDefaultSheet('Customers!A:Z'),
      this.readDefaultSheet('Invoices!A:Z'),
    ]);

    console.info('[GOOGLE_SHEETS_READ_ALL_SHEETS]', {
      products: products.rowCount,
      suppliers: suppliers.rowCount,
      productPrices: productPrices.rowCount,
      customers: customers.rowCount,
      invoices: invoices.rowCount,
    });

    return {
      products,
      suppliers,
      productPrices,
      customers,
      invoices,
    };
  }
}

export { parseValues };

