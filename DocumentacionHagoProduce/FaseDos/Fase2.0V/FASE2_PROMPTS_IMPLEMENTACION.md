# SECCIÓN 4 - PROMPTS PARA IMPLEMENTACIÓN
# Hago Produce - Fase 2

**Fecha:** 22 de Febrero, 2026  
**Formato:** Prompts autocontenidos y profesionales para agentes IA

---

## 📋 Índice de Prompts

### FASE 1: INFRAESTRUCTURA & CORE (Prioridad 🔴 Crítica)

1. **[INFRA-01]** Prisma Schema Extensions - Modelos nuevos
2. **[INFRA-02]** Security & Authentication Improvements
3. **[INFRA-03]** Database Migrations & Indexes

### FASE 2: AGENTE CONVERSACIONAL (Prioridad 🔴🔴🔴 Máxima)

4. **[CHAT-01]** Backend Chat Service - Extensiones y Mejoras
5. **[CHAT-02]** Frontend Chat UI Component
6. **[CHAT-03]** Chat Integration Points

### FASE 3: INTEGRACIONES EXTERNAS (Prioridad 🔴 Crítica)

7. **[INT-01]** Google Sheets Migration
8. **[INT-02]** QuickBooks Integration
9. **[INT-03]** Make.com Webhook Integration

### FASE 4: REPORTS & ANALYTICS (Prioridad 🔴 Alta)

10. **[REP-01]** Reports Backend Service
11. **[REP-02]** Reports API Endpoints
12. **[REP-03]** Reports Frontend Components
13. **[REP-04]** Customer Portal Reports

### FASE 5: BOT EXTERNO MULTICANAL (Prioridad 🔴 Alta)

14. **[BOT-01]** Bot API Key Management
15. **[BOT-02]** Public Bot API Endpoints
16. **[BOT-03]** WhatsApp Business Integration
17. **[BOT-04]** Telegram Bot Integration
18. **[BOT-05]** Bot Business Logic
19. **[BOT-06]** Bot Dashboard UI

### FASE 6: SPA PÚBLICA & PORTAL CLIENTE (Prioridad 🟡 Media)

20. **[SPA-01]** Public SPA Structure
21. **[SPA-02]** Customer Portal Auth
22. **[SPA-03]** Customer Portal Dashboard
23. **[SPA-04]** Advanced Customer Features

### FASE 7: FACTURACIÓN INTELIGENTE (Prioridad 🟡 Media)

24. **[FAC-01]** Chat-based Invoice Creation
25. **[FAC-02]** Smart Invoice Features
26. **[FAC-03]** Invoice Analytics
27. **[FAC-04]** Integration with Bot Externo

### FASE 8: NOTIFICACIONES PROACTIVAS (Prioridad 🟢 Baja)

28. **[NOT-01]** Notification Engine
29. **[NOT-02]** Notification Types
30. **[NOT-03]** User Preferences
31. **[NOT-04]** Notification Dashboard UI

---

## 🔧 PROMPTS DETALLADOS POR FASE

---

### [INFRA-01] Prisma Schema Extensions - Modelos Nuevos

**Contexto:**
El proyecto Hago Produce tiene un schema Prisma existente con modelos básicos (User, Customer, Supplier, Product, Invoice, etc.). Para la Fase 2, necesitamos añadir modelos nuevos para soportar notificaciones, chat, bots, webhooks y report caching. El schema actual está en `prisma/schema.prisma`.

**Tarea Específica:**
Extender el schema Prisma existente añadiendo los siguientes modelos con sus relaciones, índices y enums:

1. **Model Notification:**
   - Campos: id (uuid), type (enum: INVOICE_STATUS, PAYMENT, PRICE_ALERT, PROMO, MAINTENANCE), title, body, priority (enum: LOW, NORMAL, HIGH, URGENT), channels (enum: EMAIL, WHATSAPP, TELEGRAM), sentAt, readAt, createdAt, userId (nullable), customerId (nullable)
   - Relaciones: userId → User, customerId → Customer
   - Índices: userId, customerId, type, sentAt, createdAt

2. **Model Message:**
   - Campos: id (uuid), platform (enum: INTERNAL, WHATSAPP, TELEGRAM), platformUserId, message, response, intent, confidence, metadata (Json), createdAt
   - Relaciones: Ninguna (modelo standalone para chat logs)
   - Índices: platform, platformUserId, createdAt, intent

3. **Model WebhookLog:**
   - Campos: id (uuid), source (enum: MAKE, QUICKBOOKS, TWILIO, TELEGRAM), eventType, payload (Json), response (Json), statusCode, idempotencyKey, processedAt, createdAt
   - Índices: source, eventType, idempotencyKey, createdAt, statusCode

4. **Model BotApiKey:**
   - Campos: id (uuid), name, hashedKey, rateLimit (requests per minute), isActive, lastUsedAt, requestCount, createdAt, expiresAt
   - Índices: id, name, isActive

5. **Model ReportCache:**
   - Campos: id (uuid), reportType, parameters (Json), result (Json), expiresAt, createdAt
   - Índices: reportType, expiresAt

**Constraints Técnicos:**
- Stack: Prisma ORM 5.x, PostgreSQL
- Patrones: Relational database design, proper indexing, soft deletes donde aplique
- Requisitos: UUID como primary keys, timestamps automáticos, enums typed
- Testing: Crear migraciones y ejecutar `prisma migrate deploy`
- Seguridad: hashedKey debe usar bcrypt (longitud suficiente para hash)
- Performance: Índices en campos frecuentemente consultados
- Backward compatibility: No eliminar ni modificar modelos existentes

**Output Esperado:**
- `prisma/schema.prisma` actualizado con nuevos modelos
- Migración generada: `prisma migrate dev --name add_notification_and_bot_models`
- Script de seed para datos iniciales (opcional)

**Criterios de Aceptación:**
- [ ] Todos los modelos nuevos definidos correctamente con tipos TypeScript
- [ ] Relaciones definidas apropiadamente (userId → User, customerId → Customer)
- [ ] Índices definidos en campos: userId, customerId, type, sentAt, createdAt (Notification)
- [ ] Índices definidos en campos: platform, platformUserId, createdAt (Message)
- [ ] Índices definidos en campos: source, eventType, idempotencyKey (WebhookLog)
- [ ] hashedKey tiene longitud suficiente para bcrypt hash (String @db.VarChar(255))
- [ ] Enums definidos correctamente: NotificationType, NotificationPriority, MessagePlatform, WebhookSource
- [ ] Migración generada y ejecutada exitosamente
- [ ] No hay breaking changes en modelos existentes
- [ ] Tests unitarios de validación de schema (opcional pero recomendado)

**Snippet de Ejemplo:**
```prisma
model Notification {
  id          String            @id @default(uuid())
  type        NotificationType
  title       String
  body        String            @db.Text
  priority    NotificationPriority @default(NORMAL)
  channels    NotificationChannel[]
  sentAt      DateTime?
  readAt      DateTime?
  createdAt   DateTime          @default(now())
  
  userId      String?
  user        User?             @relation(fields: [userId], references: [id])
  
  customerId  String?
  customer    Customer?         @relation(fields: [customerId], references: [id])
  
  @@index([userId])
  @@index([customerId])
  @@index([type])
  @@index([sentAt])
  @@index([createdAt])
}

enum NotificationType {
  INVOICE_STATUS
  PAYMENT
  PRICE_ALERT
  PROMO
  MAINTENANCE
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum NotificationChannel {
  EMAIL
  WHATSAPP
  TELEGRAM
}
```

