# 🎭 VibeCoding Prompts — Sprint 5: Hago Produce
**Arquitecto:** VibeCoding Prompt Architect  
**Basado en:** `CTO_STRATEGIC_DESIGN_SPRINT5.md`  
**Branch:** `sprint-5-planning`  
**Total de prompts:** 15 (13 implementación + 1 verificación final)

> **Instrucción de uso:** Ejecuta los prompts en el orden exacto indicado.  
> Cada prompt asume que el anterior fue ejecutado y verificado.  
> No saltes bloques. No combines prompts.

---

## BLOQUE 0 — PREREQUISITOS

---

### [S5-B0-01] CI/CD Pipeline Unificado
**Bloque:** Prerequisitos | **Dependencias:** ninguna

---

#### CONTEXTO DEL REPOSITORIO

Existen múltiples workflows en `.github/workflows/` que están fragmentados y en conflicto:
- `ci.yml` — lint + test + build (usa postgres service container, puerto 5432)
- `integration-tests.yml` — tests de integración con docker-compose (puerto 5434)
- `integration-tests-v2.yml` — duplicado del anterior con diferencias menores
- `deploy-preview.yml` — deploy a Railway (no a Vercel)
- `deploy-staging.yml` — deploy a Vercel staging (usa `amondnet/vercel-action@v25`)
- `codeql.yml` — análisis de seguridad (correcto, no tocar)

El archivo `jest.config.js` ya tiene `coverageThreshold` configurado:
```js
coverageThreshold: {
  global: { branches: 70, functions: 75, lines: 80, statements: 80 }
}
```

El `package.json` tiene estos scripts relevantes:
- `"test": "jest"`
- `"test:integration": "jest -c jest.integration.config.ts --runInBand"`
- `"lint": "next lint"`

Variables de entorno requeridas para CI (ya definidas en `ci.yml` existente):
`DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TELEGRAM_BOT_TOKEN`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

---

#### TAREA

Consolida y reemplaza los workflows fragmentados con un único pipeline CI/CD robusto. Crea un archivo `.github/workflows/ci.yml` que reemplace el actual, y actualiza `.github/workflows/deploy-staging.yml`. No toques `codeql.yml`.

El nuevo `ci.yml` debe ejecutar estos jobs en secuencia con dependencias explícitas:

**Job 1: `quality`** — lint + typecheck (rápido, falla rápido)
- `npm run lint`
- `npx tsc --noEmit`

**Job 2: `unit-tests`** — tests unitarios con coverage (depende de `quality`)
- Usa postgres service container en puerto 5432
- `npm test -- --coverage --ci --forceExit`
- Sube reporte de coverage como artifact (retención 7 días)
- Comenta en el PR el resumen de coverage usando `actions/github-script`

**Job 3: `build`** — build de producción (depende de `unit-tests`)
- `npm run build`
- Verifica que el build no falle

El nuevo `deploy-staging.yml` debe:
- Dispararse solo en push a `main` (no en PRs)
- Depender de que `ci.yml` pase (usando `workflow_run`)
- Usar Vercel CLI directamente (`npx vercel --prod`) en lugar de la action deprecada
- Requerir los secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Agregar un step de "smoke test" post-deploy: `curl -f $STAGING_URL/api/health`

Elimina (o marca como deprecated con comentario) los archivos:
- `.github/workflows/integration-tests.yml`
- `.github/workflows/integration-tests-v2.yml`
- `.github/workflows/deploy-preview.yml`

---

#### ARCHIVOS A CREAR / MODIFICAR

```
REEMPLAZAR: .github/workflows/ci.yml
REEMPLAZAR: .github/workflows/deploy-staging.yml
DEPRECAR:   .github/workflows/integration-tests.yml     (agregar comentario # DEPRECATED - ver ci.yml)
DEPRECAR:   .github/workflows/integration-tests-v2.yml  (agregar comentario # DEPRECATED - ver ci.yml)
DEPRECAR:   .github/workflows/deploy-preview.yml        (agregar comentario # DEPRECATED - ver deploy-staging.yml)
NO TOCAR:   .github/workflows/codeql.yml
```

---

#### CONTRATO TÉCNICO

**Secrets requeridos en GitHub (documentar en PR description):**
```
VERCEL_TOKEN          → Token de Vercel para deploy
VERCEL_ORG_ID         → ID de organización en Vercel
VERCEL_PROJECT_ID     → ID del proyecto en Vercel
CODECOV_TOKEN         → Token de Codecov (opcional, no falla si ausente)
STAGING_URL           → URL del entorno de staging para smoke test
```

**Variables de entorno en CI (hardcodeadas en workflow, no secrets):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hago_test
JWT_SECRET=test-jwt-secret-32-chars-minimum!!
OPENAI_API_KEY=test-key-not-real
TWILIO_ACCOUNT_SID=test-sid
TWILIO_AUTH_TOKEN=test-token
TELEGRAM_BOT_TOKEN=test-token
NEXTAUTH_SECRET=test-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
MAKE_WEBHOOK_API_KEY=test-make-key
MAKE_WEBHOOK_SECRET=test-secret
```

---

#### RESTRICCIONES

- NO elimines `codeql.yml` — es el análisis de seguridad y debe mantenerse
- NO uses `amondnet/vercel-action` — está deprecada, usa Vercel CLI directamente
- NO configures deploy en PRs — solo en push a `main`
- NO hagas que el CI falle si Codecov no está configurado (`fail_ci_if_error: false`)
- NO cambies los scripts de `package.json`
- NO agregues Redis, Docker Compose, ni servicios adicionales al CI — el volumen actual no lo justifica

---

#### CRITERIO DE DONE

- [ ] El workflow `ci.yml` tiene exactamente 3 jobs: `quality`, `unit-tests`, `build` con dependencias correctas
- [ ] El job `unit-tests` usa postgres service container (no docker-compose)
- [ ] El artifact de coverage se sube correctamente con retención de 7 días
- [ ] El workflow `deploy-staging.yml` solo se dispara en push a `main`
- [ ] Los 3 workflows deprecados tienen comentario `# DEPRECATED` en la primera línea
- [ ] `codeql.yml` no fue modificado
- [ ] El pipeline completo pasa en el branch `sprint-5-planning` sin errores

---

### [S5-B0-02] Staging Environment — Neon Branch + Vercel Preview
**Bloque:** Prerequisitos | **Dependencias:** S5-B0-01

---

#### CONTEXTO DEL REPOSITORIO

El proyecto usa:
- **Base de datos:** PostgreSQL en Neon (variable `DATABASE_URL` en `.env`)
- **Hosting:** Vercel (configurado en `deploy-staging.yml` del paso anterior)
- **ORM:** Prisma con migraciones en `prisma/migrations/`

Existe un archivo `prisma/seed-staging.ts` referenciado en `package.json`:
```json
"seed:staging": "ts-node --project tsconfig.seed.json prisma/seed-staging.ts"
```

Existe `.env.staging.example` con la estructura de variables para staging.

El archivo `railway.json` existe pero Railway se está abandonando en favor de Vercel+Neon.

---

#### TAREA

Crea la infraestructura de configuración para el entorno de staging. Esta tarea es de **configuración y documentación**, no de código de aplicación.

**Parte A — Seed de Staging:**
Crea o actualiza `prisma/seed-staging.ts` con datos de demo realistas para Hago Produce:
- 3 Suppliers: "Fresh Farms CA", "Pacific Produce", "Ontario Greens"
- 8 Products: manzana, naranja, aguacate, brócoli, zanahoria, limón, mango, espinaca (con `nameEs` y `name` en inglés)
- 12 ProductPrice records (2 precios por proveedor para productos seleccionados, con `isCurrent: true`)
- 2 Customers: "Restaurante El Maple" (taxId: "CA-001"), "Cafetería Toronto" (taxId: "CA-002")
- 1 User admin: email `admin@hagoproduce.ca`, password `Demo2025!` (hasheado con bcrypt)
- 3 Invoices en estados DRAFT, SENT, PAID para el customer "Restaurante El Maple"

**Parte B — Documentación de Setup:**
Crea `DocumentacionHagoProduce/FaseCinco/STAGING_SETUP.md` con instrucciones paso a paso para:
1. Crear un branch de base de datos en Neon (Neon soporta branches nativamente)
2. Configurar variables de entorno en Vercel para el entorno de staging
3. Ejecutar `npm run seed:staging` contra el branch de Neon
4. Verificar que el entorno de staging responde en `/api/health`

**Parte C — Variables de entorno:**
Actualiza `.env.staging.example` con todas las variables necesarias para Sprint 5 (incluyendo las nuevas que se agregarán en B0-03).

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR/ACTUALIZAR: prisma/seed-staging.ts
CREAR:            DocumentacionHagoProduce/FaseCinco/STAGING_SETUP.md
ACTUALIZAR:       .env.staging.example
```

---

#### CONTRATO TÉCNICO

**Input del seed:** ninguno (datos hardcodeados)

**Output esperado del seed:**
```typescript
{
  suppliers: 3,
  products: 8,
  prices: 12,
  customers: 2,
  users: 1,
  invoices: 3
}
```

**Variables de entorno en `.env.staging.example`:**
```env
DATABASE_URL="postgresql://[user]:[password]@[neon-host]/[db-staging]?sslmode=require"
DIRECT_URL="postgresql://[user]:[password]@[neon-host]/[db-staging]?sslmode=require"
JWT_SECRET="[min-32-chars-secret]"
OPENAI_API_KEY="[openai-key]"
OPENAI_MODEL="gpt-4o-mini"
TWILIO_ACCOUNT_SID="[twilio-sid]"
TWILIO_AUTH_TOKEN="[twilio-token]"
TWILIO_PHONE_NUMBER="[twilio-number]"
TELEGRAM_BOT_TOKEN="[telegram-token]"
RESEND_API_KEY="[resend-key]"
MAKE_WEBHOOK_API_KEY="[make-key]"
MAKE_WEBHOOK_SECRET="[make-secret]"
NEXTAUTH_SECRET="[nextauth-secret]"
NEXTAUTH_URL="https://[staging-url].vercel.app"
```

---

#### RESTRICCIONES

- NO uses datos de producción reales en el seed
- NO hardcodees passwords sin hashear — usa `bcrypt.hash('Demo2025!', 10)` en el seed
- NO crees el branch de Neon programáticamente — documenta el proceso manual en `STAGING_SETUP.md`
- NO modifiques `prisma/schema.prisma` en este paso — eso es B0-03
- NO uses `prisma db push` — usa `prisma migrate deploy` para aplicar migraciones

---

#### CRITERIO DE DONE

- [ ] `npm run seed:staging` ejecuta sin errores contra una DB de test local
- [ ] El seed crea exactamente: 3 suppliers, 8 products, 12 prices, 2 customers, 1 user, 3 invoices
- [ ] `STAGING_SETUP.md` tiene instrucciones para los 4 pasos documentados
- [ ] `.env.staging.example` tiene todas las variables listadas en el contrato
- [ ] El seed es idempotente: ejecutarlo dos veces no duplica datos (usa `upsert`)

---

### [S5-B0-03] Schema Migration Unificada — CRA Prep + PriceList + PreInvoice + BotDecision
**Bloque:** Prerequisitos | **Dependencias:** S5-B0-01, S5-B0-02

---

#### CONTEXTO DEL REPOSITORIO

El schema actual en `prisma/schema.prisma` tiene estos modelos relevantes:

**`Invoice`** — tiene `taxRate Decimal @default(0.13)` hardcodeado. NO tiene campos de provincia ni impuestos desglosados.

**`Customer`** — tiene `taxId String @unique`, `telegramChatId`, `preferredChannel`. NO tiene `businessNumber` ni `province`.

**`ProductPrice`** — tiene `source String? @default("manual")` como string libre. NO tiene relación con una entidad `PriceList`.

**`PurchaseOrder`** — tiene estados: `DRAFT, SENT, CONFIRMED, RECEIVED, CANCELLED`. Existe y funciona.

**NO existen** los modelos: `PriceList`, `PreInvoice`, `PreInvoiceItem`, `BotDecision`.

**NO existe** el enum `PriceSource`.

---

#### TAREA

Modifica `prisma/schema.prisma` para agregar todos los cambios de schema del Sprint 5 en **una sola migración**. Todos los campos nuevos son `nullable` o tienen `default` — no se rompen datos existentes.

Agrega exactamente lo siguiente:

**1. Enum `PriceSource`** (nuevo):
```prisma
enum PriceSource {
  MANUAL
  PDF_OCR
  MAKE_WEBHOOK
  API
}
```

**2. Enum `PreInvoiceStatus`** (nuevo):
```prisma
enum PreInvoiceStatus {
  DRAFT
  SENT
  APPROVED
  REJECTED
  CONVERTED
}
```

**3. Modelo `PriceList`** (nuevo):
```prisma
model PriceList {
  id            String      @id @default(uuid())
  supplierId    String      @map("supplier_id")
  name          String
  source        PriceSource @default(MANUAL)
  sourceRef     String?     @map("source_ref")
  effectiveDate DateTime    @map("effective_date")
  isActive      Boolean     @default(true) @map("is_active")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  supplier      Supplier    @relation(fields: [supplierId], references: [id])
  prices        ProductPrice[]

  @@map("price_lists")
  @@index([supplierId])
  @@index([isActive])
  @@index([effectiveDate])
}
```

**4. Modelo `PreInvoice`** (nuevo):
```prisma
model PreInvoice {
  id          String           @id @default(cuid())
  number      String           @unique
  customerId  String           @map("customer_id")
  status      PreInvoiceStatus @default(DRAFT)
  subtotal    Decimal          @db.Decimal(10, 2)
  taxAmount   Decimal          @map("tax_amount") @db.Decimal(10, 2)
  total       Decimal          @db.Decimal(10, 2)
  notes       String?
  invoiceId   String?          @unique @map("invoice_id")
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  customer    Customer         @relation(fields: [customerId], references: [id])
  items       PreInvoiceItem[]
  invoice     Invoice?         @relation(fields: [invoiceId], references: [id])

  @@map("pre_invoices")
  @@index([customerId])
  @@index([status])
}

