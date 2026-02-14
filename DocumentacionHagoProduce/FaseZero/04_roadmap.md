# HAGO PRODUCE — Roadmap por Fases

---

## Visión general del timeline

```
2025 Jul    Aug    Sep    Oct    Nov    Dec    2026 Jan    Feb    Mar    Apr
 |----------|------|------|------|------|------|----------|------|------|---->
 |  FASE 0  | FASE 1A          | FASE 1B          | FASE 1C  |FASE 2|
 | Fundación| Core Backend +   | Facturas +        | Chat +   |Extras|
 |          | Auth + Productos | Panel Contable    | Portal   |      |
 |          |                  |                    | Cliente  |      |
 |__________|__________________|____________________|__________|______|
                                                              ^
                                                              |
                                                    META: Dejar QuickBooks
                                                    antes del 01/04/2026
```

---

## FASE 0: Fundación (2-3 semanas)
**Objetivo:** Establecer la infraestructura base, el entorno de desarrollo y las bases del proyecto.

### Entregables

| # | Tarea | Detalle | Criterio de aceptación |
|---|-------|---------|----------------------|
| 0.1 | Setup del repositorio | Monorepo Next.js 14 + TailwindCSS + shadcn/ui. Estructura de carpetas definida. | Repo en GitHub con README, .env.example, estructura base. |
| 0.2 | Configuración de railway | Proyecto creado en railway. PostgreSQL configurado. Auth habilitado. | Conexión exitosa desde local. Migraciones iniciales corriendo. |
| 0.3 | CI/CD básico | GitHub Actions: lint, test, deploy a Vercel (preview en PR, production en main). | PR genera preview URL. Merge a main despliega automáticamente. |
| 0.4 | Diseño UI/UX en Figma | Wireframes de las pantallas principales: Login, Dashboard, Lista de facturas, Crear factura, Detalle de factura, Productos, Chat. | Figma con vistas por rol aprobadas por stakeholders. |
| 0.5 | Modelo de datos implementado | Migraciones de Prisma con todas las tablas del ERD. Seed data para desarrollo. | `npx prisma migrate dev` ejecuta sin errores. Seed crea datos de prueba. |
| 0.6 | Documentación técnica base | Arquitectura C4, modelo de datos, contratos de API documentados. | Documentos revisados y aprobados. |

### Milestone: ✅ Infraestructura lista, equipo puede empezar a desarrollar features.

---

## FASE 1A: Core Backend + Auth + Productos (4-5 semanas)
**Objetivo:** Tener el backend funcional con autenticación, gestión de usuarios, productos y proveedores.

### Entregables

| # | Tarea | Detalle | Criterio de aceptación |
|---|-------|---------|----------------------|
| 1A.1 | Auth Module (backend) | Login, registro, refresh token, middleware JWT, roles. | Login funcional. Token JWT válido. Roles verificados en middleware. |
| 1A.2 | Auth UI (frontend) | Pantalla de login, protección de rutas por rol, redirect según rol. | Usuario puede loguearse y ver solo las vistas de su rol. |
| 1A.3 | Users CRUD | API + UI para gestionar usuarios internos (solo admin). | Admin puede crear, editar, desactivar usuarios. |
| 1A.4 | Suppliers CRUD | API + UI para gestionar proveedores. | Admin puede crear, editar, listar proveedores. |
| 1A.5 | Products CRUD | API + UI para gestionar productos con búsqueda y filtros. | Admin puede crear, editar, buscar productos. Lista paginada funcional. |
| 1A.6 | Product Prices CRUD | API + UI para ver y gestionar precios por producto-proveedor. | Se pueden ver todos los precios de un producto. Se puede agregar/editar precio. |
| 1A.7 | Webhook de precios (Make.com) | Endpoint `POST /webhooks/make/prices` + autenticación por API Key. | Make.com puede enviar precios y se actualizan en BD. Endpoint probado con Postman/curl. |
| 1A.8 | Customers CRUD | API + UI para gestionar clientes. | Admin puede crear, editar, buscar clientes. |
| 1A.9 | Layout y navegación | Sidebar, header, breadcrumbs, responsive. Vistas diferenciadas por rol. | Navegación fluida. Sidebar muestra solo opciones del rol. Mobile-friendly. |

### Milestone: ✅ Sistema base funcional. Catálogo de productos con precios actualizados desde Make.com.

---