**Dependencias Previas:**
- Nada (base del sistema)
- **NOTA:** Este prompt DEBE ejecutarse primero antes de cualquier otro prompt de Fase 2

---

### [INFRA-02] Security & Authentication Improvements

**Contexto:**
El proyecto actual tiene middleware de seguridad básico pero es demasiado permisivo. Necesitamos implementar mejoras de seguridad críticas incluyendo rate limiting global, middleware de protección robusto, y mejoras en autenticación. El middleware actual está en `src/middleware.ts` y auth en `src/lib/auth/middleware.ts`.

**Tarea Específica:**
Implementar las siguientes mejoras de seguridad:

1. **Rate Limiting Global (In-Memory):**
   - Crear `src/lib/middleware/rate-limiter.ts` con clase RateLimiter
   - Implementar token bucket algorithm
   - Configurar límites: 100 requests/minuto por IP, 1000 requests/minuto por user
   - Usar Map<key, {tokens, lastRefill}> para storage
   - Exponer función `checkRateLimit(identifier, limit)`

2. **Middleware Robusto:**
   - Actualizar `src/middleware.ts` con:
     - Protección de rutas: `/admin/*`, `/accounting/*`, `/portal/*`
     - Rate limiting en todas las rutas protegidas
     - Security headers: X-Frame-Options, X-Content-Type-Options, CSP
     - CORS configuration (origin whitelist)
   - Verificar JWT token en Authorization header para rutas protegidas
   - Role-based access: ADMIN para /admin*, ACCOUNTING para /accounting*

3. **Enhanced Auth Middleware:**
   - Actualizar `src/lib/auth/middleware.ts` con:
     - Rate limiting por user/IP en `getAuthenticatedUser`
     - Token refresh automático si expira en <5 minutos
     - Session management (track active sessions)
     - Logout de todas las sesiones (invalidate all tokens)

4. **Security Headers Helper:**
   - Crear `src/lib/middleware/security-headers.ts`
   - Headers: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin
   - CSP header para scripts inline y styles inline (permitir Tailwind)
   - HSTS header en producción

5. **Rate Limiting en API Routes:**
   - Crear helper `src/lib/middleware/api-rate-limit.ts`
   - Wrapper function para aplicar rate limiting en API routes
   - Response: 429 Too Many Requests con Retry-After header

**Constraints Técnicos:**
- Stack: Next.js 14, TypeScript, in-memory Map (no Redis por ahora)
- Patrones: Middleware pattern, rate limiting algorithms, security best practices
- Requisitos: OWASP Top 10 compliance, JWT security, XSS/CSRF prevention
- Testing: Unit tests para rate limiting algorithm, integration tests para middleware
- Performance: O(1) operations en rate limiter, minimal overhead
- Seguridad: No exponer información sensible en errores, sanitize inputs

**Output Esperado:**
- `src/lib/middleware/rate-limiter.ts` - Rate limiter implementation
- `src/middleware.ts` actualizado con protección robusta
- `src/lib/auth/middleware.ts` actualizado con mejoras
- `src/lib/middleware/security-headers.ts` - Security headers helper
- `src/lib/middleware/api-rate-limit.ts` - API rate limiting wrapper
- Tests: `src/tests/unit/middleware/rate-limiter.test.ts`
- Tests: `src/tests/integration/middleware/security.test.ts`

**Criterios de Aceptación:**
- [ ] Rate limiter implementa token bucket correctamente
- [ ] Límites: 100 req/min por IP, 1000 req/min por user
- [ ] Middleware protege rutas `/admin/*`, `/accounting/*`, `/portal/*`
- [ ] JWT token verification en middleware
- [ ] Role-based access working (ADMIN, ACCOUNTING)
- [ ] Security headers presentes en todas las responses
- [ ] Rate limiting en API routes retorna 429 con Retry-After
- [ ] Token refresh automático funcional
- [ ] Session tracking implemented
- [ ] Todos los tests unitarios pasan (≥80% coverage)
- [ ] Todos los tests de integración pasan
- [ ] No breaking changes en auth existente

**Snippet de Ejemplo:**
```typescript
// src/lib/middleware/rate-limiter.ts
export class RateLimiter {
  private limits: Map<string, { tokens: number; lastRefill: number }> = new Map();

  checkLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.limits.get(identifier);
    
    if (!record) {
      this.limits.set(identifier, { tokens: maxRequests - 1, lastRefill: now });
      return true;
    }
    
    const elapsed = now - record.lastRefill;
    const tokensToAdd = Math.floor(elapsed / (windowMs / maxRequests));
    
    if (tokensToAdd > 0) {
      record.tokens = Math.min(record.tokens + tokensToAdd, maxRequests);
      record.lastRefill = now;
    }
    
    if (record.tokens > 0) {
      record.tokens--;
      return true;
    }
    
    return false;
  }
}

export const rateLimiter = new RateLimiter();
```

**Dependencias Previas:**
- [INFRA-01] - Prisma Schema Extensions (para session tracking)
- Base auth system existente (Fase 1A)

---

### [INFRA-03] Database Migrations & Indexes

**Contexto:**
Los nuevos modelos de [INFRA-01] requieren migraciones de base de datos. Además, necesitamos añadir índices adicionales para optimizar queries de reportes y mejorar performance general. El database es PostgreSQL en Railway.

**Tarea Específica:**
Crear y ejecutar migraciones para:

1. **Crear nuevos modelos:**
   - Ejecutar `prisma migrate dev --name add_phase2_models`
   - Verificar que todas las tablas y columnas se crean correctamente
   - Añadir relaciones foreign keys apropiadamente

2. **Índices adicionales para Reportes:**
   - Invoice: índice compuesto en (customerId, status, issueDate)
   - InvoiceItem: índice en (productId, invoiceId)
   - ProductPrice: índice en (productId, isCurrent, effectiveDate DESC)
   - Customer: índice en (isActive, name)
   - Product: índice en (category, isActive)

3. **Índices para Chat y Bots:**
   - Message: índice en (platform, platformUserId, createdAt DESC)
   - WebhookLog: índice en (source, eventType, createdAt DESC)
   - Notification: índice en (userId, type, sentAt DESC)
   - Notification: índice en (customerId, type, sentAt DESC)

4. **Seed Data (opcional):**
   - Crear script `prisma/seed.ts` para datos iniciales
   - Datos de prueba para: 1 admin user, 2 customers, 5 products, 3 suppliers, 10 invoices
   - Datos para notificaciones de ejemplo

5. **Migration Verification:**
   - Crear script `scripts/verify-migration.ts`
   - Verificar que todas las tablas existan
   - Verificar que todos los índices estén creados
   - Verificar que las relaciones funcionen
   - Output: JSON con resultados de verificación

6. **Rollback Script:**
   - Crear script `scripts/rollback-migration.ts`
   - Eliminar nuevas tablas y índices
   - Restaurar estado anterior

**Constraints Técnicos:**
- Stack: Prisma ORM 5.x, PostgreSQL
- Patrones: Database migrations, indexing strategies, seed data
- Requisitos: Zero downtime migrations, backward compatibility
- Testing: Verificar migraciones en staging antes de producción
- Performance: Índices estratégicos para queries frecuentes
- Seguridad: No exponer datos sensibles en seed data

