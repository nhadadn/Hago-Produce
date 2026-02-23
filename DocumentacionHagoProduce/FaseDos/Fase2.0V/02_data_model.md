# HAGO PRODUCE — Modelo de Datos (ERD)

---

## Visión general del modelo

El modelo de datos está diseñado para soportar todas las funcionalidades del MVP (V1) y ser extensible para fases posteriores. Se usa PostgreSQL como motor de base de datos.

### Convenciones
- Todos los IDs son `UUID` (generados automáticamente).
- Todas las tablas incluyen `created_at` y `updated_at` (timestamps con timezone).
- Se usa `soft delete` (`deleted_at`) en entidades críticas (facturas, clientes, productos).
- Los nombres de tablas y columnas siguen `snake_case`.
- Las relaciones se definen con foreign keys y constraints.

---

## Entidades principales

### 1. `users` — Usuarios internos del sistema

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK, default gen_random_uuid() | Identificador único |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Correo electrónico (login) |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash de contraseña (si no se usa OAuth) |
| `first_name` | VARCHAR(100) | NOT NULL | Nombre |
| `last_name` | VARCHAR(100) | NOT NULL | Apellido |
| `role` | ENUM('admin','accounting','management') | NOT NULL, DEFAULT 'admin' | Rol del usuario |
| `language` | ENUM('es','en') | NOT NULL, DEFAULT 'en' | Idioma preferido |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Estado activo/inactivo |
| `last_login_at` | TIMESTAMPTZ | NULL | Último inicio de sesión |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Última actualización |

**Índices:** `email` (unique).

---

### 2. `customers` — Clientes externos

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identificador único |
| `tax_id` | VARCHAR(50) | UNIQUE, NOT NULL | Tax ID / RFC / NIT |
| `company_name` | VARCHAR(255) | NOT NULL | Nombre de la empresa |
| `contact_name` | VARCHAR(255) | NULL | Nombre del contacto principal |
| `email` | VARCHAR(255) | NULL | Correo electrónico |
| `phone` | VARCHAR(50) | NULL | Teléfono |
| `address_line1` | VARCHAR(255) | NULL | Dirección línea 1 |
| `address_line2` | VARCHAR(255) | NULL | Dirección línea 2 |
| `city` | VARCHAR(100) | NULL | Ciudad |
| `state_province` | VARCHAR(100) | NULL | Estado/Provincia |
| `postal_code` | VARCHAR(20) | NULL | Código postal |
| `country` | VARCHAR(100) | NOT NULL, DEFAULT 'Canada' | País |
| `payment_terms_days` | INTEGER | NULL, DEFAULT 30 | Días de plazo de pago (para V2) |
| `notes` | TEXT | NULL | Notas generales sobre el cliente |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Estado activo/inactivo |
| `portal_password_hash` | VARCHAR(255) | NULL | Hash de contraseña para portal de clientes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Última actualización |
| `deleted_at` | TIMESTAMPTZ | NULL | Soft delete |

**Índices:** `tax_id` (unique), `company_name`, `email`.

---

### 3. `suppliers` — Proveedores

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identificador único |
| `name` | VARCHAR(255) | NOT NULL, UNIQUE | Nombre del proveedor |
| `contact_name` | VARCHAR(255) | NULL | Contacto principal |
| `email` | VARCHAR(255) | NULL | Correo electrónico |
| `phone` | VARCHAR(50) | NULL | Teléfono |
| `address` | TEXT | NULL | Dirección completa |
| `notes` | TEXT | NULL | Notas sobre el proveedor |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Estado activo/inactivo |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Última actualización |

**Índices:** `name` (unique).

---

### 4. `products` — Catálogo de productos

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identificador único |
| `name` | VARCHAR(255) | NOT NULL | Nombre del producto (ej: "Pineapple", "Almonds") |
| `name_es` | VARCHAR(255) | NULL | Nombre en español |
| `description` | TEXT | NULL | Descripción del producto |
| `category` | VARCHAR(100) | NULL | Categoría (frutas, verduras, frutos secos) |
| `unit` | VARCHAR(50) | NOT NULL, DEFAULT 'unit' | Unidad de medida (kg, lb, unit, box, case) |
| `sku` | VARCHAR(100) | NULL, UNIQUE | Código SKU interno |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Estado activo/inactivo |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Última actualización |
| `deleted_at` | TIMESTAMPTZ | NULL | Soft delete |

