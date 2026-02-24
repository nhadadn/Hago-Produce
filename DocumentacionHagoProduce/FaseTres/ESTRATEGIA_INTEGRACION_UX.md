# 🎯 ESTRATEGIA DE INTEGRACIÓN Y MEJORAS DE UX
## Hago Produce | Sprint 3 Refinado | Facturación Inteligente y Órdenes de Compra

> **Fecha:** 2026-02-23  
> **Objetivo:** Definir estrategia de integración técnica y mejoras de experiencia de usuario  
> **Enfoque:** Implementaciones internas, UX optimizada, productización

---

## 1. ESTRATEGIA DE INTEGRACIÓN TÉCNICA

### 1.1 Decisiones de Arquitectura

#### 1.1.1 Principios Rectores

1. **Priorizar implementaciones internas sobre Make.com**
   - Mayor control y debugging
   - Menor latencia (sin llamadas externas)
   - Costos reducidos
   - Testing más sencillo
   - Mejor monitoreo

2. **Usar Make.com solo cuando sea necesario**
   - Integraciones con sistemas externos complejos (QuickBooks, ERP legacy)
   - Automatizaciones que requieren lógica visual/no-code
   - Procesos que necesitan ser modificados por usuarios no técnicos

3. **Servicios reutilizables**
   - Email service unificado para facturas, órdenes y notificaciones
   - Telegram service para envío de documentos
   - WhatsApp service ya implementado (reutilizar)

#### 1.1.2 Matriz de Decisión

| Funcionalidad | Implementación Interna | Make.com | Justificación |
|--------------|------------------------|----------|---------------|
| **Envío de facturas por Email** | ✅ Recomendado | ❌ | API simple, control total, sin dependencias |
| **Envío de facturas por WhatsApp** | ✅ Ya implementado | ❌ | Ya integrado en Sprint 2, funciona perfectamente |
| **Envío de facturas por Telegram** | ✅ Recomendado | ❌ | API simple, gratuita, sin dependencias |
| **Sugerencia de mejores proveedores** | ✅ Recomendado | ❌ | Lógica de negocio core, requiere queries complejas |
| **Creación de órdenes de compra** | ✅ Recomendado | ❌ | Flujo crítico de negocio, requiere validaciones |
| **Envío de órdenes a proveedores** | ✅ Recomendado | ❌ | Reutilizar servicios de comunicación existentes |
| **Generación de PDF de facturas** | ✅ Recomendado | ❌ | Ya existe lógica en `export.ts`, sin dependencias |
| **Notificaciones de estado** | ✅ Ya implementado | ❌ | Servicio de notificaciones listo y probado |
| **Integración con QuickBooks** | ❌ | ✅ | Sistema externo complejo, requiere OAuth2 |
| **Integración con ERP legacy** | ❌ | ✅ | Sistema externo propietario, requiere adaptadores |

### 1.2 Servicios de Comunicación

#### 1.2.1 Servicio de Email Unificado (S3-P07)

**Arquitectura:**
```
src/lib/services/email.service.ts
├── Configuración: SendGrid o Resend (configurable)
├── Funciones principales:
│   ├── sendEmail(to, subject, htmlContent, attachments?)
│   ├── sendInvoiceEmail(customerEmail, invoiceNumber, pdfBuffer, customerName)
│   ├── sendPurchaseOrderEmail(supplierEmail, orderNumber, pdfBuffer, supplierName)
│   └── sendNotificationEmail(to, subject, message)
├── Templates HTML:
│   ├── src/lib/services/email/templates/invoice.html
│   ├── src/lib/services/email/templates/purchase-order.html
│   └── src/lib/services/email/templates/notification.html
└── Manejo de errores:
    ├── Reintentos con exponential backoff (1s, 2s, 4s)
    ├── Máximo 3 reintentos
    └── Logging detallado de cada intento
```

**Flujo de envío:**
```
Usuario confirma factura
    ↓
createInvoiceFromOrder()
    ↓
Generar PDF de factura
    ↓
Determinar canal de envío (Email)
    ↓
emailService.sendInvoiceEmail()
    ↓
[Intento 1] → ¿Éxito? → Sí → Retornar success
    ↓ No
[Intento 2] → ¿Éxito? → Sí → Retornar success
    ↓ No
[Intento 3] → ¿Éxito? → Sí → Retornar success
    ↓ No
Retornar error con detalles
    ↓
Fallback: Intentar enviar por WhatsApp
```

**Variables de entorno:**
```env
EMAIL_PROVIDER=resend  # o sendgrid
RESEND_API_KEY=re_xxxxxxxx
SENDGRID_API_KEY=SG.xxxxxxxx
EMAIL_FROM=noreply@hagoproduce.ca
EMAIL_FROM_NAME=HAGO PRODUCE
```

**Proveedores soportados:**

| Proveedor | Plan Gratuito | Límites | Costo | Recomendación |
|-----------|---------------|---------|-------|---------------|
| **Resend** | 3,000 emails/mes | 100 emails/día | $0/mes | ✅ Recomendado |
| **SendGrid** | 100 emails/día | 100 emails/día | $0/mes | ⚠️ Limitado |

**Recomendación:** Usar Resend por su plan gratuito más generoso.

#### 1.2.2 Servicio de Telegram (S3-P08)

**Arquitectura:**
```
src/lib/services/telegram.service.ts
├── Configuración: Telegram Bot API
├── Funciones principales:
│   ├── sendMessage(chatId, text, parseMode?)
│   ├── sendDocument(chatId, fileBuffer, filename, caption?)
│   ├── sendInvoiceDocument(chatId, invoiceNumber, pdfBuffer, customerName)
│   ├── sendPurchaseOrderDocument(chatId, orderNumber, pdfBuffer, supplierName)
│   └── sendNotification(chatId, message)
├── Manejo de chat IDs:
│   ├── linkTelegramChat(customerId, chatId)
│   ├── getCustomerChatId(customerId)
│   └── validateChatId(chatId)
└── Webhook (opcional):
    └── src/app/api/v1/bot/webhook/telegram/route.ts
```

