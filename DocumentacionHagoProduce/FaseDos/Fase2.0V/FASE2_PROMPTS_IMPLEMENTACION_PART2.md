# SECCIÓN 4 - PROMPTS PARA IMPLEMENTACIÓN (PARTE 2)
# Hago Produce - Fase 2

**Fecha:** 22 de Febrero, 2026  
**Formato:** Prompts autocontenidos y profesionales para agentes IA

---

## 📋 Continuación de Prompts (FASE 4-8)

Este archivo contiene los prompts para las Fases 4-8 de la implementación. Para los prompts de Fases 1-3, ver `FASE2_PROMPTS_IMPLEMENTACION.md`.

---

### FASE 4: REPORTS & ANALYTICS (Prioridad 🔴 Alta)

---

### [REP-01] Reports Backend Service

**Contexto:**
El sistema necesita un servicio de reportes robusto para generar KPIs, métricas de ingresos, análisis de vencimiento, y top performers. Los reportes deben ser eficientes y escalables para soportar datasets grandes (10k+ invoices). El schema Prisma está extendido en [INFRA-01].

**Tarea Específica:**
Crear servicio de reportes backend con:

1. **KPIs Aggregation Service:**
   - Crear `src/lib/services/reports/kpi.service.ts`
   - Funciones:
     - `getOverallKPIs(startDate, endDate)`: Total revenue, invoice count, avg invoice, payment rate
     - `getRevenueByMonth(startDate, endDate)`: Monthly revenue trend
     - `getAgingMetrics(asOfDate)`: Aging buckets (0-30, 31-60, 61-90, 90+ days)
     - `getPaymentTrends(startDate, endDate)`: Payment collection trends
   - Usar Prisma aggregations (SUM, COUNT, AVG) no data fetching

2. **Revenue Service:**
   - Crear `src/lib/services/reports/revenue.service.ts`
   - Funciones:
     - `getRevenueByCustomer(startDate, endDate, limit)`: Top customers by revenue
     - `getRevenueByProduct(startDate, endDate, limit)`: Top products by revenue
     - `getRevenueByCategory(startDate, endDate)`: Revenue by product category
     - `getYoYComparison(currentYear, previousYear)`: Year-over-year comparison
   - Include: revenue, invoice count, avg invoice, growth rate

3. **Aging Report Service:**
   - Crear `src/lib/services/reports/aging.service.ts`
   - Función `getAgingReport(asOfDate, customerId?)`:
     - Invoices agrupadas por bucket de días overdue
     - Suma de amounts por bucket
     - Conteo de invoices por bucket
     - Porcentaje de total
   - Filtrable por customer

4. **Top Performers Service:**
   - Crear `src/lib/services/reports/top-performers.service.ts`
   - Funciones:
     - `getTopCustomers(limit, startDate, endDate)`: By revenue, by invoice count, by avg amount
     - `getTopProducts(limit, startDate, endDate)`: By revenue, by quantity, by margin
     - `getTopSuppliers(limit, startDate, endDate)`: By sales, by margin
   - Include: rank, name, metric value, percentage

5. **Price Trends Service:**
   - Crear `src/lib/services/reports/price-trends.service.ts`
   - Función `getPriceTrends(productId, months)`:
     - Historical prices por supplier
     - Average monthly price
     - Price volatility (std dev)
     - Best/cheapest supplier
     - Price change % vs previous month

6. **Report Caching:**
   - Crear `src/lib/services/reports/cache.service.ts`
   - Usar ReportCache model ([INFRA-01])
   - Cachear reportes costosos con TTL configurable (5-15 minutos)
   - Función `getCachedReport(reportType, parameters)`: Check cache
   - Función `setCachedReport(reportType, parameters, result, ttl)`: Save to cache
   - Cache invalidation strategy (time-based)

7. **Export Service:**
   - Crear `src/lib/services/reports/export.service.ts`
   - Función `exportToCSV(reportData, filename)`: Generate CSV file
   - Función `exportToPDF(reportData, filename)`: Generate PDF file
   - Librerías: csv-stringify para CSV, jspdf/jspdf-autotable para PDF
   - Proper formatting (headers, currency, percentages)

**Constraints Técnicos:**
- Stack: TypeScript, Prisma, PostgreSQL, csv-stringify, jspdf, jspdf-autotable
- Patrones: Service layer pattern, caching, aggregation strategies
- Requisitos: Performance (<2s para reports estándar, <15s para complejos)
- Testing: Unit tests para cada función, integration tests para reportes completos
- Performance: Database aggregations (no data fetching), caching, indexing
- Seguridad: Data filtering por role (customers solo ven sus datos)

