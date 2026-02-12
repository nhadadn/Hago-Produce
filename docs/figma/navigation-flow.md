# Navigation Flow

## 🗺️ Sitemap

1.  **Public**
    - Login / Register (Tenant Selection)
    - Forgot Password

2.  **Admin / Management (Dashboard)**
    - **Overview:** KPI Cards (Open Pedimentos, Compliance Alerts, Recent Activity)
    - **Pedimentos:**
        - List View (Filterable by Date, Clave, Status)
        - Detail View (Tabs: General, Partidas, Anexos, Documents)
        - Import/Sync (VUCEM/XML)
    - **Inventario (Anexo 24):**
        - Temporal Import Inventory
        - Historical Log
        - Compliance Check
    - **Reportes:**
        - Anexo 31 (Saldos)
        - Data Stage Reports
    - **Settings:**
        - Tenant Config
        - User Management

## 🔄 User Flows

### 1. Pedimento Review Flow
`Dashboard` -> `Pedimentos List` -> `Select Pedimento` -> `Review Validation Status` -> `Check Anexo 24 Compliance` -> `Approve/Flag`

### 2. Manual Adjustment Flow
`Inventario` -> `Search Item` -> `View Details` -> `Adjust Balance` -> `Add Justification` -> `Save (Audit Logged)`

### 3. Compliance Audit Flow
`Dashboard` -> `Reportes` -> `Generate Data Stage` -> `Review Discrepancies` -> `Drill down to Pedimento`
