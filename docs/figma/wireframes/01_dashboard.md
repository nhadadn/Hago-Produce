# Wireframe: Dashboard (Overview)

## Layout Structure
- **Top Bar:** Breadcrumb: "Dashboard" | User Avatar | Tenant Switcher (Hago Produce)
- **Sidebar:** Navigation (Dashboard, Pedimentos, Inventario, Reportes, Configuración)

## Main Content Area

### 1. KPI Cards (Top Row)
- **Open Pedimentos:** Count (e.g., "12") | Trend (+2 this week) | Color: Blue
- **Compliance Alerts:** Count (e.g., "3") | "Urgent Action Required" | Color: Red
- **Pending Anexos:** Count (e.g., "5") | "Awaiting Validation" | Color: Amber
- **Total Import Value (MTD):** Currency (e.g., "$1.2M USD") | Trend | Color: Slate

### 2. Activity Feed & Quick Actions (Middle Row)
- **Left Column (2/3): Recent Activity**
    - List of recent events (System Audit Log subset)
    - [Icon] User X updated Pedimento #1234 (2 mins ago)
    - [Icon] Import from VUCEM completed (1 hour ago)
    - [Icon] Anexo 24 Report generated (Yesterday)
- **Right Column (1/3): Quick Actions**
    - [Button] + Nuevo Pedimento (Primary)
    - [Button] Importar XML (Secondary)
    - [Button] Generar Reporte Saldos (Outline)

### 3. Critical Alerts (Bottom Row)
- **Table/List:** Items nearing expiration (Vencimiento de plazo legal)
- Columns: Pedimento # | Clave | Fecha Entrada | Días Restantes | Status
- Action: "Resolve" button on hover.

## Visual Notes
- Use ample whitespace between sections.
- KPI cards should have subtle drop shadows.
- Alerts section should use a red/amber border or background hint to draw attention.