**Output Esperado:**
- `src/lib/services/reports/kpi.service.ts`
- `src/lib/services/reports/revenue.service.ts`
- `src/lib/services/reports/aging.service.ts`
- `src/lib/services/reports/top-performers.service.ts`
- `src/lib/services/reports/price-trends.service.ts`
- `src/lib/services/reports/cache.service.ts`
- `src/lib/services/reports/export.service.ts`
- `src/lib/services/reports/index.ts` (barrel export)
- Tests: `src/tests/unit/reports/*.test.ts`
- Tests: `src/tests/integration/reports/service.test.ts`

**Criterios de Aceptación:**
- [ ] getOverallKPIs retorna total revenue, invoice count, avg invoice, payment rate
- [ ] getRevenueByMonth retorna monthly trend con 12 meses
- [ ] getAgingMetrics retorna buckets: 0-30, 31-60, 61-90, 90+ days
- [ ] getRevenueByCustomer retorna top customers con revenue, invoice count, growth
- [ ] getRevenueByProduct retorna top products con quantity, revenue, margin
- [ ] getRevenueByCategory retorna revenue por category
- [ ] getYoYComparison retorna comparison current vs previous year
- [ ] getAgingReport agrupa invoices por bucket, con sums y counts
- [ ] getAgingReport filtrable por customer
- [ ] getTopCustomers retorna top performers by revenue, count, avg
- [ ] getTopProducts retorna top performers by revenue, quantity, margin
- [ ] getTopSuppliers retorna top suppliers by sales, margin
- [ ] getPriceTrends retorna historical prices por supplier, avg monthly, volatility
- [ ] Caching funciona (hit/miss, TTL)
- [ ] exportToCSV genera CSV válido con headers
- [ ] exportToPDF genera PDF con tablas formateadas
- [ ] Todos los reports ejecutan en <2s (estándar)
- [ ] Todos los reports ejecutan en <15s (complejos)
- [ ] Data filtering por role funciona (customers solo sus datos)
- [ ] Todos los tests unitarios pasan (≥80% coverage)
- [ ] Todos los tests de integración pasan

**Snippet de Ejemplo:**
```typescript
// src/lib/services/reports/aging.service.ts
import { PrismaClient, InvoiceStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface AgingBucket {
  label: string;
  daysMin: number;
  daysMax: number;
  amount: number;
  count: number;
  percentage: number;
}

export interface AgingReport {
  asOfDate: Date;
  totalAmount: number;
  totalInvoices: number;
  buckets: AgingBucket[];
}

export async function getAgingReport(asOfDate: Date, customerId?: string): Promise<AgingReport> {
  const invoices = await prisma.invoice.findMany({
    where: {
      customerId,
      status: { in: [InvoiceStatus.SENT, InvoiceStatus.PENDING] },
      dueDate: { lte: asOfDate },
    },
    select: {
      total: true,
      dueDate: true,
    },
  });

  const buckets: AgingBucket[] = [
    { label: '0-30 días', daysMin: 0, daysMax: 30, amount: 0, count: 0, percentage: 0 },
    { label: '31-60 días', daysMin: 31, daysMax: 60, amount: 0, count: 0, percentage: 0 },
    { label: '61-90 días', daysMin: 61, daysMax: 90, amount: 0, count: 0, percentage: 0 },
    { label: '90+ días', daysMin: 91, daysMax: Infinity, amount: 0, count: 0, percentage: 0 },
  ];

  let totalAmount = 0;
  const totalInvoices = invoices.length;

  invoices.forEach(invoice => {
    const daysOverdue = Math.floor((asOfDate.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const bucket = buckets.find(b => daysOverdue >= b.daysMin && daysOverdue <= b.daysMax);
    if (bucket) {
      bucket.amount += invoice.total;
      bucket.count++;
      totalAmount += invoice.total;
    }
  });

  buckets.forEach(bucket => {
    bucket.percentage = totalAmount > 0 ? (bucket.amount / totalAmount) * 100 : 0;
  });

  return {
    asOfDate,
    totalAmount,
    totalInvoices,
    buckets,
  };
}
```

**Dependencias Previas:**
- [INFRA-01] - Prisma Schema Extensions (ReportCache model)
- [INFRA-03] - Database Migrations & Indexes
- Base de facturación existente (Fase 1B)

