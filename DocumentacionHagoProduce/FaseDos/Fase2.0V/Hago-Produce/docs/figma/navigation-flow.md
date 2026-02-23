# Navigation Flow (Hago Produce) - Complete

## 🗺️ Sitemap & Wireframe Index

1.  **Public**
    - **Authentication:**
        - [Login / Register](wireframes/00_auth.md)
        - Forgot Password / Reset Password

2.  **Admin / Management (Internal Dashboard)**
    - **Overview:**
        - [Dashboard](wireframes/01_dashboard.md) (KPI Cards, Activity Feed)
    - **Invoices:**
        - [Invoice List](wireframes/02_invoice_list.md) (All, Draft, Unpaid, Paid, Overdue)
        - [Create/Edit Invoice](wireframes/11_create_invoice.md) (Complex Form)
        - [Invoice Detail](wireframes/02_invoice_detail.md) (View, Send, PDF, History)
    - **Products:**
        - [Product List & Detail](wireframes/03_product_list.md) (Catalog, Prices, Stock)
        - Categories Management
    - **Clients (Customers):**
        - [Client Management](wireframes/09_client_management.md) (List, Detail, Profile, Statement)
    - **Suppliers:**
        - [Supplier Management](wireframes/10_supplier_management.md) (List, Detail, Products, POs)
    - **Reports & Analytics:**
        - [Reports Dashboard](wireframes/07_reports.md) (Sales, Inventory, Financials)
    - **AI Assistant:**
        - [AI Chat Interface](wireframes/06_ai_chat.md) (Price check, Quick actions)
    - **Settings:**
        - [System Configuration](wireframes/12_settings.md) (Company, Users, Integrations)

3.  **Customer Portal (External)**
    - [Customer Dashboard & Invoices](wireframes/04_customer_portal.md)
    - **My Invoices:** List, Filter, Download PDF
    - **Account Statement:** Payment history
    - **Profile:** Manage contact info

## 🔄 Core User Flows

### 1. Create Invoice Flow (Admin)
`Dashboard` -> `Invoices` -> `[Create New]` (See [Wireframe 11](wireframes/11_create_invoice.md)) -> `Select Customer` -> `Add Products (Autocomplete)` -> `Review Totals` -> `Save/Send`

### 2. Product Price Check Flow (Admin - Chat)
`Dashboard` -> `Chat` -> `Type Query ("Price of Apples?")` -> `View AI Answer` -> `Click Source Product` (See [Wireframe 06](wireframes/06_ai_chat.md))

### 3. Customer Payment Review (Customer)
`Login` -> `My Invoices` -> `Filter by "Unpaid"` -> `Select Invoice` -> `Download PDF` (See [Wireframe 04](wireframes/04_customer_portal.md))

### 4. New Supplier Onboarding (Admin)
`Settings` -> `Suppliers` -> `Add Supplier` -> `Enter Details` -> `Link Products` -> `Set Initial Prices` (See [Wireframe 10](wireframes/10_supplier_management.md))

### 5. Monthly Closing (Accounting)
`Reports` -> `Financial Health` -> `Filter: Last Month` -> `Export PDF` -> `Review Outstanding Invoices` -> `Send Reminders` (See [Wireframe 07](wireframes/07_reports.md))