**Output Esperado:**
- Migraciones ejecutadas: `prisma migrate deploy`
- Script de verificación: `scripts/verify-migration.ts`
- Script de rollback: `scripts/rollback-migration.ts`
- Seed data: `prisma/seed.ts` (opcional)
- Logs de migración en `migrations/`

**Criterios de Aceptación:**
- [ ] Migraciones ejecutadas sin errores
- [ ] Todas las tablas nuevas creadas (Notification, Message, WebhookLog, BotApiKey, ReportCache)
- [ ] Todos los índices nuevos creados
- [ ] Índices compuestos correctos
- [ ] Relaciones foreign keys funcionan
- [ ] Script de verificación pasa
- [ ] Script de rollback funciona
- [ ] Seed data creó datos de prueba (si implementado)
- [ ] No breaking changes en datos existentes
- [ ] Performance de queries mejoró (benchmark)

**Snippet de Ejemplo:**
```typescript
// scripts/verify-migration.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  const results = {
    tables: {} as Record<string, boolean>,
    indexes: {} as Record<string, boolean>,
  };

  // Verify tables exist
  const tables = [
    'Notification',
    'Message',
    'WebhookLog',
    'BotApiKey',
    'ReportCache'
  ];

  for (const table of tables) {
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      results.tables[table] = true;
    } catch {
      results.tables[table] = false;
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

verifyMigration()
  .then(() => prisma.$disconnect())
  .catch(console.error);
```

**Dependencias Previas:**
- [INFRA-01] - Prisma Schema Extensions (debe ejecutarse primero)
- [INFRA-02] - Security & Authentication Improvements (opcional, paralelo)

---

### [CHAT-01] Backend Chat Service - Extensiones y Mejoras

**Contexto:**
El backend de chat ya está implementado en Fase 1C (endpoint POST /api/v1/chat/query con OpenAI GPT-4o-mini). Necesitamos extenderlo con funcionalidades avanzadas: context management, memory system, proactive suggestions, e invoice creation workflow. El código existente está en `src/app/api/v1/chat/query/route.ts` y servicios en `src/lib/services/chat/`.

**Tarea Específica:**
Extender el servicio de chat con:

1. **Context Management (Multi-turn Conversations):**
   - Crear `src/lib/services/chat/context.ts` con clase ConversationContext
   - Almacenar historial de conversación por userId/IP (in-memory Map)
   - Límite de 10 mensajes en contexto más recientes
   - Extracción de entities relevantes (productNames, customerNames, invoiceNumbers)
   - Persistencia opcional en Message model

2. **Memory System:**
   - Crear `src/lib/services/chat/memory.ts` con clase UserMemory
   - Almacenar preferencias de usuario: language, favoriteProducts, frequentQueries
   - Recordar entities mencionadas en conversaciones previas
   - Sugerencias basadas en historial
   - TTL de 7 días para entries de memoria

3. **Proactive Suggestions:**
   - Crear `src/lib/services/chat/suggestions.ts`
   - Analizar intención del usuario y sugerir siguientes acciones
   - Sugerencias por contexto: "¿Quieres crear una factura con estos productos?"
   - Sugerencias por historial: "¿Consultar precio de pineapple nuevamente?"
   - Limitar a 3 sugerencias por response

4. **Invoice Creation Workflow:**
   - Crear `src/lib/services/chat/invoice-workflow.ts`
   - Estado machine para flujo de creación de factura:
     - State 0: Inicio (seleccionar cliente)
     - State 1: Agregar productos (repetible)
     - State 2: Confirmar y crear
     - State 3: Completado
   - Validación en cada paso
   - Rollback capability en caso de error
   - Integración con invoicesService existente

5. **Enhanced Intent Detection:**
   - Actualizar `src/lib/services/chat/intents.ts` (existente)
   - Añadir intents: create_invoice, add_line_item, select_customer, confirm_invoice
   - ML-based detection usando OpenAI embeddings (opcional, mejor heurística)
   - Confidence threshold ajustable
   - Fallback a intents existentes

6. **Response Formatting:**
   - Actualizar `src/lib/services/chat/formatter.ts` (o crear)
   - Rich responses con: markdown, links, action buttons
   - Formato de suggestions: quick replies con buttons
   - Formatting de invoices: tablas con items, totales, tax
   - Support para emojis en responses

**Constraints Técnicos:**
- Stack: Next.js 14, TypeScript, Prisma, OpenAI GPT-4o-mini
- Patrones: State machine pattern, conversation design, NLP concepts
- Requisitos: Multi-turn support, context awareness, proactive UX
- Testing: Unit tests para cada módulo, integration tests para workflow completo
- Performance: Context en memory, cache de embeddings (si implementado)
- Seguridad: No exponer datos de otros usuarios, sanitize inputs

**Output Esperado:**
- `src/lib/services/chat/context.ts` - Conversation context manager
- `src/lib/services/chat/memory.ts` - User memory system
- `src/lib/services/chat/suggestions.ts` - Proactive suggestions
- `src/lib/services/chat/invoice-workflow.ts` - Invoice creation workflow
- `src/lib/services/chat/intents.ts` actualizado con nuevos intents
- `src/lib/services/chat/formatter.ts` - Enhanced response formatter
- Actualización de `src/app/api/v1/chat/query/route.ts` para usar nuevos servicios
- Tests: `src/tests/unit/chat/context.test.ts`, `memory.test.ts`, `suggestions.test.ts`, `invoice-workflow.test.ts`
- Tests: `src/tests/integration/chat/workflow.test.ts`

**Criterios de Aceptación:**
- [ ] ConversationContext almacena hasta 10 mensajes por usuario
- [ ] Memory system almacena preferencias y entities
- [ ] Memory tiene TTL de 7 días
- [ ] Proactive suggestions generan hasta 3 sugerencias relevantes
- [ ] Invoice creation workflow tiene 4 estados funcionales
- [ ] Invoice workflow valida en cada paso
- [ ] Invoice workflow soporta rollback
- [ ] Nuevos intents detectados correctamente
- [ ] Responses con markdown, links, action buttons
- [ ] Suggestions con quick replies
- [ ] Invoice responses con tablas formateadas
- [ ] Todos los tests unitarios pasan (≥80% coverage)
- [ ] Todos los tests de integración pasan
- [ ] No breaking changes en API existente

**Snippet de Ejemplo:**
```typescript
// src/lib/services/chat/invoice-workflow.ts
export enum InvoiceWorkflowState {
  INIT = 'INIT',
  SELECT_CUSTOMER = 'SELECT_CUSTOMER',
  ADD_ITEMS = 'ADD_ITEMS',
  CONFIRM = 'CONFIRM',
  COMPLETED = 'COMPLETED'
}

export interface InvoiceWorkflowContext {
  state: InvoiceWorkflowState;
  customerId?: string;
  items: Array<{ productId: string; quantity: number }>;
  metadata: Record<string, any>;
}

export class InvoiceWorkflow {
  private workflows: Map<string, InvoiceWorkflowContext> = new Map();

  start(userId: string): InvoiceWorkflowContext {
    const context: InvoiceWorkflowContext = {
      state: InvoiceWorkflowState.INIT,
      items: [],
      metadata: {}
    };
    this.workflows.set(userId, context);
    return context;
  }

  async handleInput(userId: string, input: string, detectedIntent: DetectedIntent): Promise<InvoiceWorkflowResponse> {
    const context = this.workflows.get(userId);
    if (!context) {
      return { success: false, error: 'No active workflow' };
    }

    switch (context.state) {
      case InvoiceWorkflowState.INIT:
        return this.handleSelectCustomer(context, input);
      case InvoiceWorkflowState.ADD_ITEMS:
        return this.handleAddItem(context, input, detectedIntent);
      case InvoiceWorkflowState.CONFIRM:
        return this.handleConfirm(context, input);
      default:
        return { success: false, error: 'Invalid state' };
    }
  }
}
```