---
### [REP-02] Reports API Endpoints

**Contexto:**
El servicio de reportes backend está implementado en [REP-01]. Necesitamos crear endpoints API para exponer estos reportes al frontend, con validación, autenticación, rate limiting, y caching.

**Tarea Específica:**
Crear endpoints API para reportes:

1. **POST /api/v1/reports/kpi:**
   - Body: `{ startDate: string, endDate: string, customerId?: string }`
   - Response: `{ success: true, data: OverallKPIs }`
   - Auth: Todos los roles
   - Cache: 5 minutos

2. **POST /api/v1/reports/revenue:**
   - Body: `{ startDate: string, endDate: string, breakdown: 'customer'|'product'|'category', limit?: number }`
   - Response: `{ success: true, data: RevenueData }`
   - Auth: ADMIN, ACCOUNTING, MANAGEMENT
   - Cache: 10 minutos

3. **POST /api/v1/reports/aging:**
   - Body: `{ asOfDate?: string, customerId?: string }`
   - Response: `{ success: true, data: AgingReport }`
   - Auth: Todos los roles (customers solo sus datos)
   - Cache: 5 minutos

4. **POST /api/v1/reports/top:**
   - Body: `{ type: 'customers'|'products'|'suppliers', metric: 'revenue'|'count'|'margin', limit?: number, startDate?: string, endDate?: string }`
   - Response: `{ success: true, data: TopPerformers[] }`
   - Auth: ADMIN, ACCOUNTING, MANAGEMENT
   - Cache: 15 minutos

5. **POST /api/v1/reports/price-trends:**
   - Body: `{ productId: string, months?: number }`
   - Response: `{ success: true, data: PriceTrend[] }`
   - Auth: Todos los roles
   - Cache: 30 minutos

6. **POST /api/v1/reports/export/csv:**
   - Body: `{ reportType: 'kpi'|'revenue'|'aging'|'top'|'price-trends', parameters: {...} }`
   - Response: CSV file (text/csv)
   - Auth: ADMIN, ACCOUNTING, MANAGEMENT, CUSTOMER (solo sus datos)
   - Rate limit: 10 req/min

7. **POST /api/v1/reports/export/pdf:**
   - Body: `{ reportType: 'kpi'|'revenue'|'aging'|'top'|'price-trends', parameters: {...} }`
   - Response: PDF file (application/pdf)
   - Auth: ADMIN, ACCOUNTING, MANAGEMENT, CUSTOMER (solo sus datos)
   - Rate limit: 5 req/min

**Constraints Técnicos:**
- Stack: Next.js 14 API Routes, TypeScript, Prisma, Zod
- Patrones: RESTful, validation, caching, rate limiting
- Requisitos: Rate limiting (100 req/min), input validation, caching
- Testing: Integration tests para cada endpoint
- Performance: <500ms P95 response time (con cache)

**Output Esperado:**
- `src/app/api/v1/reports/kpi/route.ts`
- `src/app/api/v1/reports/revenue/route.ts`
- `src/app/api/v1/reports/aging/route.ts`
- `src/app/api/v1/reports/top/route.ts`
- `src/app/api/v1/reports/price-trends/route.ts`
- `src/app/api/v1/reports/export/csv/route.ts`
- `src/app/api/v1/reports/export/pdf/route.ts`
- `src/lib/validation/reports/index.ts` (Zod schemas)
- Tests: `src/tests/integration/reports/api.test.ts`

**Criterios de Aceptación:**
- [ ] Todos los endpoints retornan datos correctos del servicio de reportes
- [ ] Validación Zod rechaza requests inválidos con errores claros
- [ ] Auth y roles funcionan correctamente (customers solo sus datos)
- [ ] Rate limiting activo y funcional
- [ ] Caching funciona con TTLs configurados
- [ ] Export CSV genera CSV válido
- [ ] Export PDF genera PDF con tablas formateadas
- [ ] Error handling robusto con mensajes claros
- [ ] Todos los tests de integración pasan
- [ ] Response time P95 <500ms (con cache)

**Dependencias Previas:**
- [REP-01] - Reports Backend Service
- [INFRA-02] - Security & Authentication Improvements

---

### [REP-03] Reports Frontend Components

**Contexto:**
Los endpoints API de reportes están listos en [REP-02]. Necesitamos crear componentes frontend interactivos y atractivos para visualizar los reportes, con gráficos, filtros, y drill-down capabilities.

**Tarea Específica:**
Crear componentes de reports UI:

1. **Reports Dashboard Layout:**
   - Crear `src/app/(admin)/reports/page.tsx`
   - Header con: title, date range picker, export buttons
   - Grid de KPI cards (Total Revenue, Invoice Count, Avg Invoice, Payment Rate)
   - Charts section: Revenue trend, Aging chart, Top performers
   - Responsive layout (mobile-friendly)

2. **KPI Cards Component:**
   - Crear `src/components/reports/KPICard.tsx`
   - Props: `{ title, value, change, changeType, icon, color }`
   - Visualización: value con formato (currency, number), change indicator (↑/↓), icon
   - Animación: Fade-in, count-up animation para value
   - Colors: Green (positive), Red (negative), Blue (neutral)

3. **Date Range Picker:**
   - Crear `src/components/reports/DateRangePicker.tsx`
   - Integración con: react-day-picker o date-fns
   - Presets: Today, Last 7 days, Last 30 days, This Month, Last Month, Custom
   - Local storage para persistir selección

4. **Revenue Chart:**
   - Crear `src/components/reports/RevenueChart.tsx`
   - Librería: Recharts
   - Chart type: Line chart o Bar chart (toggleable)
   - Features: Zoom, Tooltip, Legend, Export image
   - Data: Monthly revenue trend con comparison previous year

5. **Aging Chart:**
   - Crear `src/components/reports/AgingChart.tsx`
   - Chart type: Bar chart horizontal o Donut chart (toggleable)
   - Data: Aging buckets con amounts y percentages
   - Colors: Green (0-30), Yellow (31-60), Orange (61-90), Red (90+)
   - Drill-down: Click bucket → list of invoices

6. **Top Performers Table:**
   - Crear `src/components/reports/TopPerformers.tsx`
   - Props: `{ type: 'customers'|'products'|'suppliers', data }`
   - Table con: Rank, Name, Metric, Growth, Action
   - Sorting por columnas
   - Pagination (10, 25, 50 items per page)
   - Drill-down: Click row → detail view

7. **Export Buttons:**
   - Crear `src/components/reports/ExportButtons.tsx`
   - Buttons: Export CSV, Export PDF
   - Dropdown con opciones: Include headers, specific format
   - Loading state durante export
   - Download automático del archivo

8. **Reports Service Hook:**
   - Crear `src/hooks/useReports.ts`
   - Hooks: `useKPIs()`, `useRevenue()`, `useAging()`, `useTopPerformers()`
   - State management: loading, data, error, refetch
   - Caching: 5 minutos con react-query o similar

**Constraints Técnicos:**
- Stack: Next.js 14, TypeScript, React 18, Recharts, Tailwind CSS
- Librerías: Recharts (gráficos), react-day-picker (date picker), jspdf (PDF export)
- Patrones: Component composition, hooks pattern, responsive design
- Requisitos: Mobile-first, accessibility (ARIA), keyboard navigation
- Testing: Unit tests para componentes, integration tests para hooks
- Performance: Virtual scrolling para tablas grandes, lazy loading de charts

**Output Esperado:**
- `src/app/(admin)/reports/page.tsx`
- `src/components/reports/KPICard.tsx`
- `src/components/reports/DateRangePicker.tsx`
- `src/components/reports/RevenueChart.tsx`
- `src/components/reports/AgingChart.tsx`
- `src/components/reports/TopPerformers.tsx`
- `src/components/reports/ExportButtons.tsx`
- `src/hooks/useReports.ts`
- Tests: `src/tests/unit/reports/components.test.ts`
- Tests: `src/tests/integration/reports/ui.test.ts`

**Criterios de Aceptación:**
- [ ] Reports dashboard muestra KPIs, charts, tables correctamente
- [ ] KPI cards tienen count-up animation y change indicators
- [ ] Date range picker funciona con presets y custom range
- [ ] Revenue chart muestra monthly trend con comparison
- [ ] Revenue chart es toggleable (line/bar)
- [ ] Aging chart muestra buckets con colors apropiados
- [ ] Aging chart es toggleable (bar/donut)
- [ ] Aging chart tiene drill-down a invoices
- [ ] Top performers table tiene sorting y pagination
- [ ] Top performers table tiene drill-down a detail view
- [ ] Export CSV/CSV buttons funcionan
- [ ] Export buttons tienen loading state y download automático
- [ ] Responsive en mobile, tablet, desktop
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] Todos los tests unitarios pasan (≥80% coverage)
- [ ] Todos los tests de integración pasan

