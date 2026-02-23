# HAGO PRODUCE — Contratos de API (REST)

---

## Convenciones generales

### Base URL
```
Production:  https://api.hagoproduce.com/v1
Development: http://localhost:3000/api/v1
```

### Autenticación
Todas las rutas (excepto `/auth/login` y `/auth/register`) requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

### Formato de respuesta estándar

**Éxito:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo 'email' es obligatorio.",
    "details": [
      { "field": "email", "message": "Required" }
    ]
  }
}
```

### Paginación
Todos los endpoints de listado soportan:
- `?page=1` — Número de página (default: 1).
- `?per_page=20` — Elementos por página (default: 20, max: 100).

### Filtrado
Los endpoints de listado soportan filtros como query params:
- `?status=pending` — Filtro por estado.
- `?search=pineapple` — Búsqueda por texto.
- `?date_from=2025-01-01&date_to=2025-12-31` — Rango de fechas.

### Ordenamiento
- `?sort_by=created_at&sort_order=desc` — Campo y dirección de ordenamiento.

### Códigos HTTP utilizados
| Código | Significado |
|--------|------------|
| 200 | OK — Solicitud exitosa |
| 201 | Created — Recurso creado |
| 204 | No Content — Eliminación exitosa |
| 400 | Bad Request — Error de validación |
| 401 | Unauthorized — Token inválido o ausente |
| 403 | Forbidden — Sin permisos para esta acción |
| 404 | Not Found — Recurso no encontrado |
| 409 | Conflict — Conflicto (ej: duplicado) |
| 422 | Unprocessable Entity — Datos válidos pero no procesables |
| 500 | Internal Server Error — Error del servidor |

---

## 1. Auth Module

### `POST /auth/login`
Inicia sesión y devuelve un token JWT.

**Acceso:** Público.

**Request body:**
```json
{
  "email": "admin@hagoproduce.com",
  "password": "securePassword123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "uuid-123",
      "email": "admin@hagoproduce.com",
      "first_name": "Said",
      "last_name": "Hadad",
      "role": "admin",
      "language": "es"
    }
  }
}
```

### `POST /auth/refresh`
Renueva el token de acceso.

**Request body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### `GET /auth/me`
Devuelve el perfil del usuario autenticado.

**Acceso:** Cualquier usuario autenticado.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "email": "admin@hagoproduce.com",
    "first_name": "Said",
    "last_name": "Hadad",
    "role": "admin",
    "language": "es",
    "is_active": true,
    "last_login_at": "2025-06-15T10:30:00Z"
  }
}
```

### `POST /auth/customer-login`
Login para clientes externos (portal de clientes).

**Acceso:** Público.

**Request body:**
```json
{
  "tax_id": "123456789",
  "password": "clientPassword"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "customer": {
      "id": "uuid-456",
      "company_name": "Fresh Foods Inc.",
      "tax_id": "123456789"
    }
  }
}
```

---

## 2. Users Module

### `GET /users`
Lista todos los usuarios internos.

**Acceso:** `admin` solamente.

**Query params:** `?page=1&per_page=20&role=accounting&is_active=true`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "email": "admin@hagoproduce.com",
      "first_name": "Said",
      "last_name": "Hadad",
      "role": "admin",
      "is_active": true,
      "last_login_at": "2025-06-15T10:30:00Z",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 6, "total_pages": 1 }
}
```

### `POST /users`
Crea un nuevo usuario interno.

**Acceso:** `admin` solamente.

**Request body:**
```json
{
  "email": "contador@hagoproduce.com",
  "password": "tempPassword123",
  "first_name": "María",
  "last_name": "López",
  "role": "accounting",
  "language": "es"
}
```

### `PUT /users/:id`
Actualiza un usuario.

**Acceso:** `admin` o el propio usuario (solo sus datos personales).

### `DELETE /users/:id`
Desactiva un usuario (soft delete: `is_active = false`).

**Acceso:** `admin` solamente.

---

## 3. Customers Module

### `GET /customers`
Lista todos los clientes.

**Acceso:** `admin`, `accounting`, `management`.

**Query params:** `?search=fresh&is_active=true&page=1&per_page=20`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-456",
      "tax_id": "123456789",
      "company_name": "Fresh Foods Inc.",
      "contact_name": "John Smith",
      "email": "john@freshfoods.com",
      "phone": "+1-555-0100",
      "city": "Toronto",
      "country": "Canada",
      "is_active": true,
      "created_at": "2025-01-15T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 70, "total_pages": 4 }
}
```