model PreInvoiceItem {
  id            String     @id @default(cuid())
  preInvoiceId  String     @map("pre_invoice_id")
  productId     String     @map("product_id")
  description   String?
  quantity      Decimal    @db.Decimal(10, 2)
  unitPrice     Decimal    @map("unit_price") @db.Decimal(10, 2)
  totalPrice    Decimal    @map("total_price") @db.Decimal(10, 2)

  preInvoice    PreInvoice @relation(fields: [preInvoiceId], references: [id], onDelete: Cascade)
  product       Product    @relation(fields: [productId], references: [id])

  @@map("pre_invoice_items")
  @@index([preInvoiceId])
  @@index([productId])
}
```

**5. Modelo `BotDecision`** (nuevo):
```prisma
model BotDecision {
  id          String   @id @default(cuid())
  sessionId   String   @map("session_id")
  intent      String   @db.VarChar(50)
  params      Json
  result      Json?
  entityType  String?  @map("entity_type") @db.VarChar(50)
  entityId    String?  @map("entity_id")
  status      String   @default("pending") @db.VarChar(20)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("bot_decisions")
  @@index([sessionId])
  @@index([entityType, entityId])
  @@index([status])
}
```

**6. Campos nuevos en `Invoice`** (nullable — no rompe datos existentes):
```prisma
// Agregar dentro del modelo Invoice existente:
taxRegion       String?   @map("tax_region")
gstAmount       Decimal?  @map("gst_amount")   @db.Decimal(10, 2)
hstAmount       Decimal?  @map("hst_amount")   @db.Decimal(10, 2)
pstAmount       Decimal?  @map("pst_amount")   @db.Decimal(10, 2)
craXmlGenerated Boolean   @default(false)      @map("cra_xml_generated")
craSubmittedAt  DateTime? @map("cra_submitted_at")
preInvoice      PreInvoice?
```

**7. Campos nuevos en `Customer`** (nullable):
```prisma
// Agregar dentro del modelo Customer existente:
businessNumber  String?   @map("business_number")
province        String?   @default("ON")
```

**8. Campos nuevos en `ProductPrice`** (nullable):
```prisma
// Agregar dentro del modelo ProductPrice existente:
priceListId     String?   @map("price_list_id")
priceList       PriceList? @relation(fields: [priceListId], references: [id])
```

**9. Relación nueva en `Supplier`**:
```prisma
// Agregar dentro del modelo Supplier existente:
priceLists      PriceList[]
```

**10. Relación nueva en `Product`**:
```prisma
// Agregar dentro del modelo Product existente:
preInvoiceItems PreInvoiceItem[]
```

Después de modificar el schema, genera la migración con nombre descriptivo:
```bash
npx prisma migrate dev --name sprint5_core_schema
```

Actualiza también el cliente de Prisma:
```bash
npx prisma generate
```

---

#### ARCHIVOS A CREAR / MODIFICAR

```
MODIFICAR: prisma/schema.prisma
CREAR:     prisma/migrations/[timestamp]_sprint5_core_schema/migration.sql (generado automáticamente)
```

---

#### CONTRATO TÉCNICO

**Validación post-migración:**
```sql
-- Estas queries deben ejecutarse sin error después de la migración:
SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_region';
SELECT column_name FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'business_number';
SELECT table_name FROM information_schema.tables WHERE table_name = 'price_lists';
SELECT table_name FROM information_schema.tables WHERE table_name = 'pre_invoices';
SELECT table_name FROM information_schema.tables WHERE table_name = 'bot_decisions';
```

**Verificación de datos existentes:**
```sql
-- Los datos existentes deben estar intactos:
SELECT COUNT(*) FROM invoices;    -- debe ser igual al count pre-migración
SELECT COUNT(*) FROM customers;   -- debe ser igual al count pre-migración
SELECT COUNT(*) FROM product_prices; -- debe ser igual al count pre-migración
```

---

#### RESTRICCIONES

- NO uses `prisma db push` — usa `prisma migrate dev` para generar el archivo SQL de migración
- NO modifiques campos existentes — solo agrega campos nuevos
- NO hagas campos requeridos (NOT NULL sin default) — todos los campos nuevos son nullable o tienen default
- NO cambies el nombre de tablas o columnas existentes
- NO elimines ningún modelo o campo existente
- NO apliques la migración en producción — solo en staging y local
- NO cambies el enum `PurchaseOrderStatus`, `InvoiceStatus`, o `Role` existentes
- El campo `source` en `ProductPrice` sigue siendo `String?` por ahora — NO lo cambies a `PriceSource` enum (rompería datos existentes con valores "manual" y "make_automation")

---

#### CRITERIO DE DONE

- [ ] `npx prisma migrate dev` ejecuta sin errores
- [ ] `npx prisma generate` ejecuta sin errores
- [ ] `npx tsc --noEmit` pasa sin errores de tipos después de la migración
- [ ] Las 5 queries SQL de validación retornan resultados correctos
- [ ] Los counts de datos existentes son idénticos antes y después de la migración
- [ ] El archivo `migration.sql` generado contiene solo `ALTER TABLE ADD COLUMN` y `CREATE TABLE` — no `DROP` ni `ALTER COLUMN`

---

## BLOQUE 1 — CORE ERP

---

### [S5-B1-01] PriceList Entity + PriceVersioningService
**Bloque:** Core ERP | **Dependencias:** S5-B0-03

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que S5-B0-03 fue ejecutado y que:
- El modelo `PriceList` existe en `prisma/schema.prisma`
- El enum `PriceSource` existe en `prisma/schema.prisma`
- `ProductPrice` tiene el campo `priceListId String?`

El servicio existente `src/lib/services/product-prices/product-prices.service.ts` tiene:
- `ProductPriceService.getAll()` — lista precios con filtros
- `ProductPriceService.create()` — crea precio con versionado implícito (marca anteriores como `isCurrent: false`)
- `ProductPriceService.bulkUpdateFromMake()` — método que mezcla parsing de payload con lógica de dominio (este método se refactorizará en B2-04, no en este prompt)

La validación de precios está en `src/lib/validation/product-price.ts` con `productPriceSchema`.

---

#### TAREA

Crea dos servicios nuevos y actualiza la validación existente. No modifiques `ProductPriceService` — solo agrega los nuevos servicios.

**Servicio 1: `PriceVersioningService`** en `src/lib/services/pricing/price-versioning.service.ts`

Responsabilidad única: gestionar el ciclo de vida de versiones de precios (marcar anteriores como no vigentes, activar nuevos).

Métodos requeridos:
```typescript
class PriceVersioningService {
  // Marca todos los precios actuales de un producto-proveedor como isCurrent: false
  // Retorna el número de registros actualizados
  static async deactivateCurrent(
    productId: string,
    supplierId: string,
    tx?: Prisma.TransactionClient
  ): Promise<number>

  // Activa un precio específico (isCurrent: true) y desactiva los demás del mismo producto-proveedor
  static async activatePrice(
    priceId: string,
    tx?: Prisma.TransactionClient
  ): Promise<ProductPrice>

  // Retorna el historial de precios de un producto-proveedor ordenado por fecha desc
  static async getPriceHistory(
    productId: string,
    supplierId: string,
    limit?: number
  ): Promise<ProductPrice[]>
}
```

**Servicio 2: `PriceListService`** en `src/lib/services/pricing/price-list.service.ts`

Responsabilidad única: CRUD de listas de precios y asociación con `ProductPrice` records.

Métodos requeridos:
```typescript
class PriceListService {
  // Crea una nueva PriceList y opcionalmente asocia precios existentes
  static async create(data: CreatePriceListInput): Promise<PriceList>

  // Lista PriceLists con filtros (supplierId, source, isActive)
  static async getAll(filters: PriceListFilters): Promise<PaginatedResult<PriceList>>

  // Retorna una PriceList con sus precios incluidos
  static async getById(id: string): Promise<PriceListWithPrices | null>

  // Desactiva una PriceList (isActive: false) — no elimina
  static async deactivate(id: string): Promise<PriceList>
}
```

**Validación nueva** en `src/lib/validation/price-list.ts`:
```typescript
export const createPriceListSchema = z.object({
  supplierId: z.string().uuid(),
  name: z.string().min(1).max(200),
  source: z.nativeEnum(PriceSource).default('MANUAL'),
  sourceRef: z.string().optional(),
  effectiveDate: z.coerce.date().default(() => new Date()),
})

export const priceListFilterSchema = z.object({
  supplierId: z.string().uuid().optional(),
  source: z.nativeEnum(PriceSource).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})
```

**Tests unitarios** en `src/tests/unit/pricing/price-versioning.service.test.ts` y `src/tests/unit/pricing/price-list.service.test.ts`. Mockea `@/lib/db` con `jest.mock`.

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR: src/lib/services/pricing/price-versioning.service.ts
CREAR: src/lib/services/pricing/price-list.service.ts
CREAR: src/lib/validation/price-list.ts
CREAR: src/tests/unit/pricing/price-versioning.service.test.ts
CREAR: src/tests/unit/pricing/price-list.service.test.ts
```