**Dependencias Previas:**
- [INFRA-01] - Prisma Schema Extensions (Message model)
- [INFRA-02] - Security & Authentication Improvements (auth middleware)
- Base chat system existente (Fase 1C)

---

### [CHAT-02] Frontend Chat UI Component

**Contexto:**
El backend de chat está extendido en [CHAT-01]. Necesitamos crear un componente frontend de chat moderno, responsive, y potente que se integre como asistente flotante en todas las páginas del sistema. Debe ser comparable a CLIP de WORD pero más potente y actual.

**Tarea Específica:**
Crear componente de chat UI con:

1. **Floating Assistant Widget:**
   - Crear `src/components/chat/FloatingChatAssistant.tsx`
   - Botón flotante en bottom-right con icono de chat
   - Expand/collapse animation smooth
   - Badge de notificaciones (mensajes nuevos)
   - Badge de estado (online/offline/typing)
   - Persistent state (minimizado/expandido en localStorage)

2. **Chat Interface:**
   - Crear `src/components/chat/ChatInterface.tsx`
   - Header con: title, minimize button, clear chat button
   - Message list con: user messages (derecha), bot messages (izquierda)
   - Scroll automático al último mensaje
   - Timestamps en mensajes
   - Typing indicator cuando bot está "pensando"
   - Support para markdown rendering en bot messages
   - Rich content: links, tables, code blocks

3. **Chat Input:**
   - Crear `src/components/chat/ChatInput.tsx`
   - Text input multiline con auto-resize
   - Send button (icono de paper plane)
   - Voice input button (integración con Web Speech API - speech-to-text)
   - Quick reply buttons (suggestions del backend)
   - Support para emojis (emoji picker integrado)
   - Attachments button (opcional para futuras features)
   - Loading state mientras envía

4. **Message Components:**
   - Crear `src/components/chat/ChatMessage.tsx`
   - UserMessage component (derecha, bubble style)
   - BotMessage component (izquierda, más ancho)
   - Support para: text, markdown, tables, code blocks, action buttons
   - Tables con styling de Shadcn/Tailwind
   - Code blocks con syntax highlighting (usando prism-react-renderer o similar)

5. **Invoice Creation Flow UI:**
   - Crear `src/components/chat/InvoiceCreationFlow.tsx`
   - Wizard para crear factura vía chat
   - Paso 1: Selector de cliente (dropdown con search)
   - Paso 2: Selector de productos (multi-select con cantidades)
   - Paso 3: Preview de factura (resumen con totales)
   - Paso 4: Confirmación y creación
   - Progress indicator
   - Navigation (back/next)
   - Integración con backend invoice-workflow

6. **Rich Response Components:**
   - Crear `src/components/chat/RichResponse.tsx`
   - Markdown renderer (usar react-markdown)
   - Table component para responses de facturas
   - Action buttons component (suggestions del backend)
   - Links component (clickable, styled)
   - Code block component (syntax highlighted)

7. **Chat Integration:**
   - Crear hook `src/hooks/useChat.ts`
   - Manejo de estado local de conversación
   - Conexión a POST /api/v1/chat/query
   - Caching de responses (5 minutos)
   - Error handling y retry
   - Typing indicator state

**Constraints Técnicos:**
- Stack: Next.js 14, TypeScript, React 18, Tailwind CSS, Shadcn/UI
- Librerías: react-markdown, prism-react-renderer (syntax highlighting), framer-motion (animations)
- Patrones: Component composition, hooks pattern, responsive design
- Requisitos: Mobile-first responsive, accessibility (ARIA labels), keyboard navigation
- Testing: Unit tests para componentes, integration tests para chat flow
- Performance: Virtual scrolling para largas conversaciones, lazy loading
- UX: Smooth animations, clear feedback, intuitive interactions

**Output Esperado:**
- `src/components/chat/FloatingChatAssistant.tsx`
- `src/components/chat/ChatInterface.tsx`
- `src/components/chat/ChatInput.tsx`
- `src/components/chat/ChatMessage.tsx`
- `src/components/chat/InvoiceCreationFlow.tsx`
- `src/components/chat/RichResponse.tsx`
- `src/hooks/useChat.ts`
- `src/app/(admin)/layout.tsx` actualizado para incluir FloatingChatAssistant
- `src/app/(portal)/layout.tsx` actualizado para incluir FloatingChatAssistant
- Tests: `src/tests/unit/chat/components.test.ts`
- Tests: `src/tests/integration/chat/ui.test.ts`

**Criterios de Aceptación:**
- [ ] Floating assistant widget funcional en todas las páginas
- [ ] Expand/collapse animation smooth
- [ ] Chat interface muestra messages correctamente
- [ ] User messages a la derecha, bot messages a la izquierda
- [ ] Auto-scroll al último mensaje
- [ ] Typing indicator funcional
- [ ] Markdown rendering en bot messages
- [ ] Voice input funcional (speech-to-text)
- [ ] Quick reply buttons funcionan
- [ ] Invoice creation flow con 4 pasos
- [ ] Invoice flow integration con backend
- [ ] Rich response components: tables, code blocks, action buttons
- [ ] Responsive en mobile, tablet, desktop
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] Todos los tests unitarios pasan (≥80% coverage)
- [ ] Todos los tests de integración pasan

**Snippet de Ejemplo:**
```typescript
// src/components/chat/ChatInterface.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Call chat API
    const response = await fetch('/api/v1/chat/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, language: 'es' }),
    });
    const data = await response.json();

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      content: data.data.response,
      timestamp: new Date(),
      suggestions: data.data.suggestions,
    };
    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-gray-500"
          >
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200" />
          </motion.div>
        )}
      </div>
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
}
```

**Dependencias Previas:**
- [CHAT-01] - Backend Chat Service Extensions (API debe estar lista)
- [INFRA-01] - Prisma Schema Extensions (para Message model)
- UI components existentes (Shadcn/UI)

---
---

### [CHAT-03] Chat Integration Points

**Contexto:**
El backend y frontend del chat están implementados en [CHAT-01] y [CHAT-02]. Necesitamos integrar el chat en múltiples puntos del sistema: dashboard admin, portal cliente, creación de facturas, consultas de precios, y visualización de reportes vía chat. El chat debe funcionar como asistente inteligente en todas las páginas.

**Tarea Específica:**
Integrar el chat en:

1. **Dashboard Admin Integration:**
   - Integrar FloatingChatAssistant en `src/app/(admin)/layout.tsx`
   - Chat context-aware de página actual (dashboard, invoices, customers, etc.)
   - Quick actions específicas del dashboard: "Mostrar KPIs de hoy", "Crear factura nueva", "Consultar vencimientos"
   - Chat puede ejecutar acciones del dashboard (crear factura, cambiar status, etc.)
   - State synchronization con página (ej: chat crea factura, dashboard se actualiza)

2. **Portal Cliente Integration:**
   - Integrar FloatingChatAssistant en `src/app/(portal)/layout.tsx`
   - Chat context-aware de página cliente (mis facturas, pagos, dashboard)
   - Quick actions específicas del cliente: "¿Qué facturas tengo pendientes?", "¿Cuál es mi saldo?", "Pagar factura #123"
   - Chat puede mostrar datos del cliente (solo sus propias facturas)
   - Security: chat valida customerId del usuario, no expone otros clientes