**Índices:** `name`, `sku` (unique), `category`, `is_active`.

---

### 5. `product_prices` — Precios por producto-proveedor

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identificador único |
| `product_id` | UUID | FK → products.id, NOT NULL | Producto |
| `supplier_id` | UUID | FK → suppliers.id, NOT NULL | Proveedor |
| `cost_price` | DECIMAL(12,4) | NOT NULL | Precio de costo del proveedor |
| `sell_price` | DECIMAL(12,4) | NULL | Precio de venta sugerido |
| `currency` | VARCHAR(3) | NOT NULL, DEFAULT 'CAD' | Moneda (CAD, USD, MXN) |
| `effective_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | Fecha desde la que aplica este precio |
| `expiry_date` | DATE | NULL | Fecha de expiración del precio (NULL = vigente) |
| `source` | VARCHAR(50) | NULL, DEFAULT 'manual' | Origen del dato: 'manual', 'make_automation', 'import' |
| `is_current` | BOOLEAN | NOT NULL, DEFAULT true | Indica si es el precio vigente |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Última actualización |

**Índices:** `(product_id, supplier_id, is_current)` (composite), `product_id`, `supplier_id`, `is_current`.
**Constraint:** `UNIQUE(product_id, supplier_id, effective_date)` — un solo precio por producto-proveedor-fecha.

---

### 6. `invoices` — Facturas

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identificador único |
| `invoice_number` | VARCHAR(50) | UNIQUE, NOT NULL | Número de factura (ej: INV-2025-0001) |
| `customer_id` | UUID | FK → customers.id, NOT NULL | Cliente al que se factura |
| `created_by_user_id` | UUID | FK → users.id, NOT NULL | Usuario que creó la factura |
| `status` | ENUM('draft','sent','pending','paid','cancelled') | NOT NULL, DEFAULT 'draft' | Estado de la factura |
| `issue_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | Fecha de emisión |
| `due_date` | DATE | NULL | Fecha de vencimiento |
| `subtotal` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Subtotal antes de impuestos |
| `tax_rate` | DECIMAL(5,4) | NOT NULL, DEFAULT 0 | Tasa de impuesto (ej: 0.13 para 13% HST) |
| `tax_amount` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Monto de impuesto calculado |
| `total` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Total de la factura |
| `currency` | VARCHAR(3) | NOT NULL, DEFAULT 'CAD' | Moneda |
| `payment_terms` | VARCHAR(100) | NULL | Términos de pago (texto libre) |
| `notes_public` | TEXT | NULL | Notas visibles al cliente en la factura |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Última actualización |
| `deleted_at` | TIMESTAMPTZ | NULL | Soft delete |

**Índices:** `invoice_number` (unique), `customer_id`, `status`, `issue_date`, `due_date`, `created_by_user_id`.

**Nota sobre estados:**
- `draft` → Borrador (en edición, no enviada).
- `sent` → Enviada al cliente.
- `pending` → Pendiente de pago (confirmada por contabilidad).
- `paid` → Liquidada / Pagada.
- `cancelled` → Cancelada.

---

### 7. `invoice_items` — Líneas de detalle de factura

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identificador único |
| `invoice_id` | UUID | FK → invoices.id, NOT NULL, ON DELETE CASCADE | Factura padre |
| `product_id` | UUID | FK → products.id, NULL | Producto (NULL si es línea libre) |
| `description` | VARCHAR(500) | NOT NULL | Descripción de la línea |
| `quantity` | DECIMAL(12,4) | NOT NULL | Cantidad |
| `unit_price` | DECIMAL(12,4) | NOT NULL | Precio unitario |
| `line_total` | DECIMAL(12,2) | NOT NULL | Total de la línea (quantity × unit_price) |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | Orden de aparición en la factura |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Última actualización |

**Índices:** `invoice_id`, `product_id`.

---

### 8. `invoice_notes` — Notas internas por factura

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identificador único |
| `invoice_id` | UUID | FK → invoices.id, NOT NULL, ON DELETE CASCADE | Factura asociada |
| `user_id` | UUID | FK → users.id, NOT NULL | Usuario que escribió la nota |
| `content` | TEXT | NOT NULL | Contenido de la nota |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |

**Índices:** `invoice_id`, `user_id`.