---

#### CONTRATO TÉCNICO

**Input `CreatePriceListInput`:**
```typescript
interface CreatePriceListInput {
  supplierId: string;
  name: string;
  source: PriceSource;
  sourceRef?: string;
  effectiveDate: Date;
}
```

**Output `PriceListWithPrices`:**
```typescript
interface PriceListWithPrices extends PriceList {
  supplier: { id: string; name: string };
  prices: Array<ProductPrice & {
    product: { id: string; name: string; sku: string | null };
  }>;
  _count: { prices: number };
}
```

**Output `PaginatedResult<T>`:**
```typescript
interface PaginatedResult<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
```

---

#### RESTRICCIONES

- NO modifiques `ProductPriceService` — los nuevos servicios son aditivos
- NO llames a `ProductPriceService` desde `PriceVersioningService` — ambos usan Prisma directamente
- NO implementes lógica de parsing de PDFs — eso es B2-01
- NO implementes endpoints HTTP — eso es parte de B2-03
- NO uses Redis ni caché — lee directamente de PostgreSQL
- Los métodos de `PriceVersioningService` deben aceptar un `TransactionClient` opcional para poder usarse dentro de transacciones Prisma

---

#### CRITERIO DE DONE

- [ ] `PriceVersioningService.deactivateCurrent()` retorna el número correcto de registros actualizados en tests
- [ ] `PriceVersioningService.activatePrice()` desactiva todos los demás precios del mismo producto-proveedor en tests
- [ ] `PriceListService.create()` persiste correctamente con todos los campos en tests
- [ ] `PriceListService.getAll()` filtra por `supplierId`, `source`, `isActive` correctamente en tests
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Los tests de ambos servicios pasan con `npm test`
- [ ] Coverage de los nuevos archivos > 85%

---

### [S5-B1-02] PriceEngineService
**Bloque:** Core ERP | **Dependencias:** S5-B1-01

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que S5-B1-01 fue ejecutado y que:
- `PriceVersioningService` existe en `src/lib/services/pricing/price-versioning.service.ts`
- `PriceListService` existe en `src/lib/services/pricing/price-list.service.ts`

El intent `price_lookup` en `src/lib/services/chat/intents/price-lookup.ts` actualmente consulta `prisma.productPrice.findMany()` directamente con `isCurrent: true`. Este intent se actualizará para usar `PriceEngineService` en B3-03 (IntentRegistry refactor). En este prompt solo creas el servicio.

El intent `best_supplier` en `src/lib/services/chat/intents/best-supplier.ts` también consulta precios directamente. Mismo caso.

El `ProductService` en `src/lib/services/productService.ts` tiene `getAll()` y `getById()` — úsalos para resolver nombres de productos a IDs.

---

#### TAREA

Crea `PriceEngineService` en `src/lib/services/pricing/price-engine.service.ts`.

**Responsabilidad única:** Dado un producto y un contexto opcional (proveedor, fecha, cantidad), retornar el precio óptimo con su justificación. Solo lee datos — no hace CRUD, no conoce el chat, no conoce PDFs.

Métodos requeridos:
```typescript
class PriceEngineService {
  // Retorna el mejor precio disponible para un producto dado el contexto
  // "Mejor" = menor costPrice entre proveedores con isCurrent: true
  static async getBestPrice(input: PriceEngineInput): Promise<PriceEngineResult>

  // Retorna todos los precios actuales de un producto, ordenados por costPrice asc
  // Incluye margen calculado si sellPrice está disponible
  static async getPriceComparison(productId: string): Promise<PriceComparisonResult>

  // Busca productos por nombre (es/en) y retorna sus precios actuales
  // Usado por el chat para consultas de lenguaje natural
  static async searchByProductName(
    searchTerm: string,
    limit?: number
  ): Promise<PriceEngineResult[]>
}
```

**Tipos exactos:**
```typescript
interface PriceEngineInput {
  productId?: string;
  productName?: string;   // alternativa a productId para búsqueda por nombre
  supplierId?: string;    // si se especifica, filtra por proveedor
  date?: Date;            // si se especifica, busca precio vigente en esa fecha
  quantity?: number;      // reservado para lógica de volumen futura (no implementar aún)
}

interface PriceEngineResult {
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  costPrice: number;
  sellPrice: number | null;
  margin: number | null;        // (sellPrice - costPrice) / costPrice * 100, null si no hay sellPrice
  currency: string;
  effectiveDate: Date;
  priceListId: string | null;
  confidence: 'current' | 'historical' | 'not_found';
}

interface PriceComparisonResult {
  productId: string;
  productName: string;
  prices: PriceEngineResult[];
  bestPrice: PriceEngineResult | null;
  priceRange: { min: number; max: number } | null;
}
```

**Lógica de `getBestPrice`:**
1. Si se provee `productName` pero no `productId`, busca el producto por nombre (es/en, case-insensitive)
2. Busca `ProductPrice` donde `isCurrent: true` y `productId` coincide
3. Si se provee `supplierId`, filtra por ese proveedor
4. Si no hay precios `isCurrent`, busca el más reciente por `effectiveDate` (confidence: 'historical')
5. Si no hay ningún precio, retorna `confidence: 'not_found'` con valores null

**Tests unitarios** en `src/tests/unit/pricing/price-engine.service.test.ts`. Mockea `@/lib/db`.

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR: src/lib/services/pricing/price-engine.service.ts
CREAR: src/tests/unit/pricing/price-engine.service.test.ts
```

---

#### CONTRATO TÉCNICO

**Variables de entorno nuevas:** ninguna

**Queries Prisma que debe usar (sin N+1):**
```typescript
// getBestPrice — una sola query con include
prisma.productPrice.findMany({
  where: { productId, isCurrent: true, ...(supplierId ? { supplierId } : {}) },
  include: {
    product: { select: { id: true, name: true, nameEs: true } },
    supplier: { select: { id: true, name: true } },
  },
  orderBy: { costPrice: 'asc' },
  take: 10,
})
```

---

#### RESTRICCIONES

- NO hace CRUD — solo lectura (`findMany`, `findFirst`, `findUnique`)
- NO importa `PriceVersioningService` ni `PriceListService` — usa Prisma directamente
- NO conoce el chat, los intents, ni OpenAI
- NO implementa lógica de volumen/descuentos — el campo `quantity` en el input es reservado
- NO usa Redis ni caché — lee directamente de PostgreSQL
- NO lanza excepciones para "producto no encontrado" — retorna `confidence: 'not_found'`

---

#### CRITERIO DE DONE

- [ ] `getBestPrice({ productId: 'x' })` retorna el precio con menor `costPrice` entre proveedores en tests
- [ ] `getBestPrice({ productName: 'manzana' })` resuelve el nombre a ID y retorna precio en tests
- [ ] `getBestPrice()` con producto sin precios retorna `confidence: 'not_found'` en tests
- [ ] `getPriceComparison()` retorna todos los precios ordenados por `costPrice` asc en tests
- [ ] `searchByProductName('apple')` busca en `name` y `nameEs` case-insensitive en tests
- [ ] `margin` se calcula correctamente: `((sellPrice - costPrice) / costPrice) * 100` en tests
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Coverage del nuevo archivo > 90%

---

### [S5-B1-03] PreInvoiceService + Endpoints
**Bloque:** Core ERP | **Dependencias:** S5-B0-03

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que S5-B0-03 fue ejecutado y que:
- El modelo `PreInvoice` y `PreInvoiceItem` existen en `prisma/schema.prisma`
- El enum `PreInvoiceStatus` existe

El servicio `InvoicesService` en `src/lib/services/invoices.service.ts` tiene:
- `generateInvoiceNumber()` — genera números `INV-YYYY-NNNN`
- `create(data, userId?)` — crea factura con items en transacción
- `update(id, data, userId?)` — actualiza factura

La validación de facturas está en `src/lib/validation/invoices.ts` con `createInvoiceSchema`.

El middleware de autenticación está en `src/lib/auth/middleware.ts` con `getAuthenticatedUser(req)`.

El audit logger está en `src/lib/audit/logger.ts` con `logAudit(entry)`.

Los endpoints de facturas siguen el patrón en `src/app/api/v1/invoices/route.ts` — úsalo como referencia de estructura.

---

#### TAREA

Crea `PreInvoiceService` y sus endpoints HTTP. La prefactura es el documento que el cliente aprueba antes de que se genere la factura oficial.

**Servicio:** `src/lib/services/procurement/pre-invoice.service.ts`

```typescript
class PreInvoiceService {
  // Genera número PRE-YYYY-NNNN
  private async generatePreInvoiceNumber(tx: Prisma.TransactionClient): Promise<string>

  // Crea prefactura con items, calcula totales
  async create(data: CreatePreInvoiceInput, userId?: string): Promise<PreInvoiceWithDetails>

  // Lista prefacturas con filtros
  async getAll(filters: PreInvoiceFilters): Promise<PaginatedResult<PreInvoice>>

  // Retorna prefactura con customer e items
  async getById(id: string): Promise<PreInvoiceWithDetails | null>

  // Cambia estado con validación de transiciones permitidas
  // Transiciones: DRAFT→SENT, SENT→APPROVED, SENT→REJECTED, APPROVED→CONVERTED
  async updateStatus(id: string, status: PreInvoiceStatus, userId?: string): Promise<PreInvoice>

  // Convierte prefactura APPROVED en Invoice oficial
  // Crea Invoice con los mismos items, marca PreInvoice como CONVERTED
  // Retorna la Invoice creada
  async convertToInvoice(id: string, userId?: string): Promise<Invoice>
}
```

**Validación:** `src/lib/validation/pre-invoice.ts`
```typescript
export const createPreInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    description: z.string().optional(),
    quantity: z.number().min(0.01),
    unitPrice: z.number().min(0),
  })).min(1),
})

export const updatePreInvoiceStatusSchema = z.object({
  status: z.nativeEnum(PreInvoiceStatus),
})
```

**Endpoints HTTP:**
- `POST /api/v1/pre-invoices` — crear prefactura (requiere auth, rol ADMIN o ACCOUNTING)
- `GET /api/v1/pre-invoices` — listar con filtros `?customerId=&status=&page=&limit=` (requiere auth)
- `GET /api/v1/pre-invoices/[id]` — detalle (requiere auth)
- `PATCH /api/v1/pre-invoices/[id]/status` — cambiar estado (requiere auth)
- `POST /api/v1/pre-invoices/[id]/convert` — convertir a Invoice (requiere auth, solo si status=APPROVED)

Todos los endpoints siguen el formato de respuesta estándar del proyecto:
```typescript
{ success: true, data: { ... } }
{ success: false, error: { code: string, message: string } }
```

**Tests de integración** en `src/tests/unit/procurement/pre-invoice.service.test.ts`. Mockea `@/lib/db`.

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR: src/lib/services/procurement/pre-invoice.service.ts
CREAR: src/lib/validation/pre-invoice.ts
CREAR: src/app/api/v1/pre-invoices/route.ts
CREAR: src/app/api/v1/pre-invoices/[id]/route.ts
CREAR: src/app/api/v1/pre-invoices/[id]/status/route.ts
CREAR: src/app/api/v1/pre-invoices/[id]/convert/route.ts
CREAR: src/tests/unit/procurement/pre-invoice.service.test.ts
```

---

#### CONTRATO TÉCNICO

**Input `CreatePreInvoiceInput`:**
```typescript
interface CreatePreInvoiceInput {
  customerId: string;
  notes?: string;
  items: Array<{
    productId: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
}
```