3. **Invoice Creation via Chat:**
   - Integrar InvoiceCreationFlow en página de facturas `src/app/(admin)/invoices/create/page.tsx`
   - Chat puede iniciar flujo de creación de factura
   - Sincronización entre chat y formulario de factura
   - Validación en tiempo real vía chat
   - Pre-fill formulario con datos del chat

4. **Price Queries Integration:**
   - Chat puede consultar precios de productos en tiempo real
   - Mostrar tabla de precios en chat (comparativa por proveedor)
   - Sugerir mejor proveedor según precio y disponibilidad
   - Integración con ProductPrice service existente

5. **Reports Visualization via Chat:**
   - Chat puede mostrar KPIs y métricas en formato natural
   - Generar mini-charts en chat (usando recharts inline)
   - Table visualizations para top customers/products
   - Drill-down desde chat a página de reportes detallados

6. **Context-Aware Chat:**
   - Crear hook `src/hooks/useChatContext.ts`
   - Detectar ruta/ página actual
   - Inyectar contexto en chat messages (page, entity, etc.)
   - Customize quick actions por página
   - Maintain context state across navigation

7. **Chat Event Handlers:**
   - Crear `src/lib/chat/event-handlers.ts`
   - Handlers para: crear_factura, cambiar_status, consultar_precio, generar_reporte
   - Validación de permisos (role-based)
   - Audit logging de acciones ejecutadas vía chat
   - Error handling con user-friendly messages

**Constraints Técnicos:**
- Stack: Next.js 14, TypeScript, React 18, Tailwind CSS
- Patrones: Context-aware design, event handling, state synchronization
- Requisitos: Seamless integration, consistent UX, security by design
- Testing: Integration tests para cada integration point, E2E tests para workflows
- Performance: Debouncing de chat inputs, lazy loading de componentes
- Seguridad: Role-based access, data isolation, permission checks

**Output Esperado:**
- `src/app/(admin)/layout.tsx` actualizado con FloatingChatAssistant
- `src/app/(portal)/layout.tsx` actualizado con FloatingChatAssistant
- `src/app/(admin)/invoices/create/page.tsx` actualizado con chat integration
- `src/hooks/useChatContext.ts`
- `src/lib/chat/event-handlers.ts`
- Integration de chat en dashboard (quick actions específicos)
- Integration de chat en portal cliente (datos específicos del cliente)
- Integration de chat para price queries (tablas comparativas)
- Integration de chat para reports (KPIs, mini-charts, drill-down)
- Tests: `src/tests/integration/chat/admin-dashboard.test.ts`
- Tests: `src/tests/integration/chat/customer-portal.test.ts`
- Tests: `src/tests/integration/chat/invoice-creation.test.ts`

**Criterios de Aceptación:**
- [ ] FloatingChatAssistant visible en todas las páginas admin
- [ ] FloatingChatAssistant visible en todas las páginas portal cliente
- [ ] Chat context-aware funciona correctamente (detecta página)
- [ ] Quick actions específicas por página funcionan
- [ ] Chat puede crear facturas desde dashboard
- [ ] Chat puede cambiar status de facturas
- [ ] Chat puede consultar precios con tabla comparativa
- [ ] Chat puede mostrar KPIs y métricas
- [ ] Chat puede generar mini-charts inline
- [ ] Chat puede hacer drill-down a páginas de reportes
- [ ] Portal cliente chat muestra solo datos del cliente
- [ ] Security: role checks en event handlers
- [ ] Security: data isolation en portal cliente
- [ ] Audit logging de acciones vía chat
- [ ] State synchronization funciona (chat → page, page → chat)
- [ ] Todos los tests de integración pasan
- [ ] Todos los tests E2E pasan

**Snippet de Ejemplo:**
```typescript
// src/hooks/useChatContext.ts
'use client';

import { usePathname } from 'next/navigation';

export interface ChatContext {
  page: string;
  entity?: string;
  entityId?: string;
  quickActions: Array<{
    label: string;
    action: string;
    params?: Record<string, any>;
  }>;
}

export function useChatContext(): ChatContext {
  const pathname = usePathname();

  const getPageContext = (): ChatContext => {
    if (pathname.startsWith('/admin/dashboard')) {
      return {
        page: 'dashboard',
        quickActions: [
          { label: 'Mostrar KPIs de hoy', action: 'show_kpis', params: { period: 'today' } },
          { label: 'Crear factura nueva', action: 'create_invoice' },
          { label: 'Consultar vencimientos', action: 'show_aging' },
        ],
      };
    }

    if (pathname.startsWith('/admin/invoices')) {
      return {
        page: 'invoices',
        quickActions: [
          { label: 'Crear factura', action: 'create_invoice' },
          { label: 'Facturas pendientes', action: 'list_invoices', params: { status: 'PENDING' } },
        ],
      };
    }

    if (pathname.startsWith('/portal/mis-facturas')) {
      return {
        page: 'customer_invoices',
        quickActions: [
          { label: '¿Qué facturas pendientes?', action: 'pending_invoices' },
          { label: '¿Mi saldo?', action: 'balance' },
        ],
      };
    }

    return {
      page: 'general',
      quickActions: [
        { label: 'Ayuda', action: 'help' },
      ],
    };
  };

  return getPageContext();
}
```

**Dependencias Previas:**
- [CHAT-01] - Backend Chat Service Extensions
- [CHAT-02] - Frontend Chat UI Component
- Pages existentes: Dashboard, Invoices, Portal Cliente


---

### [INT-01] Google Sheets Migration

**Contexto:**
El sistema actualmente depende de Google Sheets para almacenar datos de productos, precios, proveedores, y facturas. Necesitamos migrar todos estos datos a PostgreSQL para eliminar dependencias externas y mejorar data quality. El spreadsheet ID está configurado en environment variables.

**Tarea Específica:**
Implementar migración completa de Google Sheets a PostgreSQL:

1. **Google Sheets API Client:**
   - Crear `scripts/google-sheets-migration/client.ts`
   - Configurar autenticación con Service Account OAuth2
   - Función `readSheet(spreadsheetId, range): Promise<SheetData>`
   - Función `readAllSheets(): Promise<AllSheetsData>`
   - Manejo de errores con retry (max 3 intentos)
   - Parsing de datos a JSON estructurado

2. **Data Mapping Schema:**
   - Crear `scripts/google-sheets-migration/mapping.ts`
   - Mapeo de columnas de Sheets a modelos Prisma:
     - Products sheet → Product model
     - Suppliers sheet → Supplier model
     - ProductPrices sheet → ProductPrice model
     - Customers sheet → Customer model
     - Invoices sheet → Invoice model
     - InvoiceItems sheet → InvoiceItem model
   - Transformación de tipos (strings → numbers, dates, enums)
   - Manejo de valores nulos y defaults

3. **Validation Engine:**
   - Crear `scripts/google-sheets-migration/validator.ts`
   - Validar cada row con Zod schemas
   - Validaciones específicas:
     - SKUs únicos
     - TaxIds únicos
     - Foreign keys válidos (customerId, productId, supplierId)
     - Fechas válidas
     - Amounts positivos
   - Reportar errores con row numbers