### `POST /customers`
Crea un nuevo cliente.

**Acceso:** `admin`.

**Request body:**
```json
{
  "tax_id": "987654321",
  "company_name": "Organic Market Ltd.",
  "contact_name": "Jane Doe",
  "email": "jane@organicmarket.ca",
  "phone": "+1-555-0200",
  "address_line1": "456 Market St",
  "city": "Vancouver",
  "state_province": "BC",
  "postal_code": "V6B 1A1",
  "country": "Canada"
}
```

### `GET /customers/:id`
Detalle de un cliente.

### `PUT /customers/:id`
Actualiza un cliente.

**Acceso:** `admin`.

### `GET /customers/:id/invoices`
Lista las facturas de un cliente específico.

**Acceso:** `admin`, `accounting`, `management`, o el propio cliente (portal).

**Query params:** `?status=pending&date_from=2025-01-01&date_to=2025-12-31`

### `GET /customers/:id/statement`
Estado de cuenta del cliente (resumen de facturas pendientes y pagadas).

**Acceso:** `admin`, `accounting`, `management`, o el propio cliente (portal).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid-456",
      "company_name": "Fresh Foods Inc."
    },
    "summary": {
      "total_invoiced": 15000.00,
      "total_paid": 12000.00,
      "total_pending": 3000.00,
      "overdue_amount": 500.00,
      "invoice_count": 25,
      "pending_count": 3,
      "overdue_count": 1
    },
    "pending_invoices": [
      {
        "invoice_number": "INV-2025-0042",
        "issue_date": "2025-06-01",
        "due_date": "2025-07-01",
        "total": 1500.00,
        "status": "pending",
        "days_overdue": 0
      }
    ]
  }
}
```

---

## 4. Suppliers Module

### `GET /suppliers`
Lista todos los proveedores.

**Acceso:** `admin`, `accounting`, `management`.

**Query params:** `?search=tropical&is_active=true`

### `POST /suppliers`
Crea un nuevo proveedor.

**Acceso:** `admin`.

**Request body:**
```json
{
  "name": "Tropical Fruits Co.",
  "contact_name": "Carlos Pérez",
  "email": "carlos@tropicalfruits.com",
  "phone": "+1-555-0300",
  "address": "789 Fruit Ave, Miami, FL"
}
```

### `PUT /suppliers/:id`
Actualiza un proveedor.

### `GET /suppliers/:id`
Detalle de un proveedor con sus productos y precios.

---

## 5. Products Module

### `GET /products`
Lista todos los productos.

**Acceso:** `admin`, `accounting`, `management`.

**Query params:** `?search=pineapple&category=frutas&is_active=true&page=1&per_page=50`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-789",
      "name": "Pineapple",
      "name_es": "Piña",
      "description": "Fresh tropical pineapple",
      "category": "frutas",
      "unit": "case",
      "sku": "FRU-PIN-001",
      "is_active": true,
      "best_price": {
        "supplier_name": "Tropical Fruits Co.",
        "cost_price": 12.50,
        "currency": "CAD"
      },
      "price_count": 3
    }
  ],
  "meta": { "page": 1, "per_page": 50, "total": 450, "total_pages": 9 }
}
```

### `POST /products`
Crea un nuevo producto.

**Acceso:** `admin`.

**Request body:**
```json
{
  "name": "Avocado",
  "name_es": "Aguacate",
  "description": "Hass avocado, premium quality",
  "category": "frutas",
  "unit": "case",
  "sku": "FRU-AVO-001"
}
```