**Output `PreInvoiceWithDetails`:**
```typescript
interface PreInvoiceWithDetails extends PreInvoice {
  customer: { id: string; name: string; taxId: string };
  items: Array<PreInvoiceItem & {
    product: { id: string; name: string; unit: string };
  }>;
}
```

**Cálculo de totales** (igual que `InvoicesService`):
```typescript
const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
const taxRate = 0.13; // hardcodeado por ahora — B4-02 lo reemplazará con TaxCalculationService
const taxAmount = subtotal * taxRate;
const total = subtotal + taxAmount;
```

---

#### RESTRICCIONES

- NO copies código de `InvoicesService` — crea `PreInvoiceService` independiente
- NO uses `taxRate` dinámico aún — hardcodea `0.13` con un comentario `// TODO: B4-02 TaxCalculationService`
- NO implementes notificaciones por WhatsApp/Telegram en este prompt — eso es scope futuro
- NO permitas convertir una prefactura que no esté en estado `APPROVED`
- NO elimines la prefactura al convertirla — solo cambia su status a `CONVERTED`
- El endpoint `POST /api/v1/pre-invoices/[id]/convert` debe retornar la `Invoice` creada, no la `PreInvoice`

---

#### CRITERIO DE DONE

- [ ] `PreInvoiceService.create()` genera número `PRE-YYYY-NNNN` correctamente en tests
- [ ] `PreInvoiceService.updateStatus()` rechaza transiciones inválidas (ej: DRAFT→APPROVED) en tests
- [ ] `PreInvoiceService.convertToInvoice()` crea una `Invoice` con los mismos items en tests
- [ ] `PreInvoiceService.convertToInvoice()` lanza error si status no es `APPROVED` en tests
- [ ] `POST /api/v1/pre-invoices` retorna 201 con la prefactura creada
- [ ] `POST /api/v1/pre-invoices/[id]/convert` retorna 201 con la Invoice creada
- [ ] `PATCH /api/v1/pre-invoices/[id]/status` retorna 400 para transiciones inválidas
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Coverage del servicio > 85%

---

### [S5-B1-04] CommandBus + BotDecision
**Bloque:** Core ERP | **Dependencias:** S5-B0-03, S5-B1-03

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que S5-B0-03 fue ejecutado y que el modelo `BotDecision` existe.

**Problema actual:** Los intents transaccionales del chat llaman directamente a servicios de dominio:
- `src/lib/services/chat/intents/create-purchase-order.ts` importa `purchaseOrdersService` directamente
- `src/lib/services/chat/intents/create-order.ts` importa `InvoicesService` directamente

Esto crea acoplamiento bidireccional: el chat conoce los servicios de dominio y viceversa.

El `ChatServiceContext` en `src/lib/chat/types.ts` tiene:
```typescript
interface ChatServiceContext {
  userId?: string;
  customerId?: string | null;
  pendingOrder?: any;
  pendingPurchaseOrders?: any;
  message?: any;
}
```

El `AuditLogger` en `src/lib/audit/logger.ts` tiene `logAudit(entry: AuditLogEntry)`.

---

#### TAREA

Crea un `CommandBus` ligero que sea el único punto de entrada para acciones transaccionales del chat. Luego migra los intents transaccionales para usarlo.

**Parte A — CommandBus:**

Crea `src/lib/chat/command-bus.ts`:

```typescript
// Tipos de comandos soportados
type CommandType = 
  | 'CREATE_PURCHASE_ORDER'
  | 'CONFIRM_PURCHASE_ORDER'
  | 'CANCEL_PURCHASE_ORDER'
  | 'CREATE_ORDER'
  | 'CONFIRM_ORDER'
  | 'CANCEL_ORDER';

interface Command {
  type: CommandType;
  sessionId: string;
  userId?: string;
  customerId?: string;
  params: Record<string, any>;
}

interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  requiresConfirmation?: boolean;
  confirmationData?: any;  // datos para mostrar al usuario antes de confirmar
}

class CommandBus {
  // Registra un handler para un tipo de comando
  register(type: CommandType, handler: CommandHandler): void
  
  // Ejecuta un comando:
  // 1. Persiste BotDecision con status 'pending'
  // 2. Ejecuta el handler
  // 3. Actualiza BotDecision con resultado (status: 'completed' o 'failed')
  // 4. Registra en AuditLog
  async execute(command: Command): Promise<CommandResult>
  
  // Retorna decisiones pendientes de confirmación para una sesión
  async getPendingDecisions(sessionId: string): Promise<BotDecision[]>
  
  // Confirma o cancela una decisión pendiente
  async resolveDecision(
    decisionId: string, 
    resolution: 'confirmed' | 'cancelled'
  ): Promise<CommandResult>
}

// Singleton exportado
export const commandBus = new CommandBus();
```

**Parte B — Migración de intents transaccionales:**

Actualiza `src/lib/services/chat/intents/create-purchase-order.ts`:
- Reemplaza la llamada directa a `purchaseOrdersService.createPurchaseOrder()` por `commandBus.execute({ type: 'CREATE_PURCHASE_ORDER', ... })`
- El intent ahora retorna `requiresConfirmation: true` con los datos de la PO para mostrar al usuario
- La confirmación real ocurre cuando el usuario responde "sí" y se ejecuta `CONFIRM_PURCHASE_ORDER`

Actualiza `src/lib/services/chat/intents/create-order.ts`:
- Mismo patrón: reemplaza llamada directa a `InvoicesService` por `commandBus.execute({ type: 'CREATE_ORDER', ... })`

**Registra los handlers** en `src/lib/chat/command-bus.ts` (al final del archivo):
```typescript
// Registrar handlers al inicializar
commandBus.register('CREATE_PURCHASE_ORDER', createPurchaseOrderHandler);
commandBus.register('CONFIRM_PURCHASE_ORDER', confirmPurchaseOrderHandler);
commandBus.register('CANCEL_PURCHASE_ORDER', cancelPurchaseOrderHandler);
commandBus.register('CREATE_ORDER', createOrderHandler);
commandBus.register('CONFIRM_ORDER', confirmOrderHandler);
commandBus.register('CANCEL_ORDER', cancelOrderHandler);
```

**Tests unitarios** en `src/tests/unit/chat/command-bus.test.ts`. Mockea `@/lib/db` y los servicios de dominio.

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR:    src/lib/chat/command-bus.ts
MODIFICAR: src/lib/services/chat/intents/create-purchase-order.ts
MODIFICAR: src/lib/services/chat/intents/create-order.ts
CREAR:    src/tests/unit/chat/command-bus.test.ts
```

---

#### CONTRATO TÉCNICO

**Flujo de `BotDecision` en la DB:**
```
execute() llamado
  → INSERT bot_decisions (status: 'pending', params: command.params)
  → handler ejecutado
  → UPDATE bot_decisions (status: 'completed'|'failed', result: handler result)
  → logAudit({ action: 'bot_command', entityType: 'bot_decision', entityId: decision.id })
```

**Variables de entorno nuevas:** ninguna

---

#### RESTRICCIONES

- NO reimplementes la lógica de negocio de `PurchaseOrdersService` ni `InvoicesService` en el CommandBus — los handlers deben llamar a esos servicios
- NO elimines los intents existentes — solo modifícalos para usar el CommandBus
- NO cambies la firma de `executeQuery()` en `query-executor.ts` — eso es B3-03
- NO implementes un event bus complejo — el CommandBus es síncrono y simple
- El CommandBus NO conoce OpenAI, NO construye prompts, NO formatea respuestas

---

#### CRITERIO DE DONE

- [ ] `commandBus.execute()` persiste `BotDecision` con status 'pending' antes de ejecutar el handler en tests
- [ ] `commandBus.execute()` actualiza `BotDecision` a 'completed' si el handler tiene éxito en tests
- [ ] `commandBus.execute()` actualiza `BotDecision` a 'failed' si el handler lanza error en tests
- [ ] `commandBus.getPendingDecisions()` retorna solo decisiones con status 'pending' en tests
- [ ] Los intents `create-purchase-order.ts` y `create-order.ts` ya no importan servicios de dominio directamente
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Los tests existentes de `create-order` y `create-purchase-order` siguen pasando

---

## BLOQUE 2 — PDF PIPELINE

---

### [S5-B2-01] PdfIngestionService
**Bloque:** PDF Pipeline | **Dependencias:** S5-B1-01

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que S5-B1-01 fue ejecutado y que `PriceListService` existe.

El proyecto tiene `pdf-parse` disponible en el ecosistema Node.js (instalar como dependencia). No hay ningún servicio de procesamiento de PDFs en el repositorio actualmente.

El `package.json` tiene `"openai": "^6.24.0"` instalado — el SDK oficial de OpenAI está disponible para usar structured outputs en la extracción.

Los proveedores envían ~20 PDFs/semana con listas de precios. El formato varía por proveedor pero siempre contiene: nombre de producto, precio, unidad, proveedor.

---

#### TAREA

Crea `PdfIngestionService` en `src/lib/services/documents/pdf-ingestion.service.ts`.

**Responsabilidad única:** Dado un buffer de PDF, extraer el texto crudo y retornarlo como string estructurado. No conoce el dominio de precios. No llama a Prisma. No llama a OpenAI directamente.

```typescript
interface PdfExtractionResult {
  rawText: string;
  pageCount: number;
  extractionMethod: 'pdf-parse' | 'fallback';
  metadata: {
    fileName?: string;
    fileSize: number;
    extractedAt: Date;
  };
}

interface PdfIngestionOptions {
  fileName?: string;
  maxPages?: number;  // default: 50
}

class PdfIngestionService {
  // Extrae texto de un buffer PDF
  // Usa pdf-parse como método primario
  // Si pdf-parse falla, retorna rawText vacío con extractionMethod: 'fallback'
  // NO lanza excepciones — siempre retorna PdfExtractionResult
  static async extractText(
    buffer: Buffer,
    options?: PdfIngestionOptions
  ): Promise<PdfExtractionResult>

  // Valida que el buffer es un PDF válido (magic bytes: %PDF)
  static isValidPdf(buffer: Buffer): boolean

  // Limpia el texto extraído: elimina caracteres de control, normaliza espacios
  static cleanText(rawText: string): string
}
```

**Instala la dependencia:**
```bash
npm install pdf-parse
npm install --save-dev @types/pdf-parse
```

**Tests unitarios** en `src/tests/unit/documents/pdf-ingestion.service.test.ts`.
Para los tests, crea un PDF de prueba mínimo como Buffer con el magic byte `%PDF-1.4` y contenido de texto simple.

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR:    src/lib/services/documents/pdf-ingestion.service.ts
CREAR:    src/tests/unit/documents/pdf-ingestion.service.test.ts
MODIFICAR: package.json (agregar pdf-parse)
```

---

#### CONTRATO TÉCNICO

**Input:** `Buffer` (contenido binario del PDF)

**Output:** `PdfExtractionResult` (nunca lanza, siempre retorna)

**Variables de entorno nuevas:** ninguna

---

#### RESTRICCIONES

- NO llames a OpenAI en este servicio — solo extracción de texto
- NO llames a Prisma en este servicio — solo procesamiento de buffer
- NO uses BullMQ ni colas — procesamiento síncrono
- NO lances excepciones — captura todos los errores y retorna `extractionMethod: 'fallback'`
- NO proceses más de 50 páginas por defecto — el volumen real es bajo
- El servicio es stateless — todos los métodos son `static`

---

#### CRITERIO DE DONE

