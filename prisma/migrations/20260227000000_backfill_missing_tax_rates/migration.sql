-- Backfill any missing tax rates with the old default (0.13)
-- This ensures historical data integrity if any records were created during the transition without a rate.
-- Most records should already have 0.13 from the previous default.

UPDATE "invoices" 
SET "tax_rate" = 0.13 
WHERE "tax_rate" IS NULL;

UPDATE "purchase_orders" 
SET "taxRate" = 0.13 
WHERE "taxRate" IS NULL;
