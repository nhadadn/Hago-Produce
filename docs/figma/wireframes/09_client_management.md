# Wireframe: Client Management (Detailed)

## Layout Structure
- **Top Bar:** Breadcrumb: "Dashboard > Clients"
- **Sidebar:** Standard Navigation

## 1. Client List View
- **Header:** "Clients" | [Button] + Add Client | [Button] Export CSV
- **Filters:** Status (Active, Inactive), Balance (Overdue, Clear), Sales Rep
- **Search:** "Search by name, RFC, or email..."

### Data Grid
| Name | Contact Person | RFC | Balance | Last Order | Status | Actions |
|------|----------------|-----|---------|------------|--------|---------|
| Supermercado A | Juan Perez | XAXX... | $5,000 | 2 days ago | Active | [Edit] [View] |
| Frutería B | Maria Lopez | XEXX... | $0 | 1 week ago | Active | [Edit] [View] |

## 2. Client Detail View
- **Header:** "Supermercado A" | [Badge] Active | [Button] Edit Profile
- **Summary Cards:**
  - **Total Spend:** $50,000 (YTD)
  - **Outstanding:** $5,000
  - **Credit Limit:** $10,000
  - **Payment Terms:** Net 30

### Tabs
#### [ Profile ]
- **Company Info:** Legal Name, RFC, Tax Regime.
- **Addresses:**
  - **Billing:** Calle 123, Col. Centro... [Map Pin]
  - **Shipping:** Same as billing | [Button] + Add Address
- **Contacts:**
  - **Primary:** Juan Perez (Manager) - juan@example.com - 555-1234
  - **Billing:** Ana Silva (Accountant) - ana@example.com

#### [ Orders & Invoices ]
- **List:** History of all invoices linked to this client.
- **Columns:** Invoice # | Date | Amount | Status | Due Date
- **Actions:** View PDF, Resend

#### [ Statement ]
- **Date Range Picker:** [ Start Date ] - [ End Date ]
- **Transaction Log:** Invoices, Payments, Credit Notes.
- **Running Balance:** Calculated daily.
- **Action:** [Button] Download Statement (PDF/Excel)

#### [ Files ]
- **Documents:** Tax ID Card (CIF), Proof of Address, Contract.
- **Upload:** Drag & drop zone.

## 3. Create/Edit Client Form (Modal or Page)
- **Section 1: General Information**
  - Commercial Name (Required)
  - Legal Name (Razon Social)
  - RFC (Pattern validation)
  - Email (for notifications)
  - Phone
- **Section 2: Fiscal Address**
  - Street, Number, Colony, City, State, Zip Code.
- **Section 3: Commercial Terms**
  - Payment Terms (Dropdown: Immediate, Net 7, Net 15, Net 30)
  - Credit Limit (Currency input)
  - Price List (Dropdown: Default, Wholesale, VIP)
- **Actions:** [Cancel] [Save Client]
