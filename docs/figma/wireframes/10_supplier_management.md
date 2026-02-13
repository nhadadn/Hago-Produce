# Wireframe: Supplier Management (Detailed)

## Layout Structure
- **Top Bar:** Breadcrumb: "Dashboard > Suppliers"
- **Sidebar:** Standard Navigation

## 1. Supplier List View
- **Header:** "Suppliers" | [Button] + Add Supplier
- **Filters:** Category (Fruit, Veg, Packaging), Status
- **Search:** "Search by name..."

### Data Grid
| Supplier Name | Contact | Category | Products | Last Purchase | Status | Actions |
|---------------|---------|----------|----------|---------------|--------|---------|
| Agricola San Juan | Pedro | Fruits | 12 | Yesterday | Active | [View] |
| Empaques del Norte| Luis | Packaging| 5 | 1 month ago | Active | [View] |

## 2. Supplier Detail View
- **Header:** "Agricola San Juan" | [Badge] Active
- **Summary Cards:**
  - **YTD Purchases:** $120,000
  - **Open Orders:** 3
  - **Last Delivery:** On Time

### Tabs
#### [ Profile ]
- **General:** Name, Tax ID, Address, Website.
- **Payment Details:** Bank Name, Account Number, CLABE (for transfers).
- **Contacts:** Sales Rep, Logistics Manager.

#### [ Products ]
- **Catalog:** List of products sourced from this supplier.
- **Columns:** SKU | Name | Last Cost | Availability
- **Action:** [Button] Update Costs

#### [ Purchase Orders ]
- **History:** POs sent to this supplier.
- **Status:** Draft, Sent, Received, Paid.

## 3. Create/Edit Supplier Form
- **Section 1: Identification**
  - Company Name
  - Tax ID
  - Supplier Type (Grower, Distributor, Service)
- **Section 2: Contact & Address**
  - Address fields
  - Main Contact Person
- **Section 3: Financials**
  - Bank Details (for payments)
  - Payment Terms (Net 7, Net 30)
  - Currency (MXN, USD)
- **Actions:** [Cancel] [Save Supplier]