**Flujo de vinculación de chat ID:**
```
Cliente inicia chat con bot de Telegram
    ↓
Bot envía mensaje: "Bienvenido. Por favor identifícate con tu email de cliente."
    ↓
Cliente responde con email
    ↓
Webhook recibe mensaje
    ↓
Buscar cliente por email en DB
    ↓
Si encontrado → Guardar telegramChatId en Customer
    ↓
Bot confirma: "Vinculado exitosamente. Ahora recibirás facturas por Telegram."
```

**Variables de entorno:**
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_SECRET=secret_token
```

**API Endpoints utilizados:**
- `sendMessage`: https://api.telegram.org/bot{token}/sendMessage
- `sendDocument`: https://api.telegram.org/bot{token}/sendDocument
- `getUpdates`: https://api.telegram.org/bot{token}/getUpdates (polling, si no se usa webhook)

**Limitaciones:**
- Tamaño máximo de archivo: 50 MB
- Tamaño máximo de caption: 1,024 caracteres
- Rate limit: 30 mensajes/segundo por bot

#### 1.2.3 Servicio de WhatsApp (Ya Implementado - Sprint 2)

**Arquitectura existente:**
```
src/lib/services/bot/whatsapp.service.ts
├── Configuración: Twilio WhatsApp Business API
├── Funciones principales:
│   ├── sendWhatsAppMessage(to, message)
│   ├── sendWhatsAppDocument(to, fileBuffer, filename, caption?)
│   └── formatWhatsAppNumber(phoneNumber)
└── Validación de firma:
    └── validateWebhookSignature(signature, payload, url)
```

**Reutilización en Sprint 3:**
- Envío de facturas por WhatsApp (ya funcional)
- Envío de órdenes de compra por WhatsApp (reutilizar sendWhatsAppDocument)
- Notificaciones de estado (ya funcional)

### 1.3 Flujo de Facturación Multi-Canal

#### 1.3.1 Diagrama de Flujo Completo

```mermaid
flowchart TD
    A[Usuario: "Crea factura para Tomato King"] --> B[OpenAI Function Calling]
    B --> C{Validar cliente}
    C -->|No encontrado| D[Error con sugerencias]
    C -->|Encontrado| E{Validar productos}
    E -->|No encontrado| F[Error con producto no encontrado]
    E -->|Encontrados| G[Calcular totales]
    G --> H{Determinar canal de envío}
    H -->|Especificado en mensaje| I[Usar canal del mensaje]
    H -->|No especificado| J[Leer preferredChannel del cliente]
    J -->|Cliente tiene preferencia| K[Usar preferencia del cliente]
    J -->|Cliente sin preferencia| L[Usar none no enviar]
    I --> M[Generar orden pendiente]
    K --> M
    L --> M
    M --> N[Mostrar resumen al usuario]
    N --> O{Usuario confirma?}
    O -->|No| P[Cancelar orden]
    O -->|Sí| Q[Crear Invoice DRAFT]
    Q --> R[Actualizar a SENT]
    R --> S[Generar PDF]
    S --> T{Canal de envío}
    T -->|WhatsApp| U[Enviar por Twilio]
    T -->|Email| V[Enviar por Resend/SendGrid]
    T -->|Telegram| W[Enviar por Telegram Bot API]
    U --> X{¿Éxito?}
    V --> X
    W --> X
    X -->|Sí| Y[Registrar en NotificationLog]
    X -->|No| Z[Reintentar 3x con backoff]
    Z --> X
    Y --> AA[Retornar confirmación al usuario]
    AA --> AB[Usuario ve: "Factura INV-2026-0001 enviada por WhatsApp"]
```

#### 1.3.2 Detalle del Flujo de Confirmación

**Paso 1: Extracción de Parámetros (S3-P01-A)**
```typescript
// Usuario: "Crea una factura para Tomato King con 5 cajas de mango, envíala por email"
const params = await extractOrderParams(message, 'es', OPENAI_API_KEY);
// Resultado:
{
  customerName: "Tomato King",
  items: [
    { productName: "mango", quantity: 5, unit: "box" }
  ],
  sendChannel: "email",  // Detectado del mensaje
  notes: null,
  deliveryDate: null,
  deliveryTime: null
}
```

**Paso 2: Validación y Cálculo**
```typescript
// Validar cliente
const customer = await prisma.customer.findFirst({
  where: { name: { contains: params.customerName, mode: 'insensitive' } }
});

// Validar productos y obtener precios
const validatedItems = await Promise.all(
  params.items.map(async (item) => {
    const product = await prisma.product.findFirst({
      where: { name: { contains: item.productName, mode: 'insensitive' } },
      include: { prices: { where: { isCurrent: true } } }
    });
    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: product.prices[0].price,
      totalPrice: item.quantity * product.prices[0].price
    };
  })
);

// Calcular totales
const subtotal = validatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
const taxRate = 0.13;
const taxAmount = subtotal * taxRate;
const total = subtotal + taxAmount;
```

**Paso 3: Determinar Canal de Envío**
```typescript
let sendChannel = params.sendChannel;

// Si no se especificó en el mensaje, usar preferencia del cliente
if (!sendChannel || sendChannel === 'none') {
  sendChannel = customer.preferredChannel || 'none';
}

// Si aún no hay canal, no enviar automáticamente
if (!sendChannel || sendChannel === 'none') {
  sendChannel = null;
}
```

**Paso 4: Generar Orden Pendiente**
```typescript
const pendingOrder = {
  customerId: customer.id,
  items: validatedItems,
  subtotal,
  taxAmount,
  total,
  sendChannel
};

// Guardar en ChatSession
await prisma.chatSession.update({
  where: { id: sessionId },
  data: {
    context: { pendingOrder }
  }
});