## FASE 1B: Facturas + Panel Contable (4-5 semanas)
**Objetivo:** Funcionalidad completa de facturación que permita reemplazar QuickBooks.

### Entregables

| # | Tarea | Detalle | Criterio de aceptación |
|---|-------|---------|----------------------|
| 1B.1 | Crear factura (backend) | API `POST /invoices` con cálculos automáticos, numeración secuencial, items. | Factura se crea con número auto-generado, cálculos correctos de subtotal/tax/total. |
| 1B.2 | Crear factura (frontend) | Formulario con: selección de cliente, búsqueda de productos (autocomplete), agregar líneas, cálculo en tiempo real. | Admin puede crear una factura completa en menos de 3 minutos. Autocomplete de productos funcional. |
| 1B.3 | Editar factura | API `PUT /invoices/:id` + UI. Solo facturas en estado `draft`. | Se puede editar una factura borrador. No se pueden editar facturas enviadas/pagadas. |
| 1B.4 | Lista de facturas con filtros | API `GET /invoices` con filtros + UI con tabla, paginación, filtros por estado/cliente/fecha/búsqueda. | Contabilidad puede filtrar facturas por cualquier combinación de criterios. |
| 1B.5 | Detalle de factura | Vista completa de una factura: datos del cliente, items, totales, estado, historial de estados, notas. | Toda la información de una factura visible en una sola pantalla. |
| 1B.6 | Cambio de estado | API `PATCH /invoices/:id/status` + UI con botones/dropdown. Validación de transiciones. | Contabilidad puede cambiar estados. Transiciones inválidas son rechazadas. Historial registrado. |
| 1B.7 | Notas internas | API + UI para agregar y ver notas internas por factura. | Se pueden agregar notas. Solo visibles para usuarios internos. |
| 1B.8 | Historial de estados | Tabla `invoice_status_history` + vista en detalle de factura. | Se puede ver quién cambió el estado, cuándo y por qué. |
| 1B.9 | Generación de PDF | Generar PDF de factura con diseño profesional (logo, datos, items, totales). | PDF descargable con diseño limpio. Datos correctos. |
| 1B.10 | Audit log | Registro automático de todas las acciones sobre facturas. | Cada creación, edición, cambio de estado queda registrado con usuario, fecha y detalle. |

### Milestone: ✅ Sistema de facturación completo. Se puede dejar de usar QuickBooks para crear facturas.

### 🎯 Criterio de éxito clave:
> Un usuario Admin puede crear una factura completa (seleccionar cliente, agregar productos con autocomplete, revisar totales) en **menos de 3 minutos**.

---

## FASE 1C: Chat/Agente + Portal de Cliente (3-4 semanas)
**Objetivo:** Chat interno operativo y portal básico para clientes externos.

### Entregables

| # | Tarea | Detalle | Criterio de aceptación |
|---|-------|---------|----------------------|
| 1C.1 | Chat Module (backend) | API `POST /chat/query` con integración a LLM (OpenAI). Function calling para consultar BD. | El agente responde correctamente a consultas de precios, proveedores y estados de facturas. |
| 1C.2 | Chat UI (frontend) | Interfaz de chat en el portal interno. Input de texto, respuestas formateadas, indicador de carga. | Usuario interno puede hacer preguntas y recibir respuestas en menos de 5 segundos. |
| 1C.3 | Intents del agente | Implementar intents: `price_lookup`, `best_supplier`, `invoice_status`, `customer_balance`, `product_info`. | Cada intent devuelve datos correctos de la BD. Respuestas en español e inglés según preferencia. |
| 1C.4 | Portal de cliente (auth) | Login separado para clientes (`POST /auth/customer-login`). Autenticación por TaxID + password. | Cliente puede loguearse con sus credenciales. |
| 1C.5 | Portal de cliente (vistas) | Dashboard simple: facturas del cliente, filtros por fecha/estado, estado de cuenta, descarga de PDF. | Cliente ve solo sus facturas. Puede filtrar y descargar PDFs. |
| 1C.6 | Notificaciones básicas | Motor de notificaciones para cambio de estado. Integración con al menos un canal (email o Telegram). | Al cambiar estado de factura, se envía notificación al cliente. Log registrado. |

### Milestone: ✅ Chat/Agente operativo. Clientes pueden consultar sus facturas online.

---

## FASE 2: Mejoras y extensiones (Post-MVP, continuo)
**Objetivo:** Funcionalidades deseables que mejoran la experiencia pero no son críticas para el lanzamiento.