> **Importante:** Estas notas son **solo internas** y nunca se muestran al cliente externo.

---

### 9. `invoice_status_history` — Historial de cambios de estado

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identificador único |
| `invoice_id` | UUID | FK → invoices.id, NOT NULL, ON DELETE CASCADE | Factura |
| `previous_status` | VARCHAR(20) | NULL | Estado anterior |
| `new_status` | VARCHAR(20) | NOT NULL | Nuevo estado |
| `changed_by_user_id` | UUID | FK → users.id, NOT NULL | Usuario que realizó el cambio |
| `reason` | TEXT | NULL | Razón del cambio (opcional) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha del cambio |

**Índices:** `invoice_id`, `changed_by_user_id`, `created_at`.

---

### 10. `notifications_log` — Log de notificaciones enviadas

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identificador único |
| `type` | VARCHAR(50) | NOT NULL | Tipo: 'status_change', 'due_date_reminder', 'overdue' |
| `channel` | VARCHAR(20) | NOT NULL | Canal: 'whatsapp', 'telegram', 'email' |
| `recipient` | VARCHAR(255) | NOT NULL | Destinatario (número, email, etc.) |
| `invoice_id` | UUID | FK → invoices.id, NULL | Factura relacionada (si aplica) |
| `customer_id` | UUID | FK → customers.id, NULL | Cliente relacionado |
| `message` | TEXT | NOT NULL | Contenido del mensaje enviado |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Estado: 'pending', 'sent', 'failed' |
| `sent_at` | TIMESTAMPTZ | NULL | Fecha de envío exitoso |
| `error_message` | TEXT | NULL | Mensaje de error (si falló) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de creación |

**Índices:** `invoice_id`, `customer_id`, `type`, `status`.

---

### 11. `audit_log` — Log de auditoría general

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | UUID | PK | Identificador único |
| `user_id` | UUID | FK → users.id, NULL | Usuario que realizó la acción |
| `action` | VARCHAR(50) | NOT NULL | Acción: 'create', 'update', 'delete', 'status_change', 'login' |
| `entity_type` | VARCHAR(50) | NOT NULL | Tipo de entidad: 'invoice', 'product', 'customer', etc. |
| `entity_id` | UUID | NOT NULL | ID de la entidad afectada |
| `changes` | JSONB | NULL | Detalle de los cambios (campo anterior → nuevo) |
| `ip_address` | VARCHAR(45) | NULL | IP del usuario |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Fecha de la acción |

**Índices:** `user_id`, `entity_type`, `entity_id`, `action`, `created_at`.

---

## Diagrama de relaciones (ERD textual)

```
users (1) ──────────── (N) invoices          [created_by_user_id]
users (1) ──────────── (N) invoice_notes     [user_id]
users (1) ──────────── (N) invoice_status_history [changed_by_user_id]
users (1) ──────────── (N) audit_log         [user_id]

customers (1) ─────── (N) invoices           [customer_id]
customers (1) ─────── (N) notifications_log  [customer_id]

suppliers (1) ─────── (N) product_prices     [supplier_id]

products (1) ──────── (N) product_prices     [product_id]
products (1) ──────── (N) invoice_items      [product_id]

invoices (1) ──────── (N) invoice_items      [invoice_id]
invoices (1) ──────── (N) invoice_notes      [invoice_id]
invoices (1) ──────── (N) invoice_status_history [invoice_id]
invoices (1) ──────── (N) notifications_log  [invoice_id]
```

---

## Notas de diseño

### Numeración automática de facturas
Se recomienda usar una secuencia con formato: `INV-{YYYY}-{NNNN}` (ej: `INV-2025-0001`).
Implementar como función de base de datos o lógica de backend para garantizar unicidad y secuencialidad.

### Precios históricos
La tabla `product_prices` con `effective_date` y `is_current` permite:
- Mantener historial de precios por proveedor.
- Consultar el precio vigente rápidamente (`WHERE is_current = true`).
- En V2, generar gráficos de tendencia de costos.

### Multi-idioma
Los productos tienen `name` (inglés) y `name_es` (español). Para V2, se puede implementar una tabla de traducciones más robusta si se necesitan más idiomas.

### Soft delete
Las entidades críticas (`customers`, `products`, `invoices`) usan `deleted_at` para soft delete, permitiendo recuperación y cumplimiento de auditoría.