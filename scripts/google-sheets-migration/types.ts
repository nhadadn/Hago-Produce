export interface SheetData<T = unknown> {
  headers: string[];
  rows: T[];
  rowCount: number;
}

export interface ProductsSheetRow {
  [key: string]: string | number | boolean | null;
}

export interface SuppliersSheetRow {
  [key: string]: string | number | boolean | null;
}

export interface ProductPricesSheetRow {
  [key: string]: string | number | boolean | null;
}

export interface CustomersSheetRow {
  [key: string]: string | number | boolean | null;
}

export interface InvoicesSheetRow {
  [key: string]: string | number | boolean | null;
}

export interface AllSheetsData {
  products: SheetData<ProductsSheetRow>;
  suppliers: SheetData<SuppliersSheetRow>;
  productPrices: SheetData<ProductPricesSheetRow>;
  customers: SheetData<CustomersSheetRow>;
  invoices: SheetData<InvoicesSheetRow>;
}