### Entregables planificados

| # | Tarea | Prioridad | Descripción |
|---|-------|-----------|-------------|
| 2.1 | Reportes y gráficos | Alta | Dashboard con KPIs: facturación mensual, aging de cuentas, top clientes, top productos. Exportación CSV/PDF. |
| 2.2 | Migración completa de Google Sheets | Alta | Make.com envía datos solo al backend. Google Sheets se desactiva como fuente de datos. Bot lee directamente de BD. |
| 2.3 | Historial de precios y tendencias | Media | Gráficos de evolución de precios por producto/proveedor. Alertas de cambios significativos. |
| 2.4 | Bot externo (WhatsApp/Telegram) | Media | Bot que consulta directamente la API del sistema. Clientes pueden consultar estado de cuenta por chat. |
| 2.5 | SPA pública | Media | Sitio web público para promover HAGO PRODUCE. Catálogo visual, contacto, información de la empresa. |
| 2.6 | Notificaciones avanzadas | Media | Recordatorios automáticos de vencimiento (3, 7, 14, 30 días). Multi-canal (WhatsApp + Telegram + Email). |
| 2.7 | Portal de cliente avanzado | Baja | Dashboard con gráficos de compras, historial completo, descarga masiva de facturas. |
| 2.8 | Multi-moneda avanzada | Baja | Soporte completo para USD, CAD, MXN con tasas de cambio automáticas. |
| 2.9 | Pagos online | Baja | Integración con pasarela de pagos (Stripe) para que clientes paguen facturas online. |
| 2.10 | App móvil (PWA) | Baja | Progressive Web App para acceso móvil optimizado. |

---

## Resumen de hitos y fechas objetivo

| Fase | Hito | Fecha objetivo | Dependencias |
|------|------|---------------|-------------|
| **Fase 0** | Infraestructura lista | Semana 3 (~Jul 2025) | Aprobación de diseño Figma |
| **Fase 1A** | Core + Auth + Productos | Semana 8 (~Sep 2025) | Fase 0 completada |
| **Fase 1B** | Facturación completa | Semana 13 (~Nov 2025) | Fase 1A completada |
| **Fase 1C** | Chat + Portal cliente | Semana 17 (~Dic 2025) | Fase 1B completada |
| **🎯 META** | **Dejar QuickBooks** | **Antes del 01/04/2026** | Fases 1A + 1B completadas |
| **Fase 2** | Mejoras continuas | Q2 2026 en adelante | MVP estable |

---

## Riesgos identificados y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Retraso en aprobación de diseños Figma | Media | Alto | Iterar rápido con wireframes low-fi. No esperar diseño perfecto para empezar backend. |
| Integración con Make.com más compleja de lo esperado | Baja | Medio | Webhook simple como primer paso. Documentar formato exacto de datos que Make envía hoy. |
| Resistencia al cambio (dejar QuickBooks) | Media | Alto | Período de uso paralelo (2-4 semanas). Capacitación al equipo. Migración gradual. |
| Presupuesto limitado para hosting | Baja | Bajo | railway + Vercel free tiers cubren el volumen inicial. Escalar solo cuando sea necesario. |
| Complejidad del agente de chat | Media | Medio | Empezar con intents simples y respuestas estructuradas. No intentar NLU complejo en V1. |
| Disponibilidad del equipo de desarrollo | Media | Alto | Priorizar features por impacto. Mantener scope controlado. Usar IA para acelerar desarrollo. |

---

## Estrategia de transición desde QuickBooks

### Fase de coexistencia (4-6 semanas antes de la meta)
1. **Semana 1-2:** Sistema nuevo en producción. Equipo crea facturas en AMBOS sistemas (QuickBooks + nuevo).
2. **Semana 3-4:** Validación cruzada. Verificar que las facturas en el nuevo sistema son correctas y completas.
3. **Semana 5-6:** Transición. Dejar de crear facturas en QuickBooks. Mantener QB en modo lectura para consultas históricas.
4. **Post-transición:** QuickBooks se usa solo como archivo histórico. Eventualmente exportar datos y cancelar suscripción.

### Datos a migrar desde QuickBooks
- Catálogo de productos (nombres, SKUs).
- Lista de clientes (datos de contacto, TaxID).
- Facturas históricas (opcional, para referencia).

### Método de migración
1. Exportar datos de QuickBooks en CSV.
2. Script de importación al nuevo sistema.
3. Validación manual de datos migrados.