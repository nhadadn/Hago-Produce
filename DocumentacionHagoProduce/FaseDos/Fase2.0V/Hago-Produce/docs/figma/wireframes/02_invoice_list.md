# Wireframe: Invoice List & Create

## Layout Structure
- **Top Bar:** Breadcrumb: "Dashboard > Invoices" | User Avatar
- **Sidebar:** Standard Navigation

## Main Content Area

### 1. Header & Controls
- **Title:** "Invoices Management" (H1)
- **Primary Actions (Right):**
    - [Button] + Create Invoice
    - [Button] Export (PDF/Excel)

### 2. Filter Bar (Collapsible)
- **Search Input:** "Search by Invoice # or Customer..."
- **Date Range:** [Start Date] - [End Date]
- **Select:** Status (Draft, Sent, Paid, Overdue)
- [Button] Apply Filters | [Link] Clear

### 3. Data Table
- **Columns:**
    - [Checkbox]
    - **Invoice #** (Link to Detail)
    - **Customer** (Link to Customer Detail)
    - **Date Issued**
    - **Due Date**
    - **Total Amount** (Right aligned)
    - **Status** (Badge: Green=Paid, Amber=Pending, Red=Overdue)
    - **Actions** (...) -> View, Edit, Send Email

### 4. Create Invoice Modal / Page
- **Section: Customer Details**
    - Select Customer (Autocomplete)
    - Billing Address (Auto-filled)
- **Section: Line Items**
    - Table: Product (Search) | Quantity | Unit Price | Total
    - [Button] + Add Line Item
- **Section: Summary**
    - Subtotal
    - Tax (IVA)
    - **Total** (Big Bold)
- **Footer Actions:**
    - [Button] Save as Draft
    - [Button] Create & Send (Primary)
