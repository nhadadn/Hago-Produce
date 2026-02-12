# Wireframe: Pedimentos List

## Layout Structure
- **Top Bar:** Breadcrumb: "Dashboard > Pedimentos" | Global Search
- **Sidebar:** Standard Navigation

## Main Content Area

### 1. Header & Controls
- **Title:** "Gestión de Pedimentos" (H1)
- **Primary Actions (Right):**
    - [Button] + Nuevo Manual
    - [Button] Importar (VUCEM/XML)
    - [Button] Exportar (Excel/CSV)

### 2. Filter Bar (Collapsible)
- **Search Input:** "Buscar por número, proveedor..."
- **Date Range:** [Start Date] - [End Date]
- **Select:** Estado (Abierto, Cerrado, Rectificado)
- **Select:** Clave (IN, RT, A1, etc.)
- **Select:** Aduana (470, 240, etc.)
- [Button] Aplicar Filtros | [Link] Limpiar

### 3. Data Table (The Core)
- **Columns:**
    - [Checkbox] (Select row)
    - **Pedimento #** (Link to Detail)
    - **Tipo Op.** (IMP/EXP)
    - **Clave** (Badge: A1=Blue, IN=Green)
    - **Fecha Entrada** (Format: DD/MM/YYYY)
    - **Proveedor/Cliente**
    - **Valor USD** (Right aligned)
    - **Estado** (Badge: Valid, Error, Warning)
    - **Actions** (...) -> Ver, Editar, Borrar (if allowed)

### 4. Pagination
- "Showing 1-25 of 1,234 records"
- [Previous] [1] [2] [3] ... [Next]
- Rows per page selector: [25]

## Visual Notes
- Table header should be sticky.
- Row hover effect for better readability.
- Status badges should use the "Status Colors" from Design System.
- "Pedimento #" should be a clear, clickable link style.
