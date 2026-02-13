# Wireframe: Admin Management (Users, Suppliers, Customers)

## Layout Structure
- **Top Bar:** Standard
- **Sidebar:** Settings / Management Section

## 1. User Management (Internal)
**Title:** "Team Members" | [Button] + Invite User

### List View
- **Columns:** Name | Email | Role (Admin/Sales/Accounting) | Status (Active/Invited) | Last Login
- **Actions:** Edit Role, Deactivate, Resend Invite

### Invite Modal
- **Input:** Email Address
- **Select:** Role (Admin, Viewer, Editor)
- **Message:** Optional personal note.

## 2. Supplier Management
**Title:** "Suppliers" | [Button] + Add Supplier

### List View
- **Columns:** Company Name | Contact Person | Email | Products Count | Status
- **Actions:** Edit, View Products

### Supplier Detail / Edit
- **General Info:** Name, Tax ID, Address.
- **Contact Info:** Phone, Email, Website.
- **Products Linked:** List of products supplied by this entity.

## 3. Customer Management
**Title:** "Customers" | [Button] + Add Customer

### List View
- **Columns:** Business Name | Tax ID | Main Contact | Balance Due | Status
- **Actions:** Edit, View Statement, Create Invoice

### Customer Detail
- **Header:** Customer Name | [Badge] Good Standing
- **Tabs:**
    - **[ Profile ]** Address, Tax Details, Payment Terms (Net 30/60).
    - **[ Contacts ]** List of people authorized to view portal.
    - **[ Invoices ]** History of invoices.
    - **[ Files ]** Contracts, Tax documents.

## Visual Notes
- Consistent table layouts across all 3 sections.
- "Add" actions open a Slide-over (Drawer) or Modal to keep context.