**Dependencias Previas:**
- [REP-01] - Reports Backend Service
- [REP-02] - Reports API Endpoints
- UI components existentes (Shadcn/UI)

---

### [REP-04] Customer Portal Reports

**Contexto:**
Los reports del admin están completos en [REP-01]-[REP-03]. Necesitamos crear una versión simplificada y personalizada del portal de cliente para que los clientes puedan ver sus propios KPIs, facturas, y métricas.

**Tarea Específica:**
Crear reports dashboard para portal cliente:

1. **Customer Dashboard Page:**
   - Crear `src/app/(portal)/customer/dashboard/page.tsx`
   - Header con: "Mi Dashboard", date range picker (7, 30, 90 días)
   - KPI cards (solo del cliente):
     - Total a pagar (facturas pendientes)
     - Total pagado (mes actual, año actual)
     - Próximo vencimiento (invoice más próxima a vencer)
     - Promedio mensual de pagos
   - Charts simplificados:
     - Monthly payment trend (bar chart)
     - Aging chart (donut chart de facturas pendientes)
   - Recent invoices table (últimas 10 facturas)
   - Quick actions: "Pagar factura", "Ver todas las facturas", "Contactar soporte"

2. **Customer KPIs Component:**
   - Crear `src/components/reports/CustomerKPICard.tsx`
   - Props: `{ title, value, subtitle, action }`
   - Simplificado vs admin KPI cards (sin change indicator)
   - Action button: "Ver detalles", "Pagar", etc.

3. **Customer Aging Chart:**
   - Crear `src/components/reports/CustomerAgingChart.tsx`
   - Donut chart con: 0-30, 31-60, 61-90, 90+ días
   - Center text: "Total pendientes: $X,XXX"
   - Colors: Green, Yellow, Orange, Red
   - Drill-down: Click segment → list de facturas en ese bucket

4. **Customer Invoices Table:**
   - Crear `src/components/reports/CustomerInvoicesTable.tsx`
   - Columns: Invoice #, Fecha, Vencimiento, Total, Status, Acciones
   - Status badges: Pagado (green), Pendiente (yellow), Vencido (red)
   - Actions: "Ver PDF", "Pagar" (si pendiente), "Descargar"
   - Pagination (5, 10, 20 items)

5. **Customer Reports Hook:**
   - Actualizar `src/hooks/useReports.ts` (o crear `src/hooks/useCustomerReports.ts`)
   - Hooks: `useCustomerKPIs()`, `useCustomerAging()`, `useCustomerInvoices()`
   - Automatic filtering por customerId del usuario autenticado
   - Error handling user-friendly

**Constraints Técnicos:**
- Stack: Next.js 14, TypeScript, React 18, Recharts, Tailwind CSS
- Patrones: Customer-centric design, simplified UI, mobile-first
- Requisitos: Data isolation (solo datos del cliente), accessibility
- Testing: Unit tests, integration tests con customer auth
- Performance: Optimized para datasets más pequeños (1-2k invoices)

**Output Esperado:**
- `src/app/(portal)/customer/dashboard/page.tsx`
- `src/components/reports/CustomerKPICard.tsx`
- `src/components/reports/CustomerAgingChart.tsx`
- `src/components/reports/CustomerInvoicesTable.tsx`
- `src/hooks/useCustomerReports.ts`
- Tests: `src/tests/unit/reports/customer.test.ts`
- Tests: `src/tests/integration/reports/customer-dashboard.test.ts`

**Criterios de Aceptación:**
- [ ] Customer dashboard muestra KPIs del cliente correctamente
- [ ] KPI cards: total pendiente, total pagado, próximo vencimiento, promedio mensual
- [ ] Monthly payment trend chart muestra datos del cliente
- [ ] Aging chart muestra facturas pendientes del cliente
- [ ] Aging chart tiene drill-down a facturas específicas
- [ ] Recent invoices table muestra únicamente facturas del cliente
- [ ] Invoice table tiene status badges y actions apropiados
- [ ] "Pagar" action solo visible para facturas pendientes
- [ ] Data isolation funciona (cliente no ve datos de otros clientes)
- [ ] Responsive en mobile, tablet, desktop
- [ ] Todos los tests unitarios pasan
- [ ] Todos los tests de integración pasan

**Dependencias Previas:**
- [REP-01] - Reports Backend Service
- [REP-02] - Reports API Endpoints
- [REP-03] - Reports Frontend Components
- Portal auth existente (Fase 1C parcial)

---