- [ ] `isValidPdf()` retorna `true` para buffer que empieza con `%PDF` en tests
- [ ] `isValidPdf()` retorna `false` para buffer que no es PDF en tests
- [ ] `extractText()` retorna `PdfExtractionResult` sin lanzar excepciones incluso con buffer inválido en tests
- [ ] `cleanText()` elimina caracteres de control y normaliza espacios en tests
- [ ] `npm install pdf-parse` ejecuta sin errores
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Coverage del nuevo archivo > 85%

---

### [S5-B2-02] DocumentMapperService
**Bloque:** PDF Pipeline | **Dependencias:** S5-B2-01

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que S5-B2-01 fue ejecutado y que `PdfIngestionService` existe.

El `package.json` tiene `"openai": "^6.24.0"` instalado — usa el SDK oficial con structured outputs para el mapeo inteligente.

El schema de `ProductPrice` tiene estos campos relevantes:
- `productId: String` (UUID)
- `supplierId: String` (UUID)
- `costPrice: Decimal`
- `sellPrice: Decimal?`
- `currency: String @default("USD")`
- `effectiveDate: DateTime`
- `source: String? @default("manual")`
- `priceListId: String?` (nuevo, de B0-03)

Los productos en la DB tienen `name` (inglés) y `nameEs` (español). Los proveedores tienen `name`.

---

#### TAREA

Crea `DocumentMapperService` en `src/lib/services/documents/document-mapper.service.ts`.

**Responsabilidad única:** Dado texto crudo extraído de un PDF y un `supplierId`, retornar una lista de `MappedPriceItem` listos para persistir. Usa OpenAI structured outputs para el mapeo inteligente. No llama a Prisma directamente — recibe los datos de productos/proveedores como parámetro.

```typescript
interface MappedPriceItem {
  productNameRaw: string;      // nombre tal como aparece en el PDF
  productId: string | null;    // null si no se encontró match en la DB
  productNameMatched: string | null;
  supplierId: string;
  costPrice: number;
  sellPrice: number | null;
  currency: string;
  unit: string;
  confidence: number;          // 0-1, qué tan seguro está el mapper del match
  needsReview: boolean;        // true si confidence < 0.8
}

interface MappingResult {
  items: MappedPriceItem[];
  totalExtracted: number;
  totalMatched: number;
  totalNeedsReview: number;
  processingTimeMs: number;
}

interface ProductCatalogEntry {
  id: string;
  name: string;
  nameEs: string | null;
  unit: string;
}

class DocumentMapperService {
  // Mapea texto crudo a items de precio usando OpenAI structured outputs
  // productCatalog: lista de productos de la DB para hacer matching
  // supplierId: ID del proveedor al que pertenecen los precios
  static async mapPriceList(
    rawText: string,
    supplierId: string,
    productCatalog: ProductCatalogEntry[]
  ): Promise<MappingResult>

  // Calcula confidence score para un match producto-nombre
  // Usa similitud de strings (Levenshtein o similar simple)
  static calculateMatchConfidence(rawName: string, productName: string): number
}
```

**Prompt de OpenAI para structured outputs:**
```typescript
// Usa el SDK oficial: import OpenAI from 'openai'
// Usa response_format: { type: 'json_schema', json_schema: { ... } }
// El schema debe extraer: array de { product_name, cost_price, sell_price?, currency, unit }
// Temperatura: 0 (determinístico)
// Modelo: process.env.OPENAI_MODEL || 'gpt-4o-mini'
```

**Tests unitarios** en `src/tests/unit/documents/document-mapper.service.test.ts`.
Mockea el SDK de OpenAI (`jest.mock('openai')`).

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR: src/lib/services/documents/document-mapper.service.ts
CREAR: src/tests/unit/documents/document-mapper.service.test.ts
```

---

#### CONTRATO TÉCNICO

**Variables de entorno requeridas (ya existen):**
```
OPENAI_API_KEY   → ya existe en .env
OPENAI_MODEL     → ya existe en .env (default: gpt-4o-mini)
```

**Fallback si OpenAI falla:** retorna `MappingResult` con `items: []` y `totalExtracted: 0` — no lanza excepción.

---

#### RESTRICCIONES

- NO llames a Prisma directamente — recibe `productCatalog` como parámetro
- NO implementes lógica de persistencia — solo mapeo
- NO uses `fetch` directamente para llamar a OpenAI — usa el SDK oficial `openai`
- NO lances excepciones — captura errores de OpenAI y retorna resultado vacío
- NO implementes fuzzy matching complejo — `calculateMatchConfidence` puede ser simple (includes + Levenshtein básico)
- El servicio es stateless — todos los métodos son `static`

---

#### CRITERIO DE DONE

- [ ] `mapPriceList()` llama a OpenAI con structured outputs en tests (mock verifica la llamada)
- [ ] `mapPriceList()` retorna `MappingResult` vacío si OpenAI falla en tests
- [ ] `calculateMatchConfidence('apple', 'Apple')` retorna > 0.9 en tests
- [ ] `calculateMatchConfidence('manzana', 'Apple')` retorna < 0.5 en tests (nombres en idiomas distintos)
- [ ] `needsReview: true` cuando `confidence < 0.8` en tests
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Coverage del nuevo archivo > 80%

---

### [S5-B2-03] Ingestion Endpoint + PriceList Creation
**Bloque:** PDF Pipeline | **Dependencias:** S5-B2-01, S5-B2-02, S5-B1-01

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que fueron ejecutados:
- S5-B2-01: `PdfIngestionService` en `src/lib/services/documents/pdf-ingestion.service.ts`
- S5-B2-02: `DocumentMapperService` en `src/lib/services/documents/document-mapper.service.ts`
- S5-B1-01: `PriceListService` en `src/lib/services/pricing/price-list.service.ts` y `PriceVersioningService`

El endpoint de webhooks de Make.com en `src/app/webhooks/make/prices/route.ts` usa `ProductPriceService.bulkUpdateFromMake()`. Este endpoint se mantiene funcionando — no se toca en este prompt.

El middleware de autenticación está en `src/lib/auth/middleware.ts` con `getAuthenticatedUser(req)`.

El `AuditLogger` está en `src/lib/audit/logger.ts`.

---

#### TAREA

Crea el endpoint de ingestión de PDFs que orquesta el pipeline completo: PDF → texto → mapeo → persistencia.

**Endpoint:** `POST /api/v1/documents/ingest-pdf`

**Tipo de request:** `multipart/form-data` con campos:
- `file`: el archivo PDF (requerido)
- `supplierId`: UUID del proveedor (requerido)
- `priceListName`: nombre para la lista de precios (opcional, default: `"Lista {fecha}"`)

**Flujo del endpoint:**
1. Validar autenticación (requiere rol ADMIN o MANAGEMENT)
2. Parsear multipart form data
3. Validar que el archivo es un PDF válido (`PdfIngestionService.isValidPdf()`)
4. Extraer texto (`PdfIngestionService.extractText()`)
5. Obtener catálogo de productos de la DB (todos los productos activos)
6. Mapear texto a items de precio (`DocumentMapperService.mapPriceList()`)
7. Crear `PriceList` con `source: PDF_OCR` (`PriceListService.create()`)
8. Para cada item con `productId !== null` y `confidence >= 0.8`:
   - Usar `PriceVersioningService.deactivateCurrent()` dentro de transacción
   - Crear `ProductPrice` con `priceListId` y `source: 'pdf_ocr'`
9. Registrar en `AuditLog`
10. Retornar resultado con estadísticas

**Respuesta exitosa (201):**
```typescript
{
  success: true,
  data: {
    priceListId: string,
    priceListName: string,
    supplierId: string,
    stats: {
      totalExtracted: number,
      totalPersisted: number,
      totalNeedsReview: number,
      processingTimeMs: number
    },
    itemsNeedingReview: MappedPriceItem[]  // items con confidence < 0.8
  }
}
```

**Tests** en `src/tests/unit/documents/ingest-pdf.route.test.ts`. Mockea todos los servicios.

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR: src/app/api/v1/documents/ingest-pdf/route.ts
CREAR: src/tests/unit/documents/ingest-pdf.route.test.ts
```

---

#### CONTRATO TÉCNICO

**Límites:**
- Tamaño máximo de PDF: 10MB (retorna 413 si excede)
- Timeout: 30 segundos (procesamiento síncrono — el volumen de 20 PDFs/semana lo justifica)
- Solo acepta `application/pdf` o `multipart/form-data`

**Variables de entorno nuevas:** ninguna

---

#### RESTRICCIONES

- NO uses BullMQ ni colas — procesamiento síncrono
- NO proceses PDFs de más de 10MB — retorna 413
- NO persistas items con `confidence < 0.8` automáticamente — solo los retorna en `itemsNeedingReview`
- NO elimines precios existentes — usa `PriceVersioningService.deactivateCurrent()` que los marca como `isCurrent: false`
- NO toques el endpoint `/webhooks/make/prices` — ese se depreca en B2-04, no aquí

---

#### CRITERIO DE DONE

- [ ] `POST /api/v1/documents/ingest-pdf` retorna 401 sin autenticación en tests
- [ ] `POST /api/v1/documents/ingest-pdf` retorna 400 si el archivo no es PDF en tests
- [ ] `POST /api/v1/documents/ingest-pdf` retorna 413 si el archivo supera 10MB en tests
- [ ] `POST /api/v1/documents/ingest-pdf` retorna 201 con estadísticas correctas en tests
- [ ] Los items con `confidence < 0.8` aparecen en `itemsNeedingReview` y NO se persisten en tests
- [ ] Se crea una `PriceList` con `source: PDF_OCR` en tests
- [ ] Se registra en `AuditLog` en tests
- [ ] `npx tsc --noEmit` pasa sin errores

---

### [S5-B2-04] Deprecar Make.com Webhook + Nuevo Endpoint de Ingestión JSON
**Bloque:** PDF Pipeline | **Dependencias:** S5-B2-03, S5-B1-01

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que S5-B2-03 fue ejecutado.

**Endpoints existentes de Make.com que deben mantenerse funcionando:**
- `src/app/api/v1/webhooks/make/route.ts` — webhook general (productos, clientes, facturas, precios)
- `src/app/webhooks/make/prices/route.ts` — webhook específico de precios

El `ProductPriceService.bulkUpdateFromMake()` en `src/lib/services/product-prices/product-prices.service.ts` tiene lógica de parsing mezclada con lógica de dominio.

El nuevo endpoint de ingestión JSON reemplazará a Make.com para actualizaciones de precios, pero Make.com debe seguir funcionando durante la transición.

---

#### TAREA

**Parte A — Nuevo endpoint interno de ingestión de precios (JSON):**

Crea `POST /api/v1/documents/ingest-prices` como reemplazo interno de Make.com para actualizaciones de precios en formato JSON.

Request body:
```typescript
{
  supplierId: string;           // UUID del proveedor
  priceListName?: string;       // nombre de la lista (default: "Actualización {fecha}")
  prices: Array<{
    productId: string;          // UUID del producto (requerido — no por nombre)
    costPrice: number;
    sellPrice?: number;
    currency?: string;          // default: "CAD"
    effectiveDate?: string;     // ISO date, default: now()
  }>;
}
```

Flujo:
1. Validar autenticación (requiere rol ADMIN o MANAGEMENT)
2. Validar body con Zod
3. Crear `PriceList` con `source: API`
4. Para cada precio: `PriceVersioningService.deactivateCurrent()` + crear `ProductPrice` con `priceListId`
5. Registrar en `AuditLog`
6. Retornar estadísticas

**Parte B — Refactorizar `bulkUpdateFromMake()`:**