4. **Migration Script:**
   - Crear `scripts/google-sheets-migration/migrator.ts`
   - Función principal `runMigration(options: MigrationOptions)`
   - Opciones: dryRun (boolean), batchSize (number), skipExisting (boolean)
   - Proceso:
     - Leer datos de Sheets
     - Validar todos los datos
     - Migrar en orden: Suppliers → Products → ProductPrices → Customers → Invoices → InvoiceItems
     - Usar transacciones de Prisma (batch operations)
     - Log progreso (read, created, updated, errors)
   - Dry run mode: simula sin persistir

5. **Conflict Resolution:**
   - Detectar duplicados con datos existentes en DB
   - Estrategia: merge (actualizar existentes, crear nuevos)
   - Comparar por: SKU (products), TaxId (customers), Name (suppliers)
   - Log de conflictos resueltos

6. **Verification Script:**
   - Crear `scripts/google-sheets-migration/verifier.ts`
   - Post-migration verification:
     - Count de records (Sheets vs DB)
     - Data integrity checks (sumas totales coinciden)
     - Foreign key integrity
     - Validación de status de facturas
   - Output: JSON con resultados de verificación

7. **Rollback Script:**
   - Crear `scripts/google-sheets-migration/rollback.ts`
   - Eliminar datos migrados basado en timestamp de migración
   - Opción: rollback completo o parcial
   - Log de rollback

8. **Migration Logging:**
   - Crear tabla AuditLog entries para cada migración
   - Log de cada row migrado (antes/después)
   - Timestamp de migración
   - Estadísticas globales

**Constraints Técnicos:**
- Stack: TypeScript, Google APIs (googleapis), Prisma, Zod
- Patrones: ETL pattern, validation, error handling, transaction management
- Requisitos: Data integrity, idempotency, rollback capability
- Testing: Unit tests para validator, integration tests para migrator
- Performance: Batch operations (100 rows por transaction), streaming para datasets grandes
- Seguridad: No exponer datos sensibles, validar inputs, sanitizar outputs

**Output Esperado:**
- `scripts/google-sheets-migration/client.ts`
- `scripts/google-sheets-migration/mapping.ts`
- `scripts/google-sheets-migration/validator.ts`
- `scripts/google-sheets-migration/migrator.ts`
- `scripts/google-sheets-migration/verifier.ts`
- `scripts/google-sheets-migration/rollback.ts`
- `scripts/google-sheets-migration/index.ts` (entry point)
- Environment variables: GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_SERVICE_ACCOUNT_*
- Tests: `src/tests/unit/migration/validator.test.ts`
- Tests: `src/tests/integration/migration/migrator.test.ts`
- Documentation: `docs/migration-guide.md`

**Criterios de Aceptación:**
- [ ] Google Sheets client lee todas las hojas correctamente
- [ ] Data mapping schema mapea correctamente columnas a modelos
- [ ] Validator valida todos los datos con Zod schemas
- [ ] Migrator migra todos los data types en orden correcto
- [ ] Migrator usa transacciones de Prisma (atomicidad)
- [ ] Dry run mode funciona (no persiste datos)
- [ ] Conflict resolution merge funciona correctamente
- [ ] Verifier verifica integridad de datos post-migración
- [ ] Rollback script funciona correctamente
- [ ] Migration logging crea entries en AuditLog
- [ ] Todos los tests unitarios pasan
- [ ] Todos los tests de integración pasan
- [ ] Migración completa en <5 minutos (estimado para 10k records)
- [ ] Zero data loss en migración
- [ ] Data integrity verificado

**Snippet de Ejemplo:**
```typescript
// scripts/google-sheets-migration/migrator.ts
import { PrismaClient } from '@prisma/client';
import { readAllSheets } from './client';
import { validateProduct, validateCustomer, validateInvoice } from './validator';

const prisma = new PrismaClient();

export interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  skipExisting: boolean;
}

export interface MigrationResult {
  read: number;
  created: number;
  updated: number;
  errors: number;
  duration: number;
}

export async function runMigration(
  options: MigrationOptions = { dryRun: true, batchSize: 100, skipExisting: false }
): Promise<MigrationResult> {
  const startTime = Date.now();
  const result: MigrationResult = { read: 0, created: 0, updated: 0, errors: 0, duration: 0 };

  console.log(`🚀 Starting migration (dryRun: ${options.dryRun})`);

  // Read all data from Google Sheets
  const sheetsData = await readAllSheets();
  result.read += sheetsData.products.length + sheetsData.customers.length + sheetsData.invoices.length;

  // Validate all data
  console.log('🔍 Validating data...');
  const validProducts = sheetsData.products.filter(p => {
    try {
      validateProduct(p);
      return true;
    } catch (e) {
      console.error(`Invalid product: ${e.message}`);
      result.errors++;
      return false;
    }
  });

  // Migrate products
  console.log('📦 Migrating products...');
  for (let i = 0; i < validProducts.length; i += options.batchSize) {
    const batch = validProducts.slice(i, i + options.batchSize);
    if (options.dryRun) {
      console.log(`[DRY RUN] Would create/update ${batch.length} products`);
    } else {
      await prisma.product.createMany({
        data: batch.map(p => ({
          name: p.name,
          nameEs: p.nameEs,
          sku: p.sku,
          category: p.category,
          unit: p.unit,
        })),
        skipDuplicates: true,
      });
      result.created += batch.length;
    }
  }

  result.duration = Date.now() - startTime;
  console.log(`✅ Migration completed in ${result.duration}ms`);
  console.log(`Read: ${result.read}, Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors}`);

  return result;
}
```

**Dependencias Previas:**
- [INFRA-01] - Prisma Schema Extensions (AuditLog)
- [INFRA-03] - Database Migrations & Indexes
- Google Sheets API credentials configuradas

---

### [INT-02] QuickBooks Integration

**Contexto:**
El sistema necesita integración bidireccional con QuickBooks para sincronizar facturas, pagos, y clientes. QuickBooks Online API usa OAuth2 para autenticación. Esta integración permite eliminar dependencia de QuickBooks manual y automatizar conciliación de datos.

**Tarea Específica:**
Implementar integración completa con QuickBooks Online API:

1. **QuickBooks API Client:**
   - Crear `src/lib/integrations/quickbooks/client.ts`
   - Configurar OAuth2 flow (authorization code grant)
   - Funciones:
     - `authorize()`: Inicia OAuth2 flow
     - `exchangeCodeForToken(code)`: Exchange authorization code por access token
     - `refreshToken(refreshToken)`: Refresh access token
     - `revokeToken()`: Revocar access token
   - Token storage en DB (nuevo modelo o en User/Customer)
   - Token auto-refresh cuando expire (token寿命 1 hora)

2. **QuickBooks Service:**
   - Crear `src/lib/integrations/quickbooks/service.ts`
   - Funciones CRUD para:
     - `syncCustomerToQuickBooks(customer)`: Crear/actualizar customer en QB
     - `syncInvoiceToQuickBooks(invoice)`: Crear invoice en QB
     - `syncPaymentToQuickBooks(payment)`: Crear payment en QB
     - `getQuickBooksCustomer(qbCustomerId)`: Obtener customer de QB
     - `getQuickBooksInvoice(qbInvoiceId)`: Obtener invoice de QB
     - `getQuickBooksPayments(qbInvoiceId)`: Obtener pagos de invoice en QB
   - Mapeo de campos QB → DB y DB → QB
   - Manejo de errores y reintentos

