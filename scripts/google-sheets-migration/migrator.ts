import prisma from '../../src/lib/db';
import { GoogleSheetsClient } from './client';
import {
  AllSheetsData,
  SheetData,
  ProductsSheetRow,
  SuppliersSheetRow,
  ProductPricesSheetRow,
  CustomersSheetRow,
  InvoicesSheetRow,
} from './types';
import { productSchema, ProductInput } from '../../src/lib/validation/product';
import { createSupplierSchema } from '../../src/lib/validation/suppliers';
import { createCustomerSchema } from '../../src/lib/validation/customers';
import { productPriceSchema, ProductPriceInput } from '../../src/lib/validation/product-price';
import {
  createInvoiceSchema,
  invoiceItemSchema,
  CreateInvoiceInput,
  InvoiceItemInput,
} from '../../src/lib/validation/invoices';
import { InvoiceStatus, Prisma, PrismaClient } from '@prisma/client';

export interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  skipExisting: boolean;
}

export interface MigrationResult {
  read: number;
  created: number;
  updated: number;
  errors: number;
  duration: number;
}

interface EntityMigrationResult {
  entity: string;
  read: number;
  created: number;
  updated: number;
  errors: number;
}

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function getCell(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in row && row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return undefined;
}

function getString(row: Record<string, unknown>, keys: string[], fallback?: string): string | undefined {
  const value = getCell(row, keys);
  if (value === undefined) return fallback;
  return String(value).trim();
}

function getNumber(row: Record<string, unknown>, keys: string[]): number | undefined {
  const value = getString(row, keys);
  if (!value) return undefined;
  const num = Number(value.replace(',', '.'));
  if (Number.isNaN(num)) return undefined;
  return num;
}

function getBoolean(row: Record<string, unknown>, keys: string[], fallback: boolean): boolean {
  const value = getCell(row, keys);
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'si', 'sí', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return fallback;
}

function getDate(row: Record<string, unknown>, keys: string[]): Date | undefined {
  const value = getString(row, keys);
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function mapProductRow(row: ProductsSheetRow): ProductInput & { rawId?: string | undefined } {
  const asRecord = row as Record<string, unknown>;
  const name = getString(asRecord, ['name', 'Name', 'product_name']);
  const unit = getString(asRecord, ['unit', 'Unidad', 'unit_name'], 'unit');

  const data = productSchema.parse({
    name: name || '',
    nameEs: getString(asRecord, ['nameEs', 'name_es', 'Nombre', 'Nombre_ES']) ?? null,
    description: getString(asRecord, ['description', 'Description', 'descripcion']) ?? null,
    category: getString(asRecord, ['category', 'Category', 'categoria']) ?? null,
    unit: unit || 'unit',
    sku: getString(asRecord, ['sku', 'SKU']) ?? null,
    isActive: getBoolean(asRecord, ['isActive', 'is_active', 'Activo'], true),
  });

  const rawId = getString(asRecord, ['id', 'ID']);

  return {
    ...data,
    rawId,
  };
}

function mapSupplierRow(row: SuppliersSheetRow): {
  data: unknown;
  rawId?: string | undefined;
} {
  const asRecord = row as Record<string, unknown>;
  const name = getString(asRecord, ['name', 'Name', 'supplier_name']) || '';

  const data = createSupplierSchema.parse({
    name,
    contactName: getString(asRecord, ['contactName', 'contact_name', 'Contacto']),
    email: getString(asRecord, ['email', 'Email']),
    phone: getString(asRecord, ['phone', 'Phone', 'telefono']),
    address: getString(asRecord, ['address', 'Address', 'direccion']),
    isActive: getBoolean(asRecord, ['isActive', 'is_active', 'Activo'], true),
  });

  const rawId = getString(asRecord, ['id', 'ID']);

  return { data, rawId };
}

function mapCustomerRow(row: CustomersSheetRow): {
  data: unknown;
  rawId?: string | undefined;
} {
  const asRecord = row as Record<string, unknown>;
  const name = getString(asRecord, ['name', 'Name', 'customer_name']) || '';
  const taxId = getString(asRecord, ['taxId', 'tax_id', 'RFC']) || '';

  const data = createCustomerSchema.parse({
    name,
    taxId,
    email: getString(asRecord, ['email', 'Email']),
    phone: getString(asRecord, ['phone', 'Phone', 'telefono']),
    address: getString(asRecord, ['address', 'Address', 'direccion']),
    isActive: getBoolean(asRecord, ['isActive', 'is_active', 'Activo'], true),
  });

  const rawId = getString(asRecord, ['id', 'ID']);

  return { data, rawId };
}

function mapProductPriceRow(row: ProductPricesSheetRow): ProductPriceInput & { rawId?: string | undefined } {
  const asRecord = row as Record<string, unknown>;

  const productId = getString(asRecord, ['productId', 'product_id']) || '';
  const supplierId = getString(asRecord, ['supplierId', 'supplier_id']) || '';
  const costPrice = getNumber(asRecord, ['costPrice', 'cost_price', 'costo']) ?? 0;
  const sellPrice = getNumber(asRecord, ['sellPrice', 'sell_price', 'precio_venta']);
  const currency = getString(asRecord, ['currency', 'Currency', 'moneda'], 'USD') || 'USD';
  const effectiveDate = getDate(asRecord, ['effectiveDate', 'effective_date', 'fecha']) ?? new Date();
  const isCurrent = getBoolean(asRecord, ['isCurrent', 'is_current'], true);

  const data = productPriceSchema.parse({
    productId,
    supplierId,
    costPrice,
    sellPrice,
    currency,
    effectiveDate,
    isCurrent,
    source: 'google_sheets',
  });

  const rawId = getString(asRecord, ['id', 'ID']);

  return {
    ...data,
    rawId,
  };
}

function mapInvoiceItems(value: string | undefined): InvoiceItemInput[] {
  if (!value) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const items: InvoiceItemInput[] = [];

  for (const raw of parsed) {
    const asRecord = (raw || {}) as Record<string, unknown>;
    const productId = getString(asRecord, ['productId', 'product_id']) || '';
    const quantity = getNumber(asRecord, ['quantity', 'qty']) ?? 0;
    const unitPrice = getNumber(asRecord, ['unitPrice', 'unit_price', 'price']) ?? 0;
    const description = getString(asRecord, ['description', 'Description']);

    const result = invoiceItemSchema.safeParse({
      productId,
      quantity,
      unitPrice,
      description,
    });

    if (result.success) {
      items.push(result.data);
    }
  }

  return items;
}

function mapInvoiceRow(row: InvoicesSheetRow): CreateInvoiceInput & {
  rawId?: string | undefined;
  number?: string | undefined;
} {
  const asRecord = row as Record<string, unknown>;
  const customerId = getString(asRecord, ['customerId', 'customer_id']) || '';
  const issueDate = getDate(asRecord, ['issueDate', 'issue_date', 'fecha_emision']) ?? new Date();
  const dueDate = getDate(asRecord, ['dueDate', 'due_date', 'fecha_vencimiento']) ?? issueDate;
  const statusString = getString(asRecord, ['status', 'Status']);
  const notes = getString(asRecord, ['notes', 'Notas']);
  const taxRate = getNumber(asRecord, ['taxRate', 'tax_rate']) ?? 0.13;
  const itemsJson = getString(asRecord, ['items', 'Items']);
  const items = mapInvoiceItems(itemsJson);

  const status = statusString
    ? (InvoiceStatus[statusString as keyof typeof InvoiceStatus] ?? InvoiceStatus.DRAFT)
    : InvoiceStatus.DRAFT;

  const result = createInvoiceSchema.parse({
    customerId,
    issueDate,
    dueDate,
    status,
    notes,
    taxRate,
    items,
  });

  const rawId = getString(asRecord, ['id', 'ID']);
  const number = getString(asRecord, ['number', 'Number']);

  return {
    ...result,
    rawId,
    number: number || undefined,
  };
}

async function migrateProducts(
  client: PrismaClientOrTx,
  sheetData: SheetData<ProductsSheetRow>,
  options: MigrationOptions,
): Promise<EntityMigrationResult> {
  const stats: EntityMigrationResult = {
    entity: 'products',
    read: sheetData.rowCount,
    created: 0,
    updated: 0,
    errors: 0,
  };

  const seenSkus = new Set<string>();

  const rows = sheetData.rows || [];
  const chunks = chunkArray(rows, options.batchSize);

  for (const chunk of chunks) {
    for (const row of chunk) {
      try {
        const mapped = mapProductRow(row);
        const skuKey = mapped.sku ? mapped.sku.toLowerCase() : undefined;

        if (skuKey) {
          if (seenSkus.has(skuKey)) {
            stats.errors += 1;
            console.warn('[MIGRATION_CONFLICT]', {
              entity: 'product',
              reason: 'duplicate_sku_in_sheet',
              sku: mapped.sku,
            });
            continue;
          }
          seenSkus.add(skuKey);
        }

        if (!skuKey) {
          stats.errors += 1;
          console.warn('[MIGRATION_SKIPPED]', {
            entity: 'product',
            reason: 'missing_sku',
          });
          continue;
        }

        const existing = await client.product.findUnique({
          where: { sku: mapped.sku || undefined },
        });

        if (existing) {
          if (options.skipExisting) {
            stats.updated += 1;
            continue;
          }

          console.warn('[MIGRATION_CONFLICT]', {
            entity: 'product',
            reason: 'existing_sku_in_db',
            sku: mapped.sku,
          });
          stats.errors += 1;
          continue;
        }

        if (!options.dryRun) {
          await client.product.create({
            data: {
              ...(mapped.rawId ? { id: mapped.rawId } : {}),
              name: mapped.name,
              nameEs: mapped.nameEs ?? null,
              description: mapped.description ?? null,
              category: mapped.category ?? null,
              unit: mapped.unit,
              sku: mapped.sku,
              isActive: mapped.isActive,
            },
          });
        }

        stats.created += 1;
      } catch (error) {
        stats.errors += 1;
        console.error('[MIGRATION_ENTITY_ERROR]', {
          entity: 'product',
          error,
        });
      }
    }
  }

  console.info('[MIGRATION_ENTITY_SUMMARY]', stats);
  return stats;
}

async function migrateSuppliers(
  client: PrismaClientOrTx,
  sheetData: SheetData<SuppliersSheetRow>,
  options: MigrationOptions,
): Promise<EntityMigrationResult> {
  const stats: EntityMigrationResult = {
    entity: 'suppliers',
    read: sheetData.rowCount,
    created: 0,
    updated: 0,
    errors: 0,
  };

  const seenNames = new Set<string>();
  const rows = sheetData.rows || [];
  const chunks = chunkArray(rows, options.batchSize);

  for (const chunk of chunks) {
    for (const row of chunk) {
      try {
        const { data, rawId } = mapSupplierRow(row);
        const supplierData = data as {
          name: string;
          contactName?: string;
          email?: string;
          phone?: string;
          address?: string;
          isActive?: boolean;
        };

        const nameKey = supplierData.name.toLowerCase();
        if (seenNames.has(nameKey)) {
          stats.errors += 1;
          console.warn('[MIGRATION_CONFLICT]', {
            entity: 'supplier',
            reason: 'duplicate_name_in_sheet',
            name: supplierData.name,
          });
          continue;
        }
        seenNames.add(nameKey);

        const existing = await client.supplier.findUnique({
          where: { name: supplierData.name },
        });

        if (existing) {
          if (options.skipExisting) {
            stats.updated += 1;
            continue;
          }

          console.warn('[MIGRATION_CONFLICT]', {
            entity: 'supplier',
            reason: 'existing_name_in_db',
            name: supplierData.name,
          });
          stats.errors += 1;
          continue;
        }

        if (!options.dryRun) {
          await client.supplier.create({
            data: {
              ...(rawId ? { id: rawId } : {}),
              name: supplierData.name,
              contactName: supplierData.contactName,
              email: supplierData.email,
              phone: supplierData.phone,
              address: supplierData.address,
              isActive: supplierData.isActive ?? true,
            },
          });
        }

        stats.created += 1;
      } catch (error) {
        stats.errors += 1;
        console.error('[MIGRATION_ENTITY_ERROR]', {
          entity: 'supplier',
          error,
        });
      }
    }
  }

  console.info('[MIGRATION_ENTITY_SUMMARY]', stats);
  return stats;
}

async function migrateCustomers(
  client: PrismaClientOrTx,
  sheetData: SheetData<CustomersSheetRow>,
  options: MigrationOptions,
): Promise<EntityMigrationResult> {
  const stats: EntityMigrationResult = {
    entity: 'customers',
    read: sheetData.rowCount,
    created: 0,
    updated: 0,
    errors: 0,
  };

  const seenTaxIds = new Set<string>();
  const rows = sheetData.rows || [];
  const chunks = chunkArray(rows, options.batchSize);

  for (const chunk of chunks) {
    for (const row of chunk) {
      try {
        const { data, rawId } = mapCustomerRow(row);
        const customerData = data as {
          name: string;
          taxId: string;
          email?: string;
          phone?: string;
          address?: string;
          isActive?: boolean;
        };

        const taxIdKey = customerData.taxId.toLowerCase();
        if (seenTaxIds.has(taxIdKey)) {
          stats.errors += 1;
          console.warn('[MIGRATION_CONFLICT]', {
            entity: 'customer',
            reason: 'duplicate_tax_id_in_sheet',
            taxId: customerData.taxId,
          });
          continue;
        }
        seenTaxIds.add(taxIdKey);

        const existing = await client.customer.findUnique({
          where: { taxId: customerData.taxId },
        });

        if (existing) {
          if (options.skipExisting) {
            stats.updated += 1;
            continue;
          }

          console.warn('[MIGRATION_CONFLICT]', {
            entity: 'customer',
            reason: 'existing_tax_id_in_db',
            taxId: customerData.taxId,
          });
          stats.errors += 1;
          continue;
        }

        if (!options.dryRun) {
          await client.customer.create({
            data: {
              ...(rawId ? { id: rawId } : {}),
              name: customerData.name,
              taxId: customerData.taxId,
              email: customerData.email,
              phone: customerData.phone,
              address: customerData.address,
              isActive: customerData.isActive ?? true,
            },
          });
        }

        stats.created += 1;
      } catch (error) {
        stats.errors += 1;
        console.error('[MIGRATION_ENTITY_ERROR]', {
          entity: 'customer',
          error,
        });
      }
    }
  }

  console.info('[MIGRATION_ENTITY_SUMMARY]', stats);
  return stats;
}

async function migrateProductPrices(
  client: PrismaClientOrTx,
  sheetData: SheetData<ProductPricesSheetRow>,
  options: MigrationOptions,
): Promise<EntityMigrationResult> {
  const stats: EntityMigrationResult = {
    entity: 'product_prices',
    read: sheetData.rowCount,
    created: 0,
    updated: 0,
    errors: 0,
  };

  const rows = sheetData.rows || [];
  const chunks = chunkArray(rows, options.batchSize);

  for (const chunk of chunks) {
    for (const row of chunk) {
      try {
        const mapped = mapProductPriceRow(row);

        const existing = await client.productPrice.findFirst({
          where: {
            productId: mapped.productId,
            supplierId: mapped.supplierId,
            isCurrent: true,
          },
        });

        if (existing) {
          if (options.skipExisting) {
            stats.updated += 1;
            continue;
          }

          console.warn('[MIGRATION_CONFLICT]', {
            entity: 'product_price',
            reason: 'existing_current_price_in_db',
            productId: mapped.productId,
            supplierId: mapped.supplierId,
          });
          stats.errors += 1;
          continue;
        }

        if (!options.dryRun) {
          const created = await client.productPrice.create({
            data: {
              ...(mapped.rawId ? { id: mapped.rawId } : {}),
              productId: mapped.productId,
              supplierId: mapped.supplierId,
              costPrice: mapped.costPrice,
              sellPrice: mapped.sellPrice,
              currency: mapped.currency,
              effectiveDate: mapped.effectiveDate,
              isCurrent: mapped.isCurrent,
              source: mapped.source,
            },
          });

          if (mapped.isCurrent) {
            await client.productPrice.updateMany({
              where: {
                productId: created.productId,
                supplierId: created.supplierId,
                id: { not: created.id },
              },
              data: {
                isCurrent: false,
              },
            });
          }
        }

        stats.created += 1;
      } catch (error) {
        stats.errors += 1;
        console.error('[MIGRATION_ENTITY_ERROR]', {
          entity: 'product_price',
          error,
        });
      }
    }
  }

  console.info('[MIGRATION_ENTITY_SUMMARY]', stats);
  return stats;
}

function calculateInvoiceTotals(data: CreateInvoiceInput): {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
} {
  let subtotal = 0;
  for (const item of data.items) {
    subtotal += item.quantity * item.unitPrice;
  }

  const taxRate = data.taxRate ?? 0.13;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return {
    subtotal,
    taxRate,
    taxAmount,
    total,
  };
}

async function migrateInvoices(
  client: PrismaClientOrTx,
  sheetData: SheetData<InvoicesSheetRow>,
  options: MigrationOptions,
): Promise<EntityMigrationResult> {
  const stats: EntityMigrationResult = {
    entity: 'invoices',
    read: sheetData.rowCount,
    created: 0,
    updated: 0,
    errors: 0,
  };

  const seenNumbers = new Set<string>();
  const rows = sheetData.rows || [];
  const chunks = chunkArray(rows, options.batchSize);

  for (const chunk of chunks) {
    for (const row of chunk) {
      try {
        const mapped = mapInvoiceRow(row);

        if (!mapped.number) {
          stats.errors += 1;
          console.warn('[MIGRATION_SKIPPED]', {
            entity: 'invoice',
            reason: 'missing_number',
          });
          continue;
        }

        const numberKey = mapped.number.toLowerCase();
        if (seenNumbers.has(numberKey)) {
          stats.errors += 1;
          console.warn('[MIGRATION_CONFLICT]', {
            entity: 'invoice',
            reason: 'duplicate_number_in_sheet',
            number: mapped.number,
          });
          continue;
        }
        seenNumbers.add(numberKey);

        if (!mapped.items || mapped.items.length === 0) {
          stats.errors += 1;
          console.warn('[MIGRATION_SKIPPED]', {
            entity: 'invoice',
            reason: 'no_items',
            number: mapped.number,
          });
          continue;
        }

        const existing = await client.invoice.findUnique({
          where: { number: mapped.number },
        });

        if (existing) {
          if (options.skipExisting) {
            stats.updated += 1;
            continue;
          }

          console.warn('[MIGRATION_CONFLICT]', {
            entity: 'invoice',
            reason: 'existing_number_in_db',
            number: mapped.number,
          });
          stats.errors += 1;
          continue;
        }

        const totals = calculateInvoiceTotals(mapped);

        if (!options.dryRun) {
          await client.invoice.create({
            data: {
              ...(mapped.rawId ? { id: mapped.rawId } : {}),
              number: mapped.number,
              customerId: mapped.customerId,
              status: mapped.status ?? InvoiceStatus.DRAFT,
              issueDate: mapped.issueDate,
              dueDate: mapped.dueDate,
              notes: mapped.notes,
              subtotal: totals.subtotal,
              taxRate: totals.taxRate,
              taxAmount: totals.taxAmount,
              total: totals.total,
              items: {
                create: mapped.items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  description: item.description,
                  totalPrice: item.quantity * item.unitPrice,
                })),
              },
            },
          });
        }

        stats.created += 1;
      } catch (error) {
        stats.errors += 1;
        console.error('[MIGRATION_ENTITY_ERROR]', {
          entity: 'invoice',
          error,
        });
      }
    }
  }

  console.info('[MIGRATION_ENTITY_SUMMARY]', stats);
  return stats;
}

async function migrateAllEntities(
  client: PrismaClientOrTx,
  data: AllSheetsData,
  options: MigrationOptions,
): Promise<{
  products: EntityMigrationResult;
  suppliers: EntityMigrationResult;
  customers: EntityMigrationResult;
  productPrices: EntityMigrationResult;
  invoices: EntityMigrationResult;
}> {
  const products = await migrateProducts(client, data.products, options);
  const suppliers = await migrateSuppliers(client, data.suppliers, options);
  const customers = await migrateCustomers(client, data.customers, options);
  const productPrices = await migrateProductPrices(client, data.productPrices, options);
  const invoices = await migrateInvoices(client, data.invoices, options);

  return {
    products,
    suppliers,
    customers,
    productPrices,
    invoices,
  };
}

export async function runMigration(
  options: MigrationOptions = { dryRun: true, batchSize: 100, skipExisting: false },
): Promise<MigrationResult> {
  const startTime = Date.now();

  const client = GoogleSheetsClient.getInstance();
  const data = await client.readAllSheets();

  console.info('[MIGRATION_START]', {
    dryRun: options.dryRun,
    batchSize: options.batchSize,
    skipExisting: options.skipExisting,
  });

  let results: {
    products: EntityMigrationResult;
    suppliers: EntityMigrationResult;
    customers: EntityMigrationResult;
    productPrices: EntityMigrationResult;
    invoices: EntityMigrationResult;
  };

  if (options.dryRun) {
    results = await migrateAllEntities(prisma, data, options);
  } else {
    results = await prisma.$transaction(async (tx) => {
      return migrateAllEntities(tx, data, options);
    });
  }

  const read =
    results.products.read +
    results.suppliers.read +
    results.customers.read +
    results.productPrices.read +
    results.invoices.read;

  const created =
    results.products.created +
    results.suppliers.created +
    results.customers.created +
    results.productPrices.created +
    results.invoices.created;

  const updated =
    results.products.updated +
    results.suppliers.updated +
    results.customers.updated +
    results.productPrices.updated +
    results.invoices.updated;

  const errors =
    results.products.errors +
    results.suppliers.errors +
    results.customers.errors +
    results.productPrices.errors +
    results.invoices.errors;

  const duration = Date.now() - startTime;

  const summary: MigrationResult = {
    read,
    created,
    updated,
    errors,
    duration,
  };

  console.info('[MIGRATION_COMPLETE]', {
    summary,
    perEntity: results,
  });

  return summary;
}

export {
  mapProductRow,
  mapSupplierRow,
  mapCustomerRow,
  mapProductPriceRow,
  mapInvoiceRow,
  mapInvoiceItems,
};