Extrae el parsing del payload de Make.com fuera de `ProductPriceService`. Crea un adaptador en `src/lib/services/documents/make-adapter.service.ts`:

```typescript
class MakeAdapterService {
  // Transforma el payload de Make.com al formato interno de ingestión de precios
  // Resuelve nombres de productos y proveedores a IDs
  static async transformMakePayload(payload: MakeWebhookPricePayload): Promise<IngestPricesInput>
}
```

Actualiza `ProductPriceService.bulkUpdateFromMake()` para usar `MakeAdapterService.transformMakePayload()` internamente. El comportamiento externo no cambia.

**Parte C — Deprecar endpoints de Make.com:**

Agrega un header `X-Deprecated: true` y un campo `_deprecated: true` en la respuesta de:
- `src/app/webhooks/make/prices/route.ts`
- `src/app/api/v1/webhooks/make/route.ts` (solo para eventos `price.*`)

Agrega un `console.warn('[DEPRECATED]')` en cada llamada a estos endpoints.

NO elimines los endpoints — solo márcalos como deprecated.

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR:    src/app/api/v1/documents/ingest-prices/route.ts
CREAR:    src/lib/services/documents/make-adapter.service.ts
MODIFICAR: src/lib/services/product-prices/product-prices.service.ts (usar MakeAdapterService)
MODIFICAR: src/app/webhooks/make/prices/route.ts (agregar deprecation headers)
MODIFICAR: src/app/api/v1/webhooks/make/route.ts (agregar deprecation warning para price.*)
CREAR:    src/tests/unit/documents/ingest-prices.route.test.ts
CREAR:    src/tests/unit/documents/make-adapter.service.test.ts
```

---

#### RESTRICCIONES

- NO elimines `src/app/webhooks/make/prices/route.ts` ni `src/app/api/v1/webhooks/make/route.ts`
- NO cambies la firma pública de `ProductPriceService.bulkUpdateFromMake()` — solo refactoriza internamente
- NO rompas los tests existentes de `make.route.test.ts`
- El nuevo endpoint `/api/v1/documents/ingest-prices` usa IDs directamente (no nombres) — es más estricto que Make.com

---

#### CRITERIO DE DONE

- [ ] `POST /api/v1/documents/ingest-prices` retorna 201 con estadísticas correctas en tests
- [ ] `POST /api/v1/documents/ingest-prices` crea `PriceList` con `source: API` en tests
- [ ] `MakeAdapterService.transformMakePayload()` resuelve nombres a IDs correctamente en tests
- [ ] Los endpoints de Make.com retornan header `X-Deprecated: true` en tests
- [ ] Los tests existentes de `make.route.test.ts` siguen pasando sin modificación
- [ ] `npx tsc --noEmit` pasa sin errores

---

## BLOQUE 3 — HARDENING

---

### [S5-B3-01] Coverage Críticos al 80%
**Bloque:** Hardening | **Dependencias:** S5-B1-04, S5-B2-04

---

#### CONTEXTO DEL REPOSITORIO

El `jest.config.js` tiene `coverageThreshold` configurado con `lines: 80`.

Los módulos con coverage crítico bajo (según reporte de Sprint 4):
- `src/lib/services/bot/api-key.service.ts` — **16%** (CRÍTICO — seguridad)
- `src/lib/services/chat/openai-client.ts` — **28%** (CRÍTICO — core IA)
- `src/app/api/v1/invoices/[id]/route.ts` — **41%**
- `src/app/api/v1/customers/[id]/route.ts` — **41%**
- `src/app/api/v1/webhooks/make/route.ts` — **51%**

Los tests existentes están en:
- `src/tests/unit/bot/api-key.service.test.ts` — tests parciales
- `src/tests/unit/chat/openai-client.test.ts` — tests parciales

---

#### TAREA

Agrega tests unitarios para llevar cada módulo crítico al target de coverage indicado. No reescribas los tests existentes — agrégalos.

**`api-key.service.ts` → 90% coverage:**
Agrega tests para los casos no cubiertos:
- `validateApiKey()` con key expirada (`expiresAt` en el pasado)
- `validateApiKey()` con key inactiva (`isActive: false`)
- `validateApiKey()` con rate limit excedido
- `rotateApiKey()` — genera nueva key y actualiza hash
- `revokeApiKey()` — marca como inactiva
- `listApiKeys()` — retorna lista paginada
- Manejo de errores de bcrypt

**`openai-client.ts` → 80% coverage:**
Agrega tests para:
- `classifyChatIntentWithOpenAI()` cuando OpenAI retorna JSON malformado
- `classifyChatIntentWithOpenAI()` cuando OpenAI retorna status 429 (rate limit)
- `classifyChatIntentWithOpenAI()` cuando OpenAI retorna status 500
- `formatResponse()` con todos los intents del fallback: `price_lookup`, `best_supplier`, `invoice_status`, `customer_balance`
- `formatResponse()` cuando OpenAI retorna contenido vacío
- `buildSystemPrompt()` para idioma 'en' y 'es'
- `buildUserPrompt()` para idioma 'en' y 'es'

**`invoices/[id]/route.ts` → 80% coverage:**
Agrega tests para:
- `GET /api/v1/invoices/[id]` — factura no encontrada (404)
- `GET /api/v1/invoices/[id]` — sin autenticación (401)
- `PUT /api/v1/invoices/[id]` — validación fallida (400)
- `DELETE /api/v1/invoices/[id]` — si existe

**`customers/[id]/route.ts` → 80% coverage:**
Agrega tests para:
- `GET /api/v1/customers/[id]` — cliente no encontrado (404)
- `PUT /api/v1/customers/[id]` — validación fallida (400)
- `DELETE /api/v1/customers/[id]` — si existe

**`webhooks/make/route.ts` → 75% coverage:**
Agrega tests para:
- Evento `price.created` con payload de nombres (Make format)
- Evento `invoice.created` completo
- Idempotency key duplicada (retorna respuesta cacheada)
- Rate limiting excedido (429)

---

#### ARCHIVOS A CREAR / MODIFICAR

```
MODIFICAR: src/tests/unit/bot/api-key.service.test.ts
MODIFICAR: src/tests/unit/chat/openai-client.test.ts
CREAR:     src/tests/unit/invoices/invoices-id.route.test.ts
CREAR:     src/tests/unit/customers/customers-id.route.test.ts
MODIFICAR: src/tests/unit/webhooks/make.route.test.ts
```

---

#### RESTRICCIONES

- NO reescribas tests existentes — solo agrega nuevos `it()` o `describe()` blocks
- NO cambies el código de producción para hacer los tests más fáciles — los tests deben probar el código real
- NO uses `jest.spyOn` en lugar de `jest.mock` para módulos externos (Prisma, bcrypt, fetch)
- Todos los tests deben ser determinísticos — no dependan de tiempo real ni datos externos

---

#### CRITERIO DE DONE

- [ ] `npm test -- --coverage` muestra `api-key.service.ts` ≥ 90% lines
- [ ] `npm test -- --coverage` muestra `openai-client.ts` ≥ 80% lines
- [ ] `npm test -- --coverage` muestra `invoices/[id]/route.ts` ≥ 80% lines
- [ ] `npm test -- --coverage` muestra `customers/[id]/route.ts` ≥ 80% lines
- [ ] `npm test -- --coverage` muestra `webhooks/make/route.ts` ≥ 75% lines
- [ ] `npm test` pasa con 0 tests fallando
- [ ] El coverage global supera el threshold configurado en `jest.config.js` (lines: 80)

---

### [S5-B3-02] PromptBuilder Refactor
**Bloque:** Hardening | **Dependencias:** S5-B1-04

---

#### CONTEXTO DEL REPOSITORIO

El archivo `src/lib/services/chat/openai-client.ts` tiene estas funciones de construcción de prompts hardcodeadas:
- `buildSystemPrompt(language)` — prompt del sistema para formatear respuestas
- `buildUserPrompt(intent, language, executionResult)` — prompt del usuario con datos JSON
- `buildIntentClassificationSystemPrompt(language)` — prompt para clasificar intents
- `fallbackFormat(intent, language, executionResult)` — formato de fallback sin OpenAI

Estas funciones están mezcladas con la lógica de llamada a la API de OpenAI en el mismo archivo.

El archivo `src/lib/services/chat/intents/create-purchase-order.ts` tiene su propia función `buildExtractFunctionDefinition(language)` — también debe migrarse.

---

#### TAREA

Extrae toda la lógica de construcción de prompts a `src/lib/chat/prompt-builder.ts`. Luego actualiza `openai-client.ts` para importar desde `PromptBuilder`.

**`src/lib/chat/prompt-builder.ts`:**

```typescript
// Responsabilidad única: construir strings de prompts
// NO llama a OpenAI, NO conoce el dominio de negocio, NO llama a Prisma

class PromptBuilder {
  // Prompt del sistema para formatear respuestas al usuario
  static buildResponseSystemPrompt(language: ChatLanguage): string

  // Prompt del usuario con datos de ejecución
  static buildResponseUserPrompt(
    intent: ChatIntent,
    language: ChatLanguage,
    executionResult: QueryExecutionResult
  ): string

  // Prompt del sistema para clasificación de intents
  static buildIntentClassificationSystemPrompt(language: ChatLanguage): string

  // Lista de intents soportados (para incluir en el prompt de clasificación)
  static getSupportedIntents(): ChatIntent[]

  // Formato de fallback cuando OpenAI no está disponible
  static buildFallbackResponse(
    intent: ChatIntent,
    language: ChatLanguage,
    executionResult: QueryExecutionResult
  ): string

  // Definición de función para extracción de parámetros de PO
  static buildPurchaseOrderExtractionFunction(language: ChatLanguage): object
}
```

**Actualiza `openai-client.ts`:**
- Importa `PromptBuilder` desde `@/lib/chat/prompt-builder`
- Reemplaza las llamadas a las funciones locales por `PromptBuilder.*`
- Elimina las funciones locales que fueron migradas
- El comportamiento externo de `classifyChatIntentWithOpenAI()` y `formatResponse()` NO cambia

**Actualiza `create-purchase-order.ts`:**
- Reemplaza `buildExtractFunctionDefinition()` por `PromptBuilder.buildPurchaseOrderExtractionFunction()`

**Tests unitarios** en `src/tests/unit/chat/prompt-builder.test.ts`:
- Verifica que cada método retorna strings no vacíos
- Verifica que los prompts en inglés y español son diferentes
- Verifica que `getSupportedIntents()` incluye todos los intents de `ChatIntent`
- Verifica que `buildFallbackResponse()` para `price_lookup` incluye el nombre del producto

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR:    src/lib/chat/prompt-builder.ts
MODIFICAR: src/lib/services/chat/openai-client.ts
MODIFICAR: src/lib/services/chat/intents/create-purchase-order.ts
CREAR:    src/tests/unit/chat/prompt-builder.test.ts
```

---

#### RESTRICCIONES

- NO cambies la firma pública de `classifyChatIntentWithOpenAI()` ni `formatResponse()`
- NO muevas la lógica de llamada HTTP a OpenAI — solo los builders de prompts
- `PromptBuilder` es stateless — todos los métodos son `static`
- `PromptBuilder` NO importa Prisma, NO importa servicios de dominio
- Los tests existentes de `openai-client.test.ts` deben seguir pasando sin modificación

---

#### CRITERIO DE DONE

- [ ] `PromptBuilder` tiene todos los métodos listados en el contrato
- [ ] `openai-client.ts` no tiene funciones `build*` locales — todas importadas de `PromptBuilder`
- [ ] Los tests existentes de `openai-client.test.ts` pasan sin modificación
- [ ] Los nuevos tests de `prompt-builder.test.ts` pasan
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Coverage de `prompt-builder.ts` > 90%

