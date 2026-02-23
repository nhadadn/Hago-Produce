# Wireframe: Create/Edit Invoice

## Layout Structure
- **Top Bar:** "New Invoice" (or "Edit Invoice #123") | [Button] Save as Draft | [Button] Preview
- **Sidebar:** Collapsed (focus on data entry)

## 1. Header Section
- **Client Selection:**
  - **Dropdown/Search:** "Select Customer..." (Auto-complete)
  - **Display:** Shows selected client's address and RFC automatically.
  - **Action:** [+ New Client] (Quick add modal)
- **Invoice Details:**
  - **Series/Folio:** Auto-generated (e.g., A-1024) or Manual override.
  - **Date:** Date Picker (Default: Today).
  - **Due Date:** Auto-calculated based on Client Terms (editable).
  - **Payment Method:** Dropdown (PUE - Pago en una sola exhibición, PPD - Pago en parcialidades).
  - **Payment Form:** Dropdown (Transfer, Cash, Check).
  - **Currency:** MXN / USD (Exchange rate field if USD).

## 2. Line Items (The Grid)
| # | Product/Service (Search) | Qty | Unit | Unit Price | Discount | Tax | Total | Actions |
|---|--------------------------|-----|------|------------|----------|-----|-------|---------|
| 1 | [Search: Apple...] -> "Apple Gala" | [ 10 ] | kg | [ $25.00 ] | [ 0% ] | 16% | $250.00 | [x] |
| 2 | [Search: Deliv...] -> "Delivery" | [ 1 ] | srv | [ $500.00] | [ 0% ] | 16% | $500.00 | [x] |

- **Row Interaction:**
  - **Product Search:** Type to filter catalog. Selecting fills Unit Price and Tax defaults.
  - **Tab Navigation:** Tab moves to next field. Enter moves to new row.
  - **Calculations:** Real-time updates of Row Total.
- **Footer Actions:**
  - [Button] + Add Line Item
  - [Button] + Add Free Text Item (Non-catalog)

## 3. Totals & Notes (Footer)
- **Left Side:**
  - **Public Notes:** "Delivery to warehouse B." (Visible on PDF)
  - **Internal Notes:** "Approve after credit check." (Private)
  - **Terms & Conditions:** Pre-filled text area.
- **Right Side (Summary):**
  - **Subtotal:** $750.00
  - **Discount:** $0.00
  - **VAT (16%):** $120.00
  - **Retentions:** $0.00 (if applicable)
  - **Total:** $870.00

## 4. Action Bar (Sticky Bottom)
- **Status:** "Draft - Not Saved"
- **Buttons:**
  - [Cancel]
  - [Save Draft] (Does not stamp/timbrar)
  - [Save & Finalize] (Generates UUID, Stamps with SAT - if connected)