### `GET /products/:id`
Detalle de un producto con todos sus precios por proveedor.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-789",
    "name": "Pineapple",
    "name_es": "Piña",
    "description": "Fresh tropical pineapple",
    "category": "frutas",
    "unit": "case",
    "sku": "FRU-PIN-001",
    "is_active": true,
    "prices": [
      {
        "id": "uuid-price-1",
        "supplier": { "id": "uuid-sup-1", "name": "Tropical Fruits Co." },
        "cost_price": 12.50,
        "sell_price": 18.00,
        "currency": "CAD",
        "effective_date": "2025-06-01",
        "is_current": true,
        "source": "make_automation"
      },
      {
        "id": "uuid-price-2",
        "supplier": { "id": "uuid-sup-2", "name": "Pacific Produce" },
        "cost_price": 13.75,
        "sell_price": 19.00,
        "currency": "CAD",
        "effective_date": "2025-06-01",
        "is_current": true,
        "source": "make_automation"
      }
    ]
  }
}
```

### `PUT /products/:id`
Actualiza un producto.

### `DELETE /products/:id`
Soft delete de un producto.

---

## 6. Product Prices Module

### `GET /product-prices`
Lista precios con filtros.

**Query params:** `?product_id=uuid&supplier_id=uuid&is_current=true`

### `POST /product-prices`
Crea o actualiza un precio para un producto-proveedor.

**Acceso:** `admin`.

**Request body:**
```json
{
  "product_id": "uuid-789",
  "supplier_id": "uuid-sup-1",
  "cost_price": 12.50,
  "sell_price": 18.00,
  "currency": "CAD",
  "effective_date": "2025-06-15"
}
```

**Lógica:** Al crear un nuevo precio, el anterior para el mismo producto-proveedor se marca como `is_current = false`.

### `POST /product-prices/bulk-update`
Actualización masiva de precios (usado por Make.com via webhook).

**Acceso:** API Key (webhook) o `admin`.

**Request body:**
```json
{
  "source": "make_automation",
  "prices": [
    {
      "product_name": "Pineapple",
      "supplier_name": "Tropical Fruits Co.",
      "cost_price": 12.50,
      "currency": "CAD"
    },
    {
      "product_name": "Avocado",
      "supplier_name": "Pacific Produce",
      "cost_price": 8.75,
      "currency": "CAD"
    }
  ]
}
```

**Lógica:**
1. Busca producto por nombre (fuzzy match si es necesario).
2. Busca proveedor por nombre (crea si no existe, según configuración).
3. Crea nuevo registro de precio, marca anteriores como `is_current = false`.
4. Devuelve resumen de procesamiento.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "processed": 2,
    "created": 1,
    "updated": 1,
    "errors": 0,
    "details": [
      { "product": "Pineapple", "supplier": "Tropical Fruits Co.", "status": "updated" },
      { "product": "Avocado", "supplier": "Pacific Produce", "status": "created" }
    ]
  }
}
```

---

## 7. Invoices Module

### `GET /invoices`
Lista facturas con filtros avanzados.

**Acceso:** `admin`, `accounting`, `management`.

**Query params:**
- `?status=pending` — Filtro por estado.
- `?customer_id=uuid` — Filtro por cliente.
- `?search=INV-2025` — Búsqueda por número de factura.
- `?date_from=2025-01-01&date_to=2025-12-31` — Rango de fechas de emisión.
- `?due_before=2025-07-01` — Facturas con vencimiento antes de una fecha.
- `?overdue=true` — Solo facturas vencidas.
- `?sort_by=due_date&sort_order=asc`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-inv-1",
      "invoice_number": "INV-2025-0042",
      "customer": {
        "id": "uuid-456",
        "company_name": "Fresh Foods Inc."
      },
      "status": "pending",
      "issue_date": "2025-06-01",
      "due_date": "2025-07-01",
      "subtotal": 1327.50,
      "tax_amount": 172.58,
      "total": 1500.08,
      "currency": "CAD",
      "items_count": 5,
      "notes_count": 2,
      "created_by": {
        "id": "uuid-123",
        "first_name": "Said",
        "last_name": "Hadad"
      },
      "created_at": "2025-06-01T08:30:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 150, "total_pages": 8 }
}
```

### `POST /invoices`
Crea una nueva factura.

**Acceso:** `admin`.

**Request body:**
```json
{
  "customer_id": "uuid-456",
  "issue_date": "2025-06-15",
  "due_date": "2025-07-15",
  "tax_rate": 0.13,
  "currency": "CAD",
  "payment_terms": "Net 30",
  "notes_public": "Thank you for your business!",
  "items": [
    {
      "product_id": "uuid-789",
      "description": "Pineapple - Fresh, Case of 8",
      "quantity": 10,
      "unit_price": 18.00
    },
    {
      "product_id": "uuid-790",
      "description": "Avocado - Hass, Case of 48",
      "quantity": 5,
      "unit_price": 32.00
    },
    {
      "product_id": null,
      "description": "Delivery fee",
      "quantity": 1,
      "unit_price": 25.00
    }
  ]
}
```

**Lógica:**
1. Genera `invoice_number` automáticamente (siguiente en secuencia).
2. Calcula `line_total` para cada item.
3. Calcula `subtotal`, `tax_amount`, `total`.
4. Estado inicial: `draft`.
5. Registra en `audit_log`.

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-inv-new",
    "invoice_number": "INV-2025-0043",
    "status": "draft",
    "subtotal": 365.00,
    "tax_amount": 47.45,
    "total": 412.45,
    "items": [ ... ],
    "created_at": "2025-06-15T09:00:00Z"
  }
}
```