// Retornar resumen al usuario
return {
  message: `
    Resumen de factura:
    Cliente: ${customer.name}
    Productos:
    ${validatedItems.map(item => `- ${item.productName}: ${item.quantity} ${item.unit} @ $${item.unitPrice} = $${item.totalPrice}`).join('\n')}
    
    Subtotal: $${subtotal.toFixed(2)}
    Tax (13%): $${taxAmount.toFixed(2)}
    Total: $${total.toFixed(2)}
    
    ${sendChannel ? `Se enviará por ${sendChannel}` : 'No se enviará automáticamente'}
    
    ¿Confirmas crear esta factura?
  `,
  pendingOrder
};
```

**Paso 5: Confirmación y Creación (S3-P01-B)**
```typescript
// Usuario: "Sí, confirmo"
if (intent === 'confirm_order' && chatSession.context.pendingOrder) {
  const { pendingOrder } = chatSession.context;
  
  // Crear Invoice
  const invoice = await prisma.invoice.create({
    data: {
      number: await generateInvoiceNumber(),
      customerId: pendingOrder.customerId,
      status: 'SENT',
      subtotal: pendingOrder.subtotal,
      taxRate: 0.13,
      taxAmount: pendingOrder.taxAmount,
      total: pendingOrder.total,
      items: {
        create: pendingOrder.items.map(item => ({
          productId: item.productId,
          description: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      }
    }
  });
  
  // Generar PDF
  const pdfBuffer = await generateInvoicePDF(invoice.id);
  
  // Enviar por canal especificado
  let sentVia = null;
  if (pendingOrder.sendChannel === 'whatsapp') {
    await whatsappService.sendInvoiceDocument(customer.phone, invoice.number, pdfBuffer, customer.name);
    sentVia = 'whatsapp';
  } else if (pendingOrder.sendChannel === 'email') {
    await emailService.sendInvoiceEmail(customer.email, invoice.number, pdfBuffer, customer.name);
    sentVia = 'email';
  } else if (pendingOrder.sendChannel === 'telegram') {
    await telegramService.sendInvoiceDocument(customer.telegramChatId, invoice.number, pdfBuffer, customer.name);
    sentVia = 'telegram';
  }
  
  // Registrar en logs
  await logAudit({
    userId: session.userId,
    action: 'create',
    entityType: 'invoice',
    entityId: invoice.id
  });
  
  await prisma.notificationLog.create({
    data: {
      customerId: customer.id,
      type: 'invoice_sent',
      channel: sentVia,
      status: 'sent',
      entityId: invoice.id
    }
  });
  
  // Limpiar pendingOrder del contexto
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { context: { pendingOrder: null } }
  });
  
  return {
    message: `
      Factura creada exitosamente:
      Número: ${invoice.number}
      Cliente: ${customer.name}
      Total: $${invoice.total.toFixed(2)}
      Enviada por: ${sentVia}
      
      Puedes ver y editar la factura en el panel de facturas.
    `,
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    sentVia
  };
}
```

### 1.4 Flujo de Órdenes de Compra Inteligentes

#### 1.4.1 Diagrama de Flujo

```mermaid
flowchart TD
    A[Usuario: "Tomato King requiere 15 chiles, 12 manzanas para hoy a las 5pm. Envía a Pedro con mejor proveedor"] --> B[OpenAI Function Calling]
    B --> C[Extraer productos y cantidades]
    C --> D[Para cada producto]
    D --> E[Buscar en DB con ILIKE]
    E --> F{Producto encontrado?}
    F -->|No| G[Error: producto no encontrado]
    F -->|Sí| H[Buscar precios vigentes is_current=true]
    H --> I[Ordenar por price ASC]
    I --> J[Seleccionar mejor proveedor]
    J --> K[Calcular totalPrice]
    K --> L{Más productos?}
    L -->|Sí| D
    L -->|No| M[Agrupar items por proveedor]
    M --> N[Para cada proveedor]
    N --> O[Calcular subtotal, tax, total]
    O --> P[Generar orden pendiente]
    P --> Q{Más proveedores?}
    Q -->|Sí| N
    Q -->|No| R[Mostrar resumen al usuario]
    R --> S[Lista de productos con mejores proveedores y precios]
    S --> T[Total por proveedor]
    T --> U[Total general]
    U --> V{Usuario confirma?}
    V -->|No| W[Cancelar órdenes]
    V -->|Sí| X[Para cada orden pendiente]
    X --> Y[Crear PurchaseOrder DRAFT]
    Y --> Z[Actualizar a SENT]
    Z --> AA[Generar PDF]
    AA --> AB[Enviar por canal preferido del proveedor]
    AB --> AC[Registrar en AuditLog y NotificationLog]
    AC --> AD{Más órdenes?}
    AD -->|Sí| X
    AD -->|No| AE[Retornar confirmación al usuario]
    AE --> AF[Usuario ve: "Órdenes PO-2026-0001, PO-2026-0002 creadas y enviadas"]
```

#### 1.4.2 Ejemplo de Sugerencia de Mejores Proveedores

**Input del usuario:**
```
"El cliente Tomato King requiere 15 chiles, 12 manzanas para el día de hoy a las 5 pm. 
Enviale esta orden a Pedro con posible mejor proveedor y precio actual de la compra."
```

**Extracción de parámetros:**
```typescript
const params = await extractPurchaseOrderParams(message, 'es', OPENAI_API_KEY);
// Resultado:
{
  items: [
    { productName: "chiles", quantity: 15, unit: "kg" },
    { productName: "manzanas", quantity: 12, unit: "kg" }
  ],
  deliveryDate: "2026-02-23",  // Hoy
  deliveryTime: "17:00",  // 5 pm
  notes: "Enviale a Pedro",
  recipientName: "Pedro"
}
```

**Búsqueda de mejores proveedores:**
```typescript
const itemsWithSuppliers = await Promise.all(
  params.items.map(async (item) => {
    // Buscar producto
    const product = await prisma.product.findFirst({
      where: { 
        OR: [
          { name: { contains: item.productName, mode: 'insensitive' } },
          { nameEs: { contains: item.productName, mode: 'insensitive' } }
        ]
      },
      include: {
        prices: {
          where: { isCurrent: true },
          include: { supplier: true },
          orderBy: { price: 'asc' }
        }
      }
    });
    
    if (!product) {
      throw new Error(`Producto no encontrado: ${item.productName}`);
    }
    
    // Seleccionar mejor proveedor (precio más bajo)
    const bestPrice = product.prices[0];
    
    return {
      productId: product.id,
      productName: product.name,
      supplierId: bestPrice.supplierId,
      supplierName: bestPrice.supplier.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: bestPrice.price,
      totalPrice: item.quantity * bestPrice.price
    };
  })
);

// Resultado:
[
  {
    productId: "prod_123",
    productName: "Chiles Jalapeños",
    supplierId: "supp_456",
    supplierName: "Fresh Farms Ltd",
    quantity: 15,
    unit: "kg",
    unitPrice: 3.50,
    totalPrice: 52.50
  },
  {
    productId: "prod_789",
    productName: "Manzanas Fuji",
    supplierId: "supp_101",
    supplierName: "Orchard Valley",
    quantity: 12,
    unit: "kg",
    unitPrice: 2.75,
    totalPrice: 33.00
  }
]
```

**Agrupación por proveedor:**
```typescript
const ordersBySupplier = itemsWithSuppliers.reduce((acc, item) => {
  if (!acc[item.supplierId]) {
    acc[item.supplierId] = {
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      items: [],
      subtotal: 0
    };
  }
  acc[item.supplierId].items.push(item);
  acc[item.supplierId].subtotal += item.totalPrice;
  return acc;
}, {});

// Calcular totales por proveedor
const pendingOrders = Object.values(ordersBySupplier).map(order => {
  const taxAmount = order.subtotal * 0.13;
  const total = order.subtotal + taxAmount;
  return {
    ...order,
    taxAmount,
    total
  };
});

// Resultado:
[
  {
    supplierId: "supp_456",
    supplierName: "Fresh Farms Ltd",
    items: [
      {
        productId: "prod_123",
        productName: "Chiles Jalapeños",
        quantity: 15,
        unit: "kg",
        unitPrice: 3.50,
        totalPrice: 52.50
      }
    ],
    subtotal: 52.50,
    taxAmount: 6.83,
    total: 59.33
  },
  {
    supplierId: "supp_101",
    supplierName: "Orchard Valley",
    items: [
      {
        productId: "prod_789",
        productName: "Manzanas Fuji",
        quantity: 12,
        unit: "kg",
        unitPrice: 2.75,
        totalPrice: 33.00
      }
    ],
    subtotal: 33.00,
    taxAmount: 4.29,
    total: 37.29
  }
]
```

**Resumen al usuario:**
```
Resumen de órdenes de compra:

Orden 1 - Fresh Farms Ltd:
  - Chiles Jalapeños: 15 kg @ $3.50/kg = $52.50
  Subtotal: $52.50
  Tax (13%): $6.83
  Total: $59.33

Orden 2 - Orchard Valley:
  - Manzanas Fuji: 12 kg @ $2.75/kg = $33.00
  Subtotal: $33.00
  Tax (13%): $4.29
  Total: $37.29

Total General: $96.62
Fecha de entrega: 2026-02-23 a las 5:00 PM
Notas: Enviar a Pedro

¿Confirmas crear estas órdenes de compra?
```

---

## 2. MEJORAS DE EXPERIENCIA DE USUARIO

### 2.1 Chatbot - Curva de Aprendizaje Mínima

#### 2.1.1 Principios de Diseño

1. **Lenguaje Natural**
   - El usuario debe poder expresarse en lenguaje natural sin aprender comandos
   - Soporte para español e inglés
   - Tolerancia a errores gramaticales y variaciones en la expresión

2. **Confirmación Inteligente**
   - El sistema debe pedir confirmación solo para acciones críticas
   - Acciones no críticas (consultas, búsquedas) se ejecutan directamente
   - Confirmaciones claras y concisas

3. **Sugerencias Proactivas**
   - El chatbot debe sugerir acciones basadas en contexto
   - Autocompletado mientras el usuario escribe
   - Respuestas rápidas con acciones comunes

4. **Feedback Inmediato**
   - Cada acción debe tener feedback visual claro
   - Indicadores de carga (loading states)
   - Mensajes de error descriptivos y con soluciones

#### 2.1.2 Implementaciones Específicas

**A. Sugerencias de Autocompletado**

```typescript
// Mientras el usuario escribe, mostrar sugerencias
const suggestions = await getSuggestions(partialMessage);

// Ejemplo:
// Usuario escribe: "fac"
// Sugerencias:
// - "factura" → Crear factura
// - "facturas" → Ver facturas
// - "facturas vencidas" → Ver facturas vencidas
```

**B. Respuestas Rápidas (Quick Replies)**

```typescript
// Botones con acciones comunes
const quickReplies = [
  { label: "Crear factura", action: "create_invoice" },
  { label: "Ver facturas vencidas", action: "overdue_invoices" },
  { label: "Crear orden de compra", action: "create_purchase_order" },
  { label: "Buscar producto", action: "search_product" }
];
```

**C. Historial Visible**

```typescript
// Mostrar las últimas 5 acciones del usuario en el chat
const recentActions = await getRecentActions(userId, 5);

// Ejemplo:
// Historial reciente:
// - Creaste factura INV-2026-0001 para Tomato King (hace 5 min)
// - Buscaste precio de mango (hace 10 min)
// - Creaste orden PO-2026-0001 para Fresh Farms (hace 15 min)
```

**D. Ayuda Contextual**

```typescript
// Botón "¿Qué puedo hacer?" que muestra ejemplos de comandos
const helpExamples = [
  "Crea una factura para Tomato King con 5 cajas de mango",
  "¿Cuál es el precio de las manzanas?",
  "Muéstrame las facturas vencidas",
  "El cliente Fresh Foods requiere 10 kg de chiles para mañana"
];
```

#### 2.1.3 Ejemplos de Interacciones

**Ejemplo 1: Creación de Factura (Flujo Completo)**

```
Usuario: Crea una factura para Tomato King con 5 cajas de mango, envíala por email

Bot: Entendido. Buscando cliente "Tomato King"...
     ✅ Cliente encontrado: Tomato King (tomato.king@email.com)
     
     Buscando productos...
     ✅ Mango: 5 cajas @ $25.00/caja = $125.00
     
     Resumen de factura:
     Cliente: Tomato King
     Productos:
     - Mango: 5 cajas @ $25.00/caja = $125.00
     
     Subtotal: $125.00
     Tax (13%): $16.25
     Total: $141.25
     
     Se enviará por email
     
     ¿Confirmas crear esta factura?
     
     [Sí, confirmo] [No, cancelar]

Usuario: Sí, confirmo

Bot: ✅ Factura creada exitosamente!
     
     Número: INV-2026-0001
     Cliente: Tomato King
     Total: $141.25
     Enviada por: email
     
     Puedes ver y editar la factura en el panel de facturas:
     https://hagoproduce.ca/invoices/inv-2026-0001
```

**Ejemplo 2: Creación de Orden de Compra (Flujo Completo)**

```
Usuario: El cliente Tomato King requiere 15 chiles, 12 manzanas para hoy a las 5pm. 
       Enviale esta orden a Pedro con posible mejor proveedor y precio actual.

Bot: Entendido. Buscando mejores proveedores...
     
     Chiles Jalapeños:
     - Mejor proveedor: Fresh Farms Ltd
     - Precio: $3.50/kg
     - Total: 15 kg @ $3.50/kg = $52.50
     
     Manzanas Fuji:
     - Mejor proveedor: Orchard Valley
     - Precio: $2.75/kg
     - Total: 12 kg @ $2.75/kg = $33.00
     
     Resumen de órdenes de compra:
     
     Orden 1 - Fresh Farms Ltd:
     - Chiles Jalapeños: 15 kg @ $3.50/kg = $52.50
     Subtotal: $52.50
     Tax (13%): $6.83
     Total: $59.33
     
     Orden 2 - Orchard Valley:
     - Manzanas Fuji: 12 kg @ $2.75/kg = $33.00
     Subtotal: $33.00
     Tax (13%): $4.29
     Total: $37.29
     
     Total General: $96.62
     Fecha de entrega: 2026-02-23 a las 5:00 PM
     Notas: Enviar a Pedro
     
     ¿Confirmas crear estas órdenes de compra?
     
     [Sí, confirmo] [No, cancelar]

Usuario: Sí, confirmo

Bot: ✅ Órdenes creadas exitosamente!
     
     Orden 1: PO-2026-0001 (Fresh Farms Ltd) - $59.33
     Orden 2: PO-2026-0002 (Orchard Valley) - $37.29
     
     Total: $96.62
     
     Las órdenes han sido enviadas a los proveedores por sus canales preferidos.
     
     Puedes ver las órdenes en el panel de compras:
     https://hagoproduce.ca/purchase-orders
```

### 2.2 Portal de Cliente - UX Optimizada

#### 2.2.1 Dashboard Visual

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  HAGO PRODUCE - Portal de Cliente    [🔔 3] [Perfil ▼]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────┐│
│  │ Total Pagado│  │  Pendiente  │  │   Vencido   │  │Próx.││
│  │  $12,450.00 │  │   $3,200.00 │  │   $850.00   │  │$1,200││
│  │   15 fact.  │  │    4 fact.  │  │    2 fact.  │  │  1  ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────┘│
│                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────┐  │
│  │   Compras por Mes (2025)    │  │   Top 5 Productos    │  │
│  │   [Gráfico de barras]       │  │   [Gráfico de dona]   │  │
│  │                             │  │                     │  │
│  │  Ene: $2,500  ████         │  │  Mango: 35%         │  │
│  │  Feb: $3,200  █████        │  │  Manzana: 25%       │  │
│  │  Mar: $2,800  ████         │  │  Chiles: 20%        │  │
│  │  ...                       │  │  ...                │  │
│  └─────────────────────────────┘  └─────────────────────┘  │
│                                                             │
│  Facturas Recientes                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Número      │ Fecha   │ Estado  │ Total    │ Acciones │  │
│  │ INV-2026-001│ 23/02/26│ Pagado  │ $141.25  │ [Ver PDF]│  │
│  │ INV-2026-000│ 22/02/26│ Pendiente│ $3,200.00│ [Ver PDF]│  │
│  │ INV-2026-099│ 20/02/26│ Vencido │ $850.00  │ [Ver PDF]│  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:**

1. **Tarjetas de Estado de Cuenta**
   - Colores semafóricos: verde (pagado), amarillo (pendiente), rojo (vencido), naranja (próximo)
   - Monto en CAD con formato de moneda
   - Número de facturas en cada categoría
   - Click en tarjeta → filtra tabla de facturas

2. **Gráfico de Compras Mensuales**
   - Últimos 12 meses
   - Eje X: meses (Ene, Feb, Mar, ...)
   - Eje Y: monto total en CAD
   - Tooltip con monto y número de facturas
   - Click en barra → filtra facturas de ese mes

3. **Gráfico de Top Productos**
   - Top 5 productos más comprados
   - Gráfico de dona (doughnut)
   - Leyenda con nombre y porcentaje
   - Tooltip con cantidad total y monto

4. **Tabla de Facturas Recientes**
   - Últimas 10 facturas
   - Paginación: 20 facturas por página
   - Filtros: Estado, Rango de fechas, Búsqueda
   - Ordenamiento: Fecha (desc default), Vencimiento, Total
   - Badge de estado con colores semafóricos
   - Botón de descarga individual por factura

#### 2.2.2 Historial Completo y Descarga Masiva

**Vista de Historial:**
```
┌─────────────────────────────────────────────────────────────┐
│  Facturas                                    [Filtros ▼]   │
├─────────────────────────────────────────────────────────────┤
│  Estado: [Todas ▼]  Fecha: [Últimos 30 días ▼]            │
│  Búsqueda: [Buscar por número...        ]                   │
├─────────────────────────────────────────────────────────────┤
│  ☑  Número      │ Fecha   │ Estado  │ Total    │ Acciones │
│  ☐  INV-2026-001│ 23/02/26│ Pagado  │ $141.25  │ [Ver PDF]│
│  ☑  INV-2026-000│ 22/02/26│ Pendiente│ $3,200.00│ [Ver PDF]│
│  ☐  INV-2026-099│ 20/02/26│ Vencido │ $850.00  │ [Ver PDF]│
│  ☑  INV-2026-098│ 18/02/26│ Pagado  │ $2,100.00│ [Ver PDF]│
│  ☐  INV-2026-097│ 15/02/26│ Pagado  │ $1,800.00│ [Ver PDF]│
│  ...                                                       │
│                                                             │
│  ☑ Seleccionar todos    [Descargar seleccionadas (3)]     │
│                                                             │
│  Mostrando 1-20 de 156 facturas    [Anterior] [1] [2] [Siguiente]│
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**

1. **Selección Múltiple**
   - Checkbox en cada fila
   - Checkbox "Seleccionar todos" en el header
   - Contador de facturas seleccionadas
   - Botón "Descargar seleccionadas (N)" aparece cuando hay selección
   - Límite: 20 facturas por descarga masiva

2. **Descarga Masiva**
   - Genera PDF para cada factura seleccionada
   - Comprime en ZIP
   - Nombre del archivo: `facturas_HAGO_PRODUCE_2026-02-23.zip`
   - Progress bar durante generación
   - Notificación cuando está listo

3. **Notificaciones en Tiempo Real**
   - Icono de campana en el header
   - Badge con número de notificaciones no leídas
   - Polling cada 30 segundos
   - Dropdown con las últimas 5 notificaciones
   - Marcar como leída al hacer click
   - Link a la factura relacionada

### 2.3 Portal Admin - Eficiencia Operativa

#### 2.3.1 Dashboard Consolidado

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  HAGO PRODUCE - Admin Panel              [🔔 5] [Admin ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────┐│
│  │Facturas Hoy │  │  Pedidos    │  │  Clientes   │  │Alert││
│  │     12      │  │   Nuevos    │  │   Activos   │  │as  2││
│  │  $4,500.00  │  │     5       │  │     45      │  │     ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────┘│
│                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────┐  │
│  │   Ingresos por Mes         │  │   Facturas por Estado│  │
│  │   [Gráfico de líneas]       │  │   [Gráfico de barras] │  │
│  │                             │  │                     │  │
│  │  Ene: $45,000  ●            │  │  Pagado: 60% ████   │  │
│  │  Feb: $52,000  ●            │  │  Pendiente: 25% ██  │  │
│  │  Mar: $48,000  ●            │  │  Vencido: 10% █    │  │
│  │  ...                       │  │  Cancelado: 5%      │  │
│  └─────────────────────────────┘  └─────────────────────┘  │
│                                                             │
│  Acciones Rápidas                                           │
│  [Crear Factura] [Crear Orden de Compra] [Ver Reportes]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.2 Tabla de Facturas con Filtros Avanzados

**Vista:**
```
┌─────────────────────────────────────────────────────────────┐
│  Facturas                                    [Acciones ▼]   │
├─────────────────────────────────────────────────────────────┤
│  Estado: [Todas ▼]  Cliente: [Todos ▼]  Fecha: [Todos ▼]  │
│  Monto: [$0 - $∞ ▼]  Búsqueda: [Buscar...               ]  │
├─────────────────────────────────────────────────────────────┤
│  ☑  Número      │ Cliente    │ Fecha   │ Estado  │ Total │
│  ☐  INV-2026-001│ Tomato King│ 23/02/26│ Pagado  │$141.25│
│  ☑  INV-2026-000│ Fresh Foods│ 22/02/26│ Pendiente│$3,200│
│  ☐  INV-2026-099│ Orchard Inc│ 20/02/26│ Vencido │$850.00│
│  ...                                                       │
│                                                             │
│  ☑ Seleccionar todos    [Enviar seleccionadas] [Exportar]  │
│                                                             │
│  Mostrando 1-20 de 156 facturas    [Anterior] [1] [2] [Siguiente]│
└─────────────────────────────────────────────────────────────┘
```

**Acciones en lote:**
- Enviar facturas seleccionadas por Email/WhatsApp/Telegram
- Cambiar estado de facturas seleccionadas
- Exportar a CSV/Excel/PDF
- Archivar facturas seleccionadas

---

## 3. CHECKLIST DE PRODUCTIZACIÓN

### 3.1 Pre-Launch

#### 3.1.1 Testing Completo

- [ ] **Unit Tests**
  - [ ] Coverage >80%
  - [ ] Todos los servicios tienen tests
  - [ ] Todos los intents de chat tienen tests
  - [ ] Todos los endpoints de API tienen tests

- [ ] **Integration Tests**
  - [ ] Flujo completo de creación de factura
  - [ ] Flujo completo de creación de orden de compra
  - [ ] Envío de emails (mock)
  - [ ] Envío de WhatsApp (mock)
  - [ ] Envío de Telegram (mock)

- [ ] **E2E Tests**
  - [ ] Pasan en Chrome
  - [ ] Pasan en Firefox
  - [ ] Pasan en Safari (si aplica)
  - [ ] Timeout configurado correctamente

- [ ] **Tests de Carga**
  - [ ] Endpoints de reportes soportan 100 req/min
  - [ ] Endpoint de chat soporta 20 req/min por usuario
  - [ ] Endpoints de webhooks soportan 100 req/min

- [ ] **Tests de Seguridad**
  - [ ] OWASP Top 10 validado
  - [ ] SQL injection prevenido
  - [ ] XSS prevenido
  - [ ] CSRF prevenido
  - [ ] Rate limiting activo en todos los endpoints públicos

#### 3.1.2 Performance

- [ ] **Tiempo de Respuesta**
  - [ ] Endpoints cacheados <500ms (p95)
  - [ ] Endpoints no cacheados <2s (p95)
  - [ ] Chat response <3s (p95)
  - [ ] Generación de PDF <5s (p95)

- [ ] **Lighthouse**
  - [ ] Performance >90
  - [ ] Accessibility >95
  - [ ] Best Practices >90
  - [ ] SEO >90

- [ ] **Optimización**
  - [ ] Imágenes optimizadas (WebP, lazy loading)
  - [ ] CSS y JS minificados
  - [ ] CDN configurado para assets estáticos
  - [ ] Gzip/Brotli compression activo

#### 3.1.3 Seguridad

- [ ] **Autenticación y Autorización**
  - [ ] JWT tokens configurados
  - [ ] Refresh tokens implementados
  - [ ] Roles y permisos definidos
  - [ ] Middleware de auth activo en todas las rutas protegidas

- [ ] **Protección de Endpoints**
  - [ ] Rate limiting configurado
  - [ ] Validación de firma en webhooks externos
  - [ ] CORS configurado correctamente
  - [ ] Helmet.js configurado

- [ ] **Variables de Entorno**
  - [ ] Todas las sensibles en secrets management
  - [ ] .env.example actualizado
  - [ ] No hay hardcoded secrets en el código

- [ ] **Headers de Seguridad**
  - [ ] CSP (Content Security Policy)
  - [ ] HSTS (HTTP Strict Transport Security)
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options

#### 3.1.4 Documentación

- [ ] **Guías de Usuario**
  - [ ] Guía de usuario para chatbot
  - [ ] Guía de usuario para portal de cliente
  - [ ] Guía de usuario para portal admin
  - [ ] Videos tutoriales (opcional)

- [ ] **Documentación Técnica**
  - [ ] API documentation (Swagger/OpenAPI)
  - [ ] Diagramas de arquitectura actualizados
  - [ ] Runbook de operaciones actualizado
  - [ ] Guía de troubleshooting

- [ ] **Documentación de Integraciones**
  - [ ] Guía de configuración de Twilio
  - [ ] Guía de configuración de Resend/SendGrid
  - [ ] Guía de configuración de Telegram
  - [ ] Guía de configuración de Make.com (si aplica)

#### 3.1.5 Integraciones

- [ ] **Twilio WhatsApp**
  - [ ] Cuenta configurada
  - [ ] Número de WhatsApp Business activo
  - [ ] Webhook configurado y verificado
  - [ ] Templates de mensajes aprobados

- [ ] **Email (Resend/SendGrid)**
  - [ ] Cuenta configurada
  - [ ] Domain verificado
  - [ ] Templates HTML creados
  - [ ] SPF/DKIM/DMARC configurados

- [ ] **Telegram**
  - [ ] Bot creado y configurado
  - [ ] Token obtenido
  - [ ] Webhook configurado (opcional)
  - [ ] Bot añadido a grupos/canales (si aplica)

- [ ] **Base de Datos**
  - [ ] Base de datos de producción configurada
  - [ ] Migraciones ejecutadas
  - [ ] Backups automatizados configurados
  - [ ] Monitoreo de performance configurado

### 3.2 Launch

#### 3.2.1 Monitoreo

- [ ] **Logs Centralizados**
  - [ ] Sentry configurado para errores
  - [ ] LogRocket configurado para sesiones de usuario (opcional)
  - [ ] Logs de aplicación configurados
  - [ ] Logs de acceso configurados

- [ ] **Métricas de Performance**
  - [ ] New Relic o Datadog configurado
  - [ ] Dashboards creados
  - [ ] Alertas configuradas para errores críticos
  - [ ] Alertas configuradas para performance degradado

- [ ] **Uptime Monitoring**
  - [ ] UptimeRobot o Pingdom configurado
  - [ ] Monitoreo de endpoints críticos
  - [ ] Alertas por email/SMS cuando hay downtime
  - [ ] Status page configurado (opcional)

#### 3.2.2 Soporte

- [ ] **Canales de Soporte**
  - [ ] Email de soporte configurado
  - [ ] Chat de soporte configurado (opcional)
  - [ ] Teléfono de soporte configurado (opcional)
  - [ ] Horarios de soporte definidos

- [ ] **Sistema de Tickets**
  - [ ] Zendesk, Freshdesk o similar configurado
  - [ ] Flujos de trabajo definidos
  - [ ] SLAs definidos
  - [ ] Escalaciones configuradas

- [ ] **Base de Conocimiento**
  - [ ] FAQ creada
  - [ ] Artículos de ayuda creados
  - [ ] Videos tutoriales creados (opcional)
  - [ ] Búsqueda funcional

- [ ] **Equipo de Soporte**
  - [ ] Equipo entrenado en el sistema
  - [ ] Procedimientos de escalado definidos
  - [ ] On-call rotation configurado
  - [ ] Comunicación de incidentes definida

#### 3.2.3 Backup y Recovery

- [ ] **Backups**
  - [ ] Backups diarios de base de datos
  - [ ] Backups de archivos (PDFs, imágenes)
  - [ ] Backups incrementales configurados
  - [ ] Retención de backups definida (30 días)

- [ ] **Procedimiento de Restore**
  - [ ] Procedimiento documentado
  - [ ] Procedimiento probado
  - [ ] Tiempo de restore medido
  - [ ] Checklist de restore creado

- [ ] **Disaster Recovery**
  - [ ] Plan de disaster recovery documentado
  - [ ] RTO (Recovery Time Objective) <4 horas
  - [ ] RPO (Recovery Point Objective) <1 hora
  - [ ] Plan probado trimestralmente

### 3.3 Post-Launch

#### 3.3.1 Optimización Continua

- [ ] **Análisis de Logs**
  - [ ] Revisión semanal de errores
  - [ ] Identificación de patrones de errores
  - [ ] Corrección de errores críticos
  - [ ] Documentación de lecciones aprendidas

- [ ] **Análisis de Performance**
  - [ ] Revisión semanal de métricas
  - [ ] Identificación de cuellos de botella
  - [ ] Optimización de queries lentas
  - [ ] Optimización de endpoints lentos

- [ ] **Feedback de Usuarios**
  - [ ] Encuestas de satisfacción
  - [ ] Análisis de tickets de soporte
  - [ ] Análisis de métricas de uso
  - [ ] Implementación de mejoras basadas en feedback

- [ ] **A/B Testing**
  - [ ] Pruebas de nuevas features
  - [ ] Pruebas de mejoras de UX
  - [ ] Análisis de resultados
  - [ ] Implementación de ganadores

#### 3.3.2 Mantenimiento

- [ ] **Actualizaciones de Dependencias**
  - [ ] Revisión semanal de actualizaciones
  - [ ] Actualización de dependencias críticas
  - [ ] Testing de actualizaciones
  - [ ] Documentación de cambios

- [ ] **Parches de Seguridad**
  - [ ] Monitoreo de vulnerabilidades
  - [ ] Aplicación de parches críticos
  - [ ] Testing de parches
  - [ ] Documentación de cambios

- [ ] **Limpieza de Datos**
  - [ ] Limpieza de cachés expirados
  - [ ] Archivo de datos antiguos
  - [ ] Limpieza de logs antiguos
  - [ ] Optimización de base de datos

- [ ] **Revisión de Límites**
  - [ ] Revisión de límites de APIs externas
  - [ ] Ajuste de límites si es necesario
  - [ ] Monitoreo de uso de APIs
  - [ ] Optimización de costos

---

## 4. MÉTRICAS DE ÉXITO

### 4.1 Métricas de Negocio

| Métrica | Objetivo | Frecuencia de Medición | Cómo Medir |
|---------|----------|------------------------|------------|
| **Tasa de adopción del chatbot** | >60% de usuarios internos usan chatbot semanalmente | Semanal | Número de usuarios únicos que usan /api/chat / Total usuarios internos |
| **Reducción de tiempo de creación de facturas** | >50% reducción vs proceso manual | Mensual | Tiempo promedio de creación manual vs tiempo promedio con chatbot |
| **Tasa de error en creación de facturas** | <5% | Semanal | Facturas creadas con error / Total facturas creadas |
| **Satisfacción del cliente (CSAT)** | >4.5/5 | Trimestral | Encuestas de satisfacción después de cada interacción |
| **Tiempo de respuesta a consultas** | <2 minutos promedio | Semanal | Tiempo entre pregunta y respuesta del chatbot |
| **Tasa de entrega de facturas** | >95% entregadas exitosamente | Diaria | Facturas entregadas / Total facturas enviadas |
| **Costo por factura enviada** | <$0.10 | Mensual | Costo total de servicios de comunicación / Total facturas enviadas |

### 4.2 Métricas Técnicas

| Métrica | Objetivo | Frecuencia de Medición | Cómo Medir |
|---------|----------|------------------------|------------|
| **Uptime** | >99.9% | Continua | Tiempo que el sistema está disponible / Tiempo total |
| **Tiempo de respuesta promedio** | <500ms (p95) | Continua | Métricas de APM (New Relic, Datadog) |
| **Error rate** | <0.1% | Continua | Número de errores / Total requests |
| **Coverage de tests** | >80% | Cada commit | Reporte de coverage de Jest |
| **Tiempo de despliegue** | <10 minutos | Cada despliegue | Tiempo desde commit hasta producción |
| **Tiempo de recovery** | <4 horas | Incidentes | Tiempo desde incidente hasta recuperación |
| **Costo de infraestructura** | <$500/mes | Mensual | Factura de Railway + APIs externas |

### 4.3 Métricas de UX

| Métrica | Objetivo | Frecuencia de Medición | Cómo Medir |
|---------|----------|------------------------|------------|
| **Task completion rate** | >90% | Mensual | Tareas completadas exitosamente / Total tareas iniciadas |
| **Time on task** | <2 minutos para crear factura | Mensual | Tiempo promedio para crear una factura |
| **Error rate en UI** | <2% | Semanal | Errores de UI / Total interacciones |
| **NPS (Net Promoter Score)** | >50 | Trimestral | Encuestas NPS |
| **Tasa de abandono** | <10% | Mensual | Sesiones abandonadas / Total sesiones |
| **Sesiones por usuario** | >5/semana | Semanal | Número de sesiones / Número de usuarios |

---

## 5. RESUMEN EJECUTIVO

### 5.1 Decisiones Clave

1. **Implementaciones Internas Priorizadas**
   - Email service (Resend)
   - Telegram service
   - Reutilizar WhatsApp service (Twilio)
   - No usar Make.com para estas funcionalidades

2. **Arquitectura de Servicios**
   - Servicios reutilizables y modulares
   - Manejo de errores robusto con reintentos
   - Logging detallado para debugging
   - Fallback entre canales de comunicación

3. **UX Optimizada**
   - Chatbot con lenguaje natural
   - Confirmación inteligente solo para acciones críticas
   - Sugerencias proactivas y autocompletado
   - Dashboard visual en portal de cliente
   - Notificaciones en tiempo real

4. **Productización**
   - Testing completo (>80% coverage)
   - Performance optimizada (<500ms para endpoints cacheados)
   - Seguridad robusta (OWASP Top 10)
   - Monitoreo y soporte configurados
   - Backup y recovery probados

### 5.2 Próximos Pasos

1. **Revisar y aprobar este documento** con el equipo
2. **Configurar variables de entorno** para Resend y Telegram
3. **Crear branch feature/sprint3** en el repositorio
4. **Comenzar ejecución** con S3-P03 (E2E Firefox Fix)
5. **Seguir timeline de 3 semanas** (15 días hábiles)

### 5.3 Éxito del Sprint 3

El Sprint 3 será considerado exitoso si:
- ✅ Todos los prompts P0 (críticos) están completados
- ✅ Coverage >80%
- ✅ E2E tests pasan en todos los browsers
- ✅ Facturación multi-canal funcional (WhatsApp, Email, Telegram)
- ✅ Órdenes de compra inteligentes funcionales
- ✅ Performance de reportes <500ms con caché
- ✅ SPA pública y portal cliente mejorados
- ✅ Sistema listo para producción

---

**Documento generado:** 2026-02-23  
**Versión:** 1.0  
**Estado:** ✅ Listo para revisión y aprobación  
**Basado en:** CHECKPOINT_CIERRE_SPRINT2.md + Nuevos requerimientos de facturación y órdenes de compra