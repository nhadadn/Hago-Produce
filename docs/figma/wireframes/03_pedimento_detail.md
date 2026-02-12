# Wireframe: Pedimento Detail

## Layout Structure
- **Top Bar:** Breadcrumb: "Dashboard > Pedimentos > 240-1234567" | Status Indicator (e.g., "Validado - Anexo 24 OK")

## Main Content Area

### 1. Header Summary
- **Title:** Pedimento # 240-1234567 (H1)
- **Subtitle:** Clave A1 | Importación Definitiva | Fecha: 12/02/2024
- **Actions (Right):**
    - [Button] Editar
    - [Button] Validar Compliance
    - [Dropdown] Más acciones (Imprimir, Clonar, Borrar)

### 2. Key Metrics (Banner)
- **Tipo Cambio:** $17.50 MXN
- **Valor Aduana:** $50,000 USD
- **IVA:** $8,000 MXN
- **PRV:** $250 MXN

### 3. Content Tabs
**[ General ] [ Partidas ] [ Tasas/Contribuciones ] [ Anexos ] [ Documentos ]**

#### Tab: General (Active)
- **Grid Layout (2 cols):**
    - **Section: Datos Generales**
        - Aduana (Select)
        - Patente (Input)
        - Fecha Pago (Date)
    - **Section: Proveedor/Destinatario**
        - Tax ID (Input)
        - Nombre (Input)
        - Dirección (Textarea)
    - **Section: Transporte**
        - Medio (Select)
        - ID Transporte (Input)

#### Tab: Partidas
- **Table:** List of line items (Mercancías)
- **Columns:** Fracción Arancelaria | Descripción | Cantidad | UMT | Valor Unitario | Valor Total | Origen
- **Actions:** [Button] + Agregar Partida (opens Modal)

#### Tab: Anexos
- **Card:** Anexo 24 Status (Compliance Check)
- **Card:** Anexo 31 Status (Saldo descargado?)
- **List:** Linked inventory movements.

## Visual Notes
- Use standard shadcn `Tabs` component.
- Forms should use `Grid` for alignment.
- Validation errors should appear inline below inputs.