3. **Bidirectional Sync Engine:**
   - Crear `src/lib/integrations/quickbooks/sync.ts`
   - Función `syncToQuickBooks(entityType, entityId)`: Sync DB → QB
   - Función `syncFromQuickBooks(entityType, qbEntityId)`: Sync QB → DB
   - Reconciliation engine: detectar y resolver conflicts
   - Estrategias:
     - Last-write-wins para updates
     - Merge strategy para customers
     - Append strategy para payments
   - Audit log de todos los syncs

4. **Webhook Handlers:**
   - Crear `src/app/api/v1/webhooks/quickbooks/route.ts`
   - Handle QB webhooks para events:
     - Customer created/updated
     - Invoice created/updated/paid
     - Payment created
   - Verify webhook signature (HMAC-SHA256)
   - Trigger sync from QuickBooks

5. **QuickBooks Sync UI:**
   - Crear `src/components/integrations/QuickBooksSync.tsx`
   - Botón "Connect to QuickBooks" (OAuth2 flow)
   - Status indicator (connected/disconnected)
   - Sync buttons: "Sync Customer", "Sync Invoice", "Sync All"
   - Sync history table (last sync time, status, errors)
   - Error messages detallados

6. **Reconciliation Dashboard:**
   - Crear página `src/app/(admin)/integrations/quickbooks/page.tsx`
   - Mostrar:
     - Customers pending sync
     - Invoices pending sync
     - Conflicts detected
     - Sync history
     - QuickBooks connection status
   - Actions: force sync, resolve conflicts

7. **Background Sync Job:**
   - Crear job scheduling (usando node-cron o similar)
   - Sync periódico de invoices y payments (ej: cada hora)
   - Auto-retry de syncs fallidos (exponential backoff)
   - Notificaciones de sync failures

**Constraints Técnicos:**
- Stack: TypeScript, QuickBooks Online API (Intuit OAuth2), Prisma, node-cron
- Patrones: Integration pattern, sync engine, reconciliation, webhook handling
- Requisitos: Bidirectional sync, conflict resolution, audit logging
- Testing: Unit tests para cada función, integration tests con QB sandbox
- Performance: Batch sync operations, caching de QB tokens
- Seguridad: OAuth2 secure flow, token encryption, webhook signature verification

**Output Esperado:**
- `src/lib/integrations/quickbooks/client.ts`
- `src/lib/integrations/quickbooks/service.ts`
- `src/lib/integrations/quickbooks/sync.ts`
- `src/app/api/v1/webhooks/quickbooks/route.ts`
- `src/components/integrations/QuickBooksSync.tsx`
- `src/app/(admin)/integrations/quickbooks/page.tsx`
- Background sync job: `jobs/quickbooks-sync.ts`
- Environment variables: QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, QUICKBOOKS_REDIRECT_URI
- Tests: `src/tests/unit/integrations/quickbooks/client.test.ts`, `service.test.ts`, `sync.test.ts`
- Tests: `src/tests/integration/integrations/quickbooks/flow.test.ts`
- Documentation: `docs/quickbooks-integration.md`

**Criterios de Aceptación:**
- [ ] QuickBooks OAuth2 flow funciona correctamente
- [ ] Token exchange y refresh funcionan
- [ ] Token storage en DB
- [ ] Sync customers DB → QB funciona
- [ ] Sync invoices DB → QB funciona
- [ ] Sync payments DB → QB funciona
- [ ] Get customers/invoices/payments desde QB funciona
- [ ] Bidirectional sync engine funciona
- [ ] Reconciliation detecta y resuelve conflicts
- [ ] Webhook handler recibe y procesa QB events
- [ ] Webhook signature verification funciona
- [ ] Sync UI conecta a QuickBooks
- [ ] Sync UI muestra status y history
- [ ] Reconciliation dashboard muestra pending syncs y conflicts
- [ ] Background sync job ejecuta periódicamente
- [ ] Auto-retry de syncs fallidos funciona
- [ ] Audit logging de todos los syncs
- [ ] Todos los tests unitarios pasan
- [ ] Todos los tests de integración pasan (con QB sandbox)

**Snippet de Ejemplo:**
```typescript
// src/lib/integrations/quickbooks/service.ts
import { PrismaClient } from '@prisma/client';
import { quickbooksClient } from './client';

const prisma = new PrismaClient();

export async function syncInvoiceToQuickBooks(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true, items: true },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Sync customer if needed
  if (!invoice.customer.quickbooksCustomerId) {
    await syncCustomerToQuickBooks(invoice.customer.id);
  }

  // Create invoice in QuickBooks
  const qbInvoice = await quickbooksClient.post('/v3/company/{realmId}/invoice', {
    CustomerRef: { value: invoice.customer.quickbooksCustomerId },
    TxnDate: invoice.issueDate.toISOString().split('T')[0],
    Line: invoice.items.map(item => ({
      Amount: item.quantity * item.price,
      Description: item.description,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        Qty: item.quantity,
        UnitPrice: item.price,
      },
    })),
  });

  // Update invoice with QB ID
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { quickbooksInvoiceId: qbInvoice.Invoice.Id },
  });

  // Log sync
  await prisma.auditLog.create({
    data: {
      action: 'SYNC_TO_QUICKBOOKS',
      entityType: 'Invoice',
      entityId: invoiceId,
      changes: { quickbooksInvoiceId: qbInvoice.Invoice.Id },
    },
  });
}
```

**Dependencias Previas:**
- [INFRA-01] - Prisma Schema Extensions (AuditLog)
- [INFRA-02] - Security & Authentication Improvements
- Base de facturación existente (Fase 1B)
- QuickBooks Developer Account y OAuth2 app configurado

---

### [INT-03] Make.com Webhook Integration

**Contexto:**
El sistema necesita recibir datos de Make.com vía webhooks para eliminar dependencia de Google Sheets. Make.com tiene workflows automatizados que envían datos de productos, precios, proveedores, y facturas. Necesitamos un endpoint robusto para recibir y procesar estos webhooks.

**Tarea Específica:**
Implementar integración completa con Make.com webhooks:

1. **Webhook Receiver:**
   - Crear `src/app/api/v1/webhooks/make/route.ts`
   - POST endpoint con:
     - API key validation (header: X-Make-API-Key)
     - Payload validation con Zod schemas
     - Idempotency handling (header: X-Make-Idempotency-Key)
     - Processing de eventos:
       - `product.created` / `product.updated`
       - `supplier.created` / `supplier.updated`
       - `price.created` / `price.updated`
       - `customer.created` / `customer.updated`
       - `invoice.created` / `invoice.updated`
     - Persistence en PostgreSQL
     - Log en WebhookLog model
   - Response format: `{ success: true, data: {...}, processed: true }`

2. **Payload Validation Schemas:**
   - Crear `src/lib/validation/webhooks/make.ts`
   - Zod schemas para cada event type:
     - ProductEvent: `{ eventType, data: { name, sku, category, unit }, idempotencyKey }`
     - SupplierEvent: `{ eventType, data: { name, email, phone }, idempotencyKey }`
     - PriceEvent: `{ eventType, data: { productId, supplierId, price, effectiveDate }, idempotencyKey }`
     - CustomerEvent: `{ eventType, data: { name, taxId, email }, idempotencyKey }`
     - InvoiceEvent: `{ eventType, data: { customerId, issueDate, total, status, items: [...] }, idempotencyKey }`
   - Validación de tipos, required fields, formats