### `GET /invoices/:id`
Detalle completo de una factura (con items, notas, historial de estados).

### `PUT /invoices/:id`
Actualiza una factura (solo si está en estado `draft`).

**Acceso:** `admin`.

### `PATCH /invoices/:id/status`
Cambia el estado de una factura.

**Acceso:** `admin`, `accounting`.

**Request body:**
```json
{
  "status": "sent",
  "reason": "Enviada al cliente por email"
}
```

**Validaciones de transición de estado:**
```
draft    → sent, cancelled
sent     → pending, cancelled
pending  → paid, cancelled
paid     → (terminal - no se puede cambiar)
cancelled → (terminal - no se puede cambiar)
```

**Lógica:**
1. Valida que la transición sea permitida.
2. Actualiza el estado.
3. Crea registro en `invoice_status_history`.
4. Dispara notificación si aplica.
5. Registra en `audit_log`.

### `DELETE /invoices/:id`
Soft delete (solo si está en `draft` o `cancelled`).

**Acceso:** `admin`.

---

## 8. Invoice Notes Module

### `GET /invoices/:id/notes`
Lista las notas internas de una factura.

**Acceso:** `admin`, `accounting`, `management`.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-note-1",
      "content": "Cliente solicitó extensión de plazo. Aprobado por gerencia.",
      "user": {
        "id": "uuid-123",
        "first_name": "María",
        "last_name": "López"
      },
      "created_at": "2025-06-10T14:30:00Z"
    }
  ]
}
```

### `POST /invoices/:id/notes`
Añade una nota interna a una factura.

**Acceso:** `admin`, `accounting`.

**Request body:**
```json
{
  "content": "Pago parcial recibido: $500 CAD. Pendiente: $1000 CAD."
}
```

---

## 9. Chat / Agent Module

### `POST /chat/query`
Envía una consulta en lenguaje natural al agente.

**Acceso:** `admin`, `accounting`, `management`.

**Request body:**
```json
{
  "message": "¿Cuál es el mejor precio para pineapple?",
  "language": "es"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "response": "El mejor precio actual para Pineapple (Piña) es de $12.50 CAD por case, ofrecido por Tropical Fruits Co. Otros proveedores: Pacific Produce a $13.75 CAD, Global Fruits a $14.00 CAD.",
    "sources": [
      {
        "type": "product_price",
        "product": "Pineapple",
        "supplier": "Tropical Fruits Co.",
        "cost_price": 12.50,
        "currency": "CAD"
      },
      {
        "type": "product_price",
        "product": "Pineapple",
        "supplier": "Pacific Produce",
        "cost_price": 13.75,
        "currency": "CAD"
      }
    ],
    "intent": "price_lookup",
    "confidence": 0.95
  }
}
```

**Tipos de consultas soportadas (intents):**

| Intent | Ejemplo | Fuente de datos |
|--------|---------|----------------|
| `price_lookup` | "¿Precio de pineapple?" | `product_prices` + `products` + `suppliers` |
| `best_supplier` | "¿Quién tiene el mejor costo para avocado?" | `product_prices` (MIN cost_price WHERE is_current) |
| `invoice_status` | "Estado de la factura INV-2025-0042" | `invoices` |
| `customer_balance` | "¿Cuánto debe Fresh Foods?" | `invoices` (SUM pending) |
| `product_info` | "¿Qué categoría es el mango?" | `products` |
| `general` | Cualquier otra consulta | Respuesta genérica o "No tengo esa información" |

---

## 10. Webhooks Module (Make.com Integration)

### `POST /webhooks/make/prices`
Recibe actualizaciones de precios desde Make.com.

**Autenticación:** API Key en header `X-API-Key: <key>`.

**Request body:** (mismo formato que `POST /product-prices/bulk-update`)
```json
{
  "source": "make_automation",
  "timestamp": "2025-06-15T06:00:00Z",
  "prices": [
    {
      "product_name": "Pineapple",
      "supplier_name": "Tropical Fruits Co.",
      "cost_price": 12.50,
      "currency": "CAD"
    }
  ]
}
```

### `POST /webhooks/make/suppliers`
Recibe nuevos proveedores o actualizaciones desde Make.com.

**Request body:**
```json
{
  "source": "make_automation",
  "suppliers": [
    {
      "name": "New Supplier Inc.",
      "contact_name": "Bob",
      "email": "bob@newsupplier.com",
      "phone": "+1-555-0400"
    }
  ]
}
```

---

## 11. Notifications Module

### `GET /notifications`
Lista el log de notificaciones enviadas.

**Acceso:** `admin`, `accounting`.

**Query params:** `?type=overdue&status=sent&customer_id=uuid`

### `POST /notifications/send`
Envía una notificación manual.

**Acceso:** `admin`.

**Request body:**
```json
{
  "channel": "whatsapp",
  "recipient": "+1-555-0100",
  "invoice_id": "uuid-inv-1",
  "customer_id": "uuid-456",
  "message": "Reminder: Invoice INV-2025-0042 is due on July 1, 2025. Amount: $1,500.08 CAD."
}
```

---

## 12. Reports Module (V2)

> Estos endpoints se implementarán en la Fase 2.

### `GET /reports/invoices-summary`
Resumen de facturación por período.

### `GET /reports/aging`
Reporte de antigüedad de cuentas por cobrar.

### `GET /reports/revenue`
Ingresos por período, cliente, producto.

### `GET /reports/export`
Exportación de datos en CSV o PDF.

---

## Matriz de permisos por rol

| Endpoint | Admin | Accounting | Management | Customer (portal) |
|----------|-------|------------|------------|-------------------|
| `POST /auth/login` | ✅ | ✅ | ✅ | — |
| `POST /auth/customer-login` | — | — | — | ✅ |
| `GET /users` | ✅ | ❌ | ❌ | ❌ |
| `POST /users` | ✅ | ❌ | ❌ | ❌ |
| `GET /customers` | ✅ | ✅ | ✅ | ❌ |
| `POST /customers` | ✅ | ❌ | ❌ | ❌ |
| `GET /customers/:id/invoices` | ✅ | ✅ | ✅ | ✅ (solo propias) |
| `GET /customers/:id/statement` | ✅ | ✅ | ✅ | ✅ (solo propia) |
| `GET /suppliers` | ✅ | ✅ | ✅ | ❌ |
| `POST /suppliers` | ✅ | ❌ | ❌ | ❌ |
| `GET /products` | ✅ | ✅ | ✅ | ❌ |
| `POST /products` | ✅ | ❌ | ❌ | ❌ |
| `GET /product-prices` | ✅ | ✅ | ✅ | ❌ |
| `POST /product-prices` | ✅ | ❌ | ❌ | ❌ |
| `POST /product-prices/bulk-update` | ✅ | ❌ | ❌ | ❌ |
| `GET /invoices` | ✅ | ✅ | ✅ | ❌ |
| `POST /invoices` | ✅ | ❌ | ❌ | ❌ |
| `PUT /invoices/:id` | ✅ | ❌ | ❌ | ❌ |
| `PATCH /invoices/:id/status` | ✅ | ✅ | ❌ | ❌ |
| `DELETE /invoices/:id` | ✅ | ❌ | ❌ | ❌ |
| `GET /invoices/:id/notes` | ✅ | ✅ | ✅ | ❌ |
| `POST /invoices/:id/notes` | ✅ | ✅ | ❌ | ❌ |
| `POST /chat/query` | ✅ | ✅ | ✅ | ❌ |
| `POST /webhooks/make/*` | API Key | — | — | — |
| `GET /notifications` | ✅ | ✅ | ❌ | ❌ |
| `POST /notifications/send` | ✅ | ❌ | ❌ | ❌ |
| `GET /reports/*` (V2) | ✅ | ✅ | ✅ | ❌ |