---

### [S5-B3-03] IntentRegistry Refactor
**Bloque:** Hardening | **Dependencias:** S5-B3-02, S5-B1-02, S5-B1-04

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que:
- S5-B3-02 fue ejecutado: `PromptBuilder` existe
- S5-B1-02 fue ejecutado: `PriceEngineService` existe
- S5-B1-04 fue ejecutado: `CommandBus` existe

El archivo `src/lib/services/chat/query-executor.ts` tiene un switch gigante con 13 ramas `if (intent === '...')`. Agregar un nuevo intent requiere modificar este archivo.

Los intents existentes están en `src/lib/services/chat/intents/`:
- `price-lookup.ts` — consulta `prisma.productPrice` directamente (debe actualizarse para usar `PriceEngineService`)
- `best-supplier.ts` — consulta `prisma.productPrice` directamente (debe actualizarse)
- `invoice-status.ts`, `customer-balance.ts`, `product-info.ts`, `inventory-summary.ts`, `overdue-invoices.ts` — no cambian

---

#### TAREA

Convierte el switch de `query-executor.ts` a un registry pattern. Actualiza los intents `price_lookup` y `best_supplier` para usar `PriceEngineService`.

**Parte A — IntentRegistry:**

Crea `src/lib/chat/intent-registry.ts`:

```typescript
type IntentHandler = (
  params: Record<string, any>,
  language: ChatLanguage,
  confidence: number,
  context?: ChatServiceContext
) => Promise<QueryExecutionResult>;

class IntentRegistry {
  private handlers = new Map<ChatIntent, IntentHandler>();

  register(intent: ChatIntent, handler: IntentHandler): void

  async execute(
    detected: DetectedIntent,
    language: ChatLanguage,
    context?: ChatServiceContext
  ): Promise<QueryExecutionResult>

  getRegisteredIntents(): ChatIntent[]
}

export const intentRegistry = new IntentRegistry();
```

**Parte B — Registrar todos los intents existentes:**

Al final de `intent-registry.ts`, registra todos los intents actuales:
```typescript
intentRegistry.register('price_lookup', priceLookupIntent);
intentRegistry.register('best_supplier', bestSupplierIntent);
// ... todos los demás
```

**Parte C — Actualizar `query-executor.ts`:**

Reemplaza el switch por:
```typescript
export async function executeQuery(
  detected: DetectedIntent,
  language: ChatLanguage,
  context?: ChatServiceContext,
): Promise<QueryExecutionResult> {
  return intentRegistry.execute(detected, language, context);
}
```

**Parte D — Actualizar `price-lookup.ts` para usar `PriceEngineService`:**

Reemplaza la query directa a Prisma por:
```typescript
import { PriceEngineService } from '@/lib/services/pricing/price-engine.service';

export async function priceLookupIntent(...) {
  const results = await PriceEngineService.searchByProductName(searchTerm, 20);
  // mapear PriceEngineResult[] al formato QueryExecutionResult existente
}
```

**Parte E — Actualizar `best-supplier.ts` para usar `PriceEngineService`:**

Reemplaza la query directa por `PriceEngineService.getPriceComparison(productId)`.

**Tests unitarios** en `src/tests/unit/chat/intent-registry.test.ts`.

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR:    src/lib/chat/intent-registry.ts
MODIFICAR: src/lib/services/chat/query-executor.ts
MODIFICAR: src/lib/services/chat/intents/price-lookup.ts
MODIFICAR: src/lib/services/chat/intents/best-supplier.ts
CREAR:    src/tests/unit/chat/intent-registry.test.ts
```

---

#### RESTRICCIONES

- NO cambies la firma pública de `executeQuery()` — los callers no deben cambiar
- NO elimines los archivos de intents existentes — solo modifícalos
- Los tests existentes de `query-executor.test.ts` deben seguir pasando
- `IntentRegistry` NO conoce OpenAI, NO construye prompts

---

#### CRITERIO DE DONE

- [ ] `intentRegistry.getRegisteredIntents()` retorna los 13 intents existentes en tests
- [ ] `intentRegistry.execute()` llama al handler correcto para cada intent en tests
- [ ] `intentRegistry.execute()` retorna resultado con `data: null` para intent no registrado en tests
- [ ] `query-executor.ts` no tiene ningún `if (intent === ...)` — solo delega al registry
- [ ] `price-lookup.ts` usa `PriceEngineService.searchByProductName()` en lugar de Prisma directo
- [ ] Los tests existentes de intents pasan sin modificación
- [ ] `npx tsc --noEmit` pasa sin errores

---

### [S5-B3-04] Queries N+1 Audit y Fix
**Bloque:** Hardening | **Dependencias:** S5-B3-03

---

#### CONTEXTO DEL REPOSITORIO

Los servicios con mayor riesgo de N+1 identificados:

**`ProductService.getAll()`** en `src/lib/services/productService.ts`:
- Hace `prisma.product.findMany()` sin `include` — no hay N+1 aquí, pero tampoco retorna precios
- El endpoint `GET /api/v1/products` es llamado frecuentemente por el chat

**`DashboardService`** (si existe) o los endpoints de reportes en `src/app/api/v1/reports/`:
- `src/app/api/v1/reports/revenue/route.ts` — agrega datos de facturas
- `src/app/api/v1/reports/aging/route.ts` — calcula aging de facturas
- `src/app/api/v1/reports/top/customers/route.ts` — top clientes

**`InvoicesService.getAll()`** en `src/lib/services/invoices.service.ts`:
- Incluye `customer` e `items` — verificar si hay N+1

**`PurchaseOrdersService`** en `src/lib/services/purchase-orders.service.ts`:
- Incluye `supplier` e `items` — verificar si hay N+1

---

#### TAREA

Audita y corrige los queries N+1 en los servicios identificados. Documenta los cambios.

**Paso 1 — Auditoría:**
Lee cada servicio listado y busca patrones N+1:
- Loops que hacen queries dentro (`for (const item of items) { await prisma... }`)
- `include` anidados sin `select` específico (trae columnas innecesarias)
- Múltiples queries separadas que podrían ser una sola con `include`

**Paso 2 — Fix en `ProductService.getAll()`:**
Agrega `select` específico para evitar traer columnas innecesarias:
```typescript
prisma.product.findMany({
  where,
  skip,
  take: limit,
  orderBy: { createdAt: 'desc' },
  select: {
    id: true, name: true, nameEs: true, category: true,
    unit: true, sku: true, isActive: true, createdAt: true,
    // NO incluir: description (texto largo), deletedAt, updatedAt
  }
})
```

**Paso 3 — Fix en reportes:**
Revisa `src/app/api/v1/reports/revenue/route.ts` y `aging/route.ts`. Si hay loops con queries, reemplaza por una sola query con `groupBy` o `aggregate` de Prisma.

**Paso 4 — Fix en `InvoicesService`:**
Verifica que `getAll()` usa `select` específico en el `include` de `customer`:
```typescript
include: {
  customer: { select: { id: true, name: true, taxId: true } },
  items: { select: { id: true, productId: true, quantity: true, unitPrice: true, totalPrice: true } }
}
```

**Paso 5 — Documentar:**
Crea `DocumentacionHagoProduce/FaseCinco/REFACTORING_LOG.md` con:
- Lista de queries N+1 encontrados
- Cambio aplicado para cada uno
- Latencia estimada antes/después (si se puede medir)

---

#### ARCHIVOS A CREAR / MODIFICAR

```
MODIFICAR: src/lib/services/productService.ts
MODIFICAR: src/lib/services/invoices.service.ts
MODIFICAR: src/app/api/v1/reports/revenue/route.ts (si hay N+1)
MODIFICAR: src/app/api/v1/reports/aging/route.ts (si hay N+1)
CREAR:     DocumentacionHagoProduce/FaseCinco/REFACTORING_LOG.md
```

---

#### RESTRICCIONES

- NO cambies la firma pública de ningún método — solo la implementación interna
- NO uses Redis — optimiza las queries de PostgreSQL directamente
- NO agregues caché — el `ReportCache` en PostgreSQL ya existe para reportes pesados
- NO rompas los tests existentes — los cambios de `select` no deben cambiar el shape de los datos retornados para los campos que sí se incluyen

---

#### CRITERIO DE DONE

- [ ] `REFACTORING_LOG.md` documenta al menos 3 queries N+1 encontrados y corregidos
- [ ] `ProductService.getAll()` usa `select` específico en lugar de `findMany` sin select
- [ ] `InvoicesService.getAll()` usa `select` específico en los `include`
- [ ] `npm test` pasa con 0 tests fallando después de los cambios
- [ ] `npx tsc --noEmit` pasa sin errores

---

## BLOQUE 4 — CRA PREP

---

### [S5-B4-01] TaxCalculationService
**Bloque:** CRA Prep | **Dependencias:** S5-B0-03

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que S5-B0-03 fue ejecutado y que:
- `Invoice` tiene los campos `taxRegion`, `gstAmount`, `hstAmount`, `pstAmount` (nullable)
- `Customer` tiene los campos `businessNumber`, `province` (nullable)

El campo `taxRate` en `Invoice` está hardcodeado a `0.13` en `InvoicesService.create()` y en `createInvoiceSchema` (`z.number().min(0).optional().default(0.13)`).

No existe ningún servicio de cálculo de impuestos en el repositorio.

---

#### TAREA

Crea `TaxCalculationService` en `src/lib/services/compliance/tax-calculation.service.ts`.

**Responsabilidad única:** Dado un monto y una provincia canadiense, calcular los impuestos desglosados (GST, HST, PST). Solo calcula — no genera XML, no llama a Prisma, no conoce el modelo `Invoice`.

```typescript
// Tasas de impuestos por provincia (2024-2025)
const CANADIAN_TAX_RATES: Record<string, ProvinceTaxConfig> = {
  'AB': { gst: 0.05, hst: 0,    pst: 0,    total: 0.05, name: 'Alberta' },
  'BC': { gst: 0.05, hst: 0,    pst: 0.07, total: 0.12, name: 'British Columbia' },
  'MB': { gst: 0.05, hst: 0,    pst: 0.07, total: 0.12, name: 'Manitoba' },
  'NB': { gst: 0,    hst: 0.15, pst: 0,    total: 0.15, name: 'New Brunswick' },
  'NL': { gst: 0,    hst: 0.15, pst: 0,    total: 0.15, name: 'Newfoundland and Labrador' },
  'NS': { gst: 0,    hst: 0.15, pst: 0,    total: 0.15, name: 'Nova Scotia' },
  'NT': { gst: 0.05, hst: 0,    pst: 0,    total: 0.05, name: 'Northwest Territories' },
  'NU': { gst: 0.05, hst: 0,    pst: 0,    total: 0.05, name: 'Nunavut' },
  'ON': { gst: 0,    hst: 0.13, pst: 0,    total: 0.13, name: 'Ontario' },
  'PE': { gst: 0,    hst: 0.15, pst: 0,    total: 0.15, name: 'Prince Edward Island' },
  'QC': { gst: 0.05, hst: 0,    pst: 0.09975, total: 0.14975, name: 'Quebec' },
  'SK': { gst: 0.05, hst: 0,    pst: 0.06, total: 0.11, name: 'Saskatchewan' },
  'YT': { gst: 0.05, hst: 0,    pst: 0,    total: 0.05, name: 'Yukon' },
};

interface ProvinceTaxConfig {
  gst: number;
  hst: number;
  pst: number;
  total: number;
  name: string;
}

interface TaxCalculationResult {
  province: string;
  provinceName: string;
  subtotal: number;
  gstAmount: number;
  hstAmount: number;
  pstAmount: number;
  totalTaxAmount: number;
  total: number;
  effectiveTaxRate: number;
}

class TaxCalculationService {
  // Calcula impuestos para un subtotal dado una provincia
  // Si la provincia no es válida, usa 'ON' como default con un warning
  static calculate(subtotal: number, province: string): TaxCalculationResult

  // Retorna la configuración de impuestos para una provincia
  static getProvinceConfig(province: string): ProvinceTaxConfig | null

  // Retorna todas las provincias soportadas
  static getSupportedProvinces(): string[]

  // Valida si un código de provincia es válido
  static isValidProvince(province: string): boolean
}
```

**Tests unitarios** en `src/tests/unit/compliance/tax-calculation.service.test.ts`:
- Testa todas las 13 provincias/territorios
- Verifica que Alberta (AB) tiene 0% HST/PST
- Verifica que Ontario (ON) tiene 13% HST
- Verifica que Quebec (QC) tiene GST + QST = ~14.975%
- Verifica que provincia inválida usa Ontario como default

---

#### ARCHIVOS A CREAR / MODIFICAR

```
CREAR: src/lib/services/compliance/tax-calculation.service.ts
CREAR: src/tests/unit/compliance/tax-calculation.service.test.ts
```

---

#### RESTRICCIONES

- NO genera XML CRA — eso es Sprint 6
- NO llama a Prisma — solo calcula con datos en memoria
- NO llama a APIs externas — las tasas están hardcodeadas en el servicio
- El servicio es stateless — todos los métodos son `static`
- Los montos deben redondearse a 2 decimales (`Math.round(amount * 100) / 100`)

---

#### CRITERIO DE DONE

- [ ] `TaxCalculationService.calculate(100, 'ON')` retorna `{ gstAmount: 0, hstAmount: 13, total: 113 }` en tests
- [ ] `TaxCalculationService.calculate(100, 'AB')` retorna `{ gstAmount: 5, hstAmount: 0, total: 105 }` en tests
- [ ] `TaxCalculationService.calculate(100, 'QC')` retorna `totalTaxAmount` ≈ 14.975 en tests
- [ ] `TaxCalculationService.calculate(100, 'INVALID')` usa Ontario como default en tests
- [ ] `getSupportedProvinces()` retorna exactamente 13 provincias/territorios en tests
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] Coverage del nuevo archivo > 95%

---

### [S5-B4-02] Invoice Tax Calculation Update
**Bloque:** CRA Prep | **Dependencias:** S5-B4-01, S5-B0-03

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que:
- S5-B4-01 fue ejecutado: `TaxCalculationService` existe
- S5-B0-03 fue ejecutado: `Invoice` tiene campos `taxRegion`, `gstAmount`, `hstAmount`, `pstAmount`
- `Customer` tiene campo `province`

El `InvoicesService.create()` en `src/lib/services/invoices.service.ts` actualmente:
```typescript
const taxRate = invoiceData.taxRate || 0.13;
const taxAmount = subtotal * taxRate;
const total = subtotal + taxAmount;
```

El `createInvoiceSchema` en `src/lib/validation/invoices.ts` tiene:
```typescript
taxRate: z.number().min(0).optional().default(0.13),
```

---

#### TAREA

Actualiza `InvoicesService.create()` para usar `TaxCalculationService` cuando el cliente tiene `province` configurada. Mantén compatibilidad hacia atrás para facturas sin provincia.

**Actualiza `InvoicesService.create()`:**

```typescript
async create(data: CreateInvoiceInput, userId?: string) {
  const { items, ...invoiceData } = data;

  // Calcular subtotal
  let subtotal = 0;
  const calculatedItems = items.map(item => {
    const total = item.quantity * item.unitPrice;
    subtotal += total;
    return { ...item, totalPrice: total };
  });

  // Obtener provincia del cliente para cálculo de impuestos
  const customer = await prisma.customer.findUnique({
    where: { id: invoiceData.customerId },
    select: { province: true }
  });

  let taxRegion: string | null = null;
  let gstAmount: number | null = null;
  let hstAmount: number | null = null;
  let pstAmount: number | null = null;
  let taxAmount: number;
  let taxRate: number;

  if (customer?.province) {
    // Usar TaxCalculationService si el cliente tiene provincia
    const taxResult = TaxCalculationService.calculate(subtotal, customer.province);
    taxRegion = customer.province;
    gstAmount = taxResult.gstAmount;
    hstAmount = taxResult.hstAmount;
    pstAmount = taxResult.pstAmount;
    taxAmount = taxResult.totalTaxAmount;
    taxRate = taxResult.effectiveTaxRate;
  } else {
    // Fallback: usar taxRate del input (compatibilidad hacia atrás)
    taxRate = invoiceData.taxRate || 0.13;
    taxAmount = subtotal * taxRate;
    // taxRegion, gstAmount, hstAmount, pstAmount quedan null
  }

  const total = subtotal + taxAmount;

  // Crear factura con campos CRA (nullable si no hay provincia)
  const invoice = await prisma.$transaction(async (tx) => {
    const number = await this.generateInvoiceNumber(tx);
    return tx.invoice.create({
      data: {
        ...invoiceData,
        number,
        subtotal,
        taxRate,
        taxAmount,
        total,
        taxRegion,
        gstAmount,
        hstAmount,
        pstAmount,
        // craXmlGenerated: false (default del schema)
        items: { create: calculatedItems }
      },
      include: { items: true }
    });
  });

  await logInvoiceCreate(userId, { ... });
  return invoice;
}
```

**Actualiza los tests existentes** en `src/tests/unit/invoices.service.test.ts`:
- Agrega test: cliente con `province: 'ON'` → `hstAmount` calculado correctamente
- Agrega test: cliente con `province: 'AB'` → `gstAmount: 5%`, `hstAmount: 0`
- Agrega test: cliente sin `province` → comportamiento anterior (taxRate 0.13, campos CRA null)

---

#### ARCHIVOS A CREAR / MODIFICAR

```
MODIFICAR: src/lib/services/invoices.service.ts
MODIFICAR: src/tests/unit/invoices.service.test.ts
```

---

#### RESTRICCIONES

- NO hagas `taxRegion` requerido — debe ser nullable para compatibilidad hacia atrás
- NO cambies la firma pública de `InvoicesService.create()` — los callers no deben cambiar
- NO generes XML CRA — solo calcula y persiste los montos desglosados
- Los tests existentes de `InvoicesService` deben seguir pasando

---

#### CRITERIO DE DONE

- [ ] `InvoicesService.create()` con cliente `province: 'ON'` persiste `hstAmount: subtotal * 0.13` en tests
- [ ] `InvoicesService.create()` con cliente `province: 'AB'` persiste `gstAmount: subtotal * 0.05`, `hstAmount: 0` en tests
- [ ] `InvoicesService.create()` con cliente sin `province` persiste `taxRegion: null`, `gstAmount: null` en tests
- [ ] Los tests existentes de `InvoicesService` pasan sin modificación
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] `npm test` pasa con 0 tests fallando

---

## PROMPT FINAL — VERIFICACIÓN DE INTEGRACIÓN

---

### [S5-VERIFY] Sprint 5 Integration Verification
**Bloque:** Verificación Final | **Dependencias:** TODOS los prompts anteriores

---

#### CONTEXTO DEL REPOSITORIO

Este prompt asume que todos los prompts S5-B0-01 hasta S5-B4-02 fueron ejecutados.

---

#### TAREA

Ejecuta la verificación completa del Sprint 5. Este prompt no genera código nuevo — solo verifica que todo está integrado correctamente.

**Verificación 1 — TypeScript:**
```bash
npx tsc --noEmit
```
Debe pasar con 0 errores.

**Verificación 2 — Tests:**
```bash
npm test -- --coverage --ci --forceExit
```
Debe pasar con:
- 0 tests fallando
- Coverage global ≥ 80% (lines)
- `api-key.service.ts` ≥ 90%
- `openai-client.ts` ≥ 80%

**Verificación 3 — Build:**
```bash
npm run build
```
Debe completar sin errores.

**Verificación 4 — Schema:**
```bash
npx prisma validate
npx prisma generate
```
Debe pasar sin errores.

**Verificación 5 — Lint:**
```bash
npm run lint
```
Debe pasar con 0 errores.

**Verificación 6 — Integración de servicios:**
Verifica manualmente que:
- [ ] `PriceEngineService` es importado por `intent-registry.ts` (no por `price-lookup.ts` directamente)
- [ ] `CommandBus` es importado por los intents transaccionales (no los servicios de dominio directamente)
- [ ] `PromptBuilder` es importado por `openai-client.ts` (no tiene funciones `build*` locales)
- [ ] `TaxCalculationService` es importado por `InvoicesService`
- [ ] Ningún intent importa directamente `PurchaseOrdersService` o `InvoicesService`

**Verificación 7 — Nuevas rutas API:**
Verifica que existen los archivos:
- [ ] `src/app/api/v1/pre-invoices/route.ts`
- [ ] `src/app/api/v1/pre-invoices/[id]/route.ts`
- [ ] `src/app/api/v1/pre-invoices/[id]/status/route.ts`
- [ ] `src/app/api/v1/pre-invoices/[id]/convert/route.ts`
- [ ] `src/app/api/v1/documents/ingest-pdf/route.ts`
- [ ] `src/app/api/v1/documents/ingest-prices/route.ts`

**Verificación 8 — Schema migrations:**
```bash
npx prisma migrate status
```
Debe mostrar que todas las migraciones están aplicadas.

**Verificación 9 — Deprecaciones:**
Verifica que los endpoints de Make.com tienen el header `X-Deprecated: true`:
- [ ] `src/app/webhooks/make/prices/route.ts` tiene `X-Deprecated` header
- [ ] `src/app/api/v1/webhooks/make/route.ts` tiene `console.warn('[DEPRECATED]')` para eventos `price.*`

**Verificación 10 — Documentación:**
Verifica que existen los documentos:
- [ ] `DocumentacionHagoProduce/FaseCinco/STAGING_SETUP.md`
- [ ] `DocumentacionHagoProduce/FaseCinco/REFACTORING_LOG.md`

---

#### CRITERIO DE DONE (Sprint 5 Completo)

- [ ] `npx tsc --noEmit` → 0 errores
- [ ] `npm test -- --coverage` → 0 tests fallando, coverage ≥ 80%
- [ ] `npm run build` → build exitoso
- [ ] `npx prisma validate` → schema válido
- [ ] `npm run lint` → 0 errores
- [ ] Todos los boundaries de dominio respetados (ningún intent importa servicios de dominio directamente)
- [ ] Todos los nuevos endpoints existen
- [ ] Endpoints de Make.com marcados como deprecated (no eliminados)
- [ ] `TaxCalculationService` calcula impuestos para las 13 provincias canadienses
- [ ] `PriceEngineService` retorna precios óptimos con margen calculado
- [ ] `PreInvoiceService` permite el flujo DRAFT→SENT→APPROVED→CONVERTED
- [ ] `CommandBus` persiste `BotDecision` para todas las acciones transaccionales del chat
- [ ] Pipeline PDF funciona end-to-end: PDF → texto → mapeo → PriceList → ProductPrice

---

*Fin de la serie de prompts Sprint 5 — Hago Produce*  
*Generado por VibeCoding Prompt Architect basado en CTO_STRATEGIC_DESIGN_SPRINT5.md*