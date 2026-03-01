# Breaking Change: Tax Calculation Logic (S6-P03)

## Summary
The hardcoded default tax rate (`@default(0.13)`) has been removed from `Invoice` and `PurchaseOrder` models in Prisma schema. Tax calculation is now performed dynamically by `TaxCalculationService` based on:
1. Explicit `taxRate` provided in input.
2. If missing, derived from Customer/Supplier address (province).

## Impact
- **Database**: `tax_rate` column in `invoices` and `taxRate` column in `purchase_orders` no longer have a default value.
- **API**: Creating an invoice/PO without `taxRate` will now trigger a DB lookup for customer/supplier address to calculate tax. 
- **Fallback**: If the customer/supplier address is missing or no valid Canadian province is found, the system defaults to **GST (5%)** and logs a warning.
- **Existing Data**: Existing records are unaffected as they already have values (mostly 0.13). A migration script ensures no null values exist.

## Migration Strategy

### 1. Database Schema Changes
The migration script `prisma/migrations/20260226234855_remove_hardcoded_tax_rate/migration.sql` removes the default value constraint:

```sql
-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "tax_rate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "purchase_orders" ALTER COLUMN "taxRate" DROP DEFAULT;
```

### 2. Historical Data Decision
**DECISION: KEEP EXISTING VALUES.**
- Existing records with `taxRate = 0.13` (historical default) are preserved as they reflect the tax rate applied at the time of creation.
- No data modification or recalculation is performed on historical records to maintain financial integrity.
- A verification script `scripts/verify-tax-data.ts` is provided to audit the distribution of tax rates.

### 3. Null Address Fallback
If `Customer.address` or `Supplier.address` is null or does not contain a valid Canadian province:
- **Behavior**: The system falls back to **federal GST (5%)**.
- **Logging**: A warning is logged: `Customer {id} has no valid address/province. Using fallback tax rate 0.05 (GST).`
- **Justification**: Ensures tax calculation continuity while flagging missing data for correction.

## Rollback Guide
If this migration causes issues (e.g., application failing to calculate taxes):

1. **Revert Code**: Revert `InvoicesService` and `PurchaseOrdersService` to use a hardcoded default in code if calculation fails.
2. **Revert Database**: Restore the default constraint.
   ```sql
   ALTER TABLE "invoices" ALTER COLUMN "tax_rate" SET DEFAULT 0.13;
   ALTER TABLE "purchase_orders" ALTER COLUMN "taxRate" SET DEFAULT 0.13;
   ```
3. **Data Integrity**: Verify no new records were created with incorrect tax rates using `scripts/verify-tax-data.ts`.

## Code Changes
- `InvoicesService` and `PurchaseOrdersService` now depend on `TaxCalculationService`.
- `extractProvinceFromAddress` now returns `null` if no province is found (previously defaulted to 'ON').
- Unit tests updated to mock `TaxCalculationService` and cover fallback scenarios.
- `Prisma.Decimal` is used for all tax calculations to ensure precision.