3. **Event Processors:**
   - Crear `src/lib/webhooks/make/processors.ts`
   - Funciones para cada event type:
     - `processProductEvent(event)`: Crear/actualizar product
     - `processSupplierEvent(event)`: Crear/actualizar supplier
     - `processPriceEvent(event)`: Crear/actualizar product price
     - `processCustomerEvent(event)`: Crear/actualizar customer
     - `processInvoiceEvent(event)`: Crear/actualizar invoice + items
   - Transaction management (atomic operations)
   - Error handling con retry

4. **Idempotency Manager:**
   - Crear `src/lib/webhooks/make/idempotency.ts`
   - Check de idempotency key en WebhookLog
   - Si ya procesado: retornar resultado cacheado
   - Si no procesado: procesar y guardar resultado
   - TTL de 24 horas para idempotency cache

5. **Retry Logic:**
   - Crear `src/lib/webhooks/make/retry.ts`
   - Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 intentos)
   - Queue system para retries (in-memory Map)
   - Worker process para ejecutar retries en background
   - Failed webhooks logged con error details

6. **Webhook Logging:**
   - Log de todos los webhooks en WebhookLog model:
     - source: MAKE
     - eventType
     - payload (JSON)
     - response (JSON)
     - statusCode
     - idempotencyKey
     - processedAt
     - createdAt
   - Query webhooks por idempotencyKey, eventType, fecha

7. **Webhook Monitoring UI:**
   - Crear `src/app/(admin)/webhooks/make/page.tsx`
   - Mostrar:
     - Webhooks recientes (últimos 100)
     - Filter por eventType, status
     - Detalles de webhook (payload, response)
     - Retry failed webhooks button
     - Webhook statistics (total, success rate, error rate)
     - Re-process webhook button

8. **Health Check:**
   - Crear `src/app/api/v1/webhooks/make/health/route.ts`
   - Check que webhook endpoint está accessible
   - Check connection a DB
   - Check API key configuration
   - Return: `{ status: 'healthy', timestamp }`

**Constraints Técnicos:**
- Stack: Next.js 14 API Routes, TypeScript, Prisma, Zod
- Patrones: Webhook pattern, idempotency, retry logic, queue processing
- Requisitos: Idempotency, error handling, comprehensive logging
- Testing: Unit tests para validators y processors, integration tests para webhook endpoint
- Performance: Async processing para webhooks, non-blocking responses
- Seguridad: API key validation, input sanitization, rate limiting

**Output Esperado:**
- `src/app/api/v1/webhooks/make/route.ts`
- `src/app/api/v1/webhooks/make/health/route.ts`
- `src/lib/validation/webhooks/make.ts`
- `src/lib/webhooks/make/processors.ts`
- `src/lib/webhooks/make/idempotency.ts`
- `src/lib/webhooks/make/retry.ts`
- `src/app/(admin)/webhooks/make/page.tsx`
- Environment variables: MAKE_WEBHOOK_API_KEY
- Tests: `src/tests/unit/webhooks/make/validators.test.ts`, `processors.test.ts`
- Tests: `src/tests/integration/webhooks/make/endpoint.test.ts`
- Documentation: `docs/make-webhook-integration.md`

**Criterios de Aceptación:**
- [ ] Webhook endpoint recibe POST requests
- [ ] API key validation funciona (rechaza invalid keys)
- [ ] Payload validation con Zod funciona (rechaza invalid payloads)
- [ ] Idempotency handling funciona (no duplicados)
- [ ] Product events procesan correctamente (crean/actualizan products)
- [ ] Supplier events procesan correctamente
- [ ] Price events procesan correctamente (crean/actualizan product prices)
- [ ] Customer events procesan correctamente
- [ ] Invoice events procesan correctamente (crean invoices + items)
- [ ] Transaction management funciona (atomic operations)
- [ ] Retry logic con exponential backoff funciona
- [ ] Webhook logging crea entries en WebhookLog
- [ ] Webhook monitoring UI muestra webhooks recientes
- [ ] Webhook UI permite retry de failed webhooks
- [ ] Health check endpoint funciona
- [ ] Rate limiting aplicado (100 req/min)
- [ ] Todos los tests unitarios pasan
- [ ] Todos los tests de integración pasan
- [ ] Webhook procesamiento <1s (P95)

**Snippet de Ejemplo:**
```typescript
// src/app/api/v1/webhooks/make/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkIdempotency, saveIdempotency } from '@/lib/webhooks/make/idempotency';
import { processProductEvent, processSupplierEvent, processPriceEvent, processCustomerEvent, processInvoiceEvent } from '@/lib/webhooks/make/processors';
import { productEventSchema, supplierEventSchema, priceEventSchema, customerEventSchema, invoiceEventSchema } from '@/lib/validation/webhooks/make';
import { prisma } from '@/lib/db';

const MAKE_API_KEY = process.env.MAKE_WEBHOOK_API_KEY;

export async function POST(req: NextRequest) {
  // Validate API key
  const apiKey = req.headers.get('x-make-api-key');
  if (apiKey !== MAKE_API_KEY) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } }, { status: 401 });
  }

  // Parse payload
  const payload = await req.json();

  // Check idempotency
  const idempotencyKey = payload.idempotencyKey || req.headers.get('x-make-idempotency-key');
  if (idempotencyKey) {
    const cached = await checkIdempotency(idempotencyKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached, processed: false });
    }
  }

  // Validate payload
  let validatedPayload;
  let eventType: string;

  try {
    switch (payload.eventType) {
      case 'product.created':
      case 'product.updated':
        validatedPayload = productEventSchema.parse(payload);
        eventType = 'product';
        break;
      case 'supplier.created':
      case 'supplier.updated':
        validatedPayload = supplierEventSchema.parse(payload);
        eventType = 'supplier';
        break;
      case 'price.created':
      case 'price.updated':
        validatedPayload = priceEventSchema.parse(payload);
        eventType = 'price';
        break;
      case 'customer.created':
      case 'customer.updated':
        validatedPayload = customerEventSchema.parse(payload);
        eventType = 'customer';
        break;
      case 'invoice.created':
      case 'invoice.updated':
        validatedPayload = invoiceEventSchema.parse(payload);
        eventType = 'invoice';
        break;
      default:
        return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Unknown event type' } }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } }, { status: 400 });
  }

  // Process event
  let result;
  try {
    switch (eventType) {
      case 'product':
        result = await processProductEvent(validatedPayload);
        break;
      case 'supplier':
        result = await processSupplierEvent(validatedPayload);
        break;
      case 'price':
        result = await processPriceEvent(validatedPayload);
        break;
      case 'customer':
        result = await processCustomerEvent(validatedPayload);
        break;
      case 'invoice':
        result = await processInvoiceEvent(validatedPayload);
        break;
    }
  } catch (error) {
    // Log webhook failure
    await prisma.webhookLog.create({
      data: {
        source: 'MAKE',
        eventType: payload.eventType,
        payload,
        response: { error: error.message },
        statusCode: 500,
        idempotencyKey,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }

  // Log webhook success
  await prisma.webhookLog.create({
    data: {
      source: 'MAKE',
      eventType: payload.eventType,
      payload,
      response: result,
      statusCode: 200,
      idempotencyKey,
      processedAt: new Date(),
    },
  });

  // Save idempotency
  if (idempotencyKey) {
    await saveIdempotency(idempotencyKey, result);
  }

  return NextResponse.json({ success: true, data: result, processed: true });
}
```

**Dependencias Previas:**
- [INFRA-01] - Prisma Schema Extensions (WebhookLog model)
- [INFRA-02] - Security & Authentication Improvements
- Base de facturación existente (Fase 1B)
- Make.com workflows configurados para enviar webhooks

---

