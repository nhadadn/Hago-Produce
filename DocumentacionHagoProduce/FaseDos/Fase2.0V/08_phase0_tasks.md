# FASE 0: LEVANTAMIENTO DEL PROYECTO - Tareas Detalladas

---

## RESUMEN DE TAREAS - FASE 0

| ID | Tarea | Owner | Agente | Archivos/Carpetas | Paralelo |
|----|-------|-------|--------|------------------|----------|
| 0.1 | Setup Inicial del Repositorio | Nadir | Architecture Agent | README, .gitignore, LICENSE | Sí |
| 0.2 | Configuración de Railway | Nadir | DevOps Engineer | railway.json, .railway/ | Sí |
| 0.3 | Setup de CI/CD (GitHub Actions) | Nadir | DevOps Engineer | .github/workflows/ | Sí |
| 0.4 | Configuración de Environments | Nadir | DevOps Engineer | .env.example, docker/ | Sí |
| 0.5 | Setup de Figma - Wireframes | Nadir | Architecture Agent | docs/figma/ | Sí |
| 0.6 | Review de Arquitectura | Arthur | Software Architect | docs/architecture/ | Paralelo |
| 0.7 | Review de Tech Stack | Arthur | Software Architect | docs/tech-stack.md | Paralelo |
| 0.8 | Review de Seguridad | Arthur | Security Agent | docs/security/ | Paralelo |
| 0.9 | Documentación de Fase 0 | Nadir | Documentation Agent | docs/phase0/ | Sí |

---

## CHECKLIST DE PROGRESO

### Nadir - Fase 0
- [ ] 0.1: Setup Inicial del Repositorio
- [ ] 0.2: Configuración de Railway
- [ ] 0.3: Setup de CI/CD
- [ ] 0.4: Configuración de Environments
- [ ] 0.5: Setup de Figma
- [ ] 0.9: Documentación de Fase 0

### Arthur - Fase 0 (Trabajo Paralelo)
- [ ] 0.6: Review de Arquitectura
- [ ] 0.7: Review de Tech Stack
- [ ] 0.8: Review de Seguridad

---

## TAREAS DETALLADAS

---

### Phase 0: Foundation - Task 1
**Owner:** Nadir  
**Agent:** Architecture Agent

**Prompt:**
Setup inicial del repositorio del proyecto HAGO PRODUCE. Configurar estructura base del proyecto para desarrollo full-stack con Next.js 14, TypeScript, Railway, y PostgreSQL en Railway.

Requisitos específicos:
1. Crear archivo README.md con descripción del proyecto, stack tecnológico, instrucciones de setup, y contribución
2. Configurar .gitignore optimizado para Next.js, Node.js, Railway, y datos sensibles
3. Crear directorio raíz con estructura:
   - src/ (para frontend y backend)
   - docs/ (documentación)
   - .github/ (CI/CD)
   - scripts/ (scripts de utilidad)
   - docker/ (configuración Docker)
4. Configurar archivo LICENSE (MIT License)
5. Crear archivo .nvmrc con versión de Node.js especificada (20.x)

Contexto del proyecto:
- HAGO PRODUCE: Sistema ERP para venta de materias primas
- Plataforma: Railway (hosting y base de datos)
- Stack: Next.js 14, TypeScript, PostgreSQL, Railway, GitHub Actions
- Metodología: Trabajo en paralelo, DRY, C4 architecture

Archivos a crear/modificar (ISOLATED):
- README.md (nuevo)
- .gitignore (nuevo)
- LICENSE (nuevo)
- .nvmrc (nuevo)
- src/ (directorio)
- docs/ (directorio)
- .github/ (directorio)
- scripts/ (directorio)
- docker/ (directorio)

Criterios de aceptación:
1. README.md contiene: descripción clara, tabla de stack, comandos de instalación, estructura de proyecto
2. .gitignore excluye: node_modules, .env, .railway, build, dist, logs, .DS_Store
3. Estructura de directorios creada y documentada
4. Archivos de configuración versionados correctamente
5. No modifica archivos existentes en el proyecto

Dependencias:
- Ninguna (es la primera tarea)

Consideraciones de aislamiento:
- Esta tarea NO debe modificar código fuente (solo estructura)
- Crear solo archivos de configuración base
- Documentar la estructura en README.md
- Preparar el terreno para tareas siguientes

---

### Phase 0: Foundation - Task 2
**Owner:** Nadir  
**Agent:** DevOps Engineer

**Prompt:**
Configurar Railway para el proyecto HAGO PRODUCE. Railway será la plataforma principal para hosting y base de datos (PostgreSQL).

Requisitos específicos:
1. Crear archivo railway.json con configuración de servicios:
   - Servicio frontend (Next.js app)
   - Servicio backend (Next.js API routes - mismo proyecto)
   - Servicio database (PostgreSQL)
2. Configurar build commands y start commands para cada servicio
3. Definir variables de entorno necesarias en Railway
4. Configurar dominios (si aplica) y health checks
5. Documentar proceso de deployment en docs/railway-setup.md

Contexto:
- Plataforma: Railway (app.railway.app)
- Arquitectura: Monorepo Next.js con app y API en mismo proyecto
- Base de datos: PostgreSQL managed por Railway
- Integración: CI/CD con GitHub Actions
- Costo: Plan gratuito inicial

Archivos a crear/modificar (ISOLATED):
- railway.json (nuevo)
- docs/railway-setup.md (nuevo)
- .railway/ (directorio opcional para configs específicas)

Configuración railway.json:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build",
    "watchPatterns": ["src/**"]
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

Criterios de aceptación:
1. railway.json configurado correctamente para Next.js
2. Build y start commands definidos y probados
3. Documentación completa de proceso de deployment
4. Variables de entorno documentadas (sin valores reales)
5. Health check configurado
6. No interfere con otras configuraciones

Dependencias:
- Task 0.1 debe estar completada (estructura base)

Consideraciones de aislamiento:
- Esta tarea solo configura Railway, NO despliega
- Documenta sin incluir credenciales reales
- Prepara configuración para CI/CD (Task 0.3)
- Railway config es independiente de otros servicios

---

### Phase 0: Foundation - Task 3
**Owner:** Nadir  
**Agent:** DevOps Engineer

**Prompt:**
Setup de CI/CD pipeline con GitHub Actions para el proyecto HAGO PRODUCE. Automatizar linting, testing, building, y deployment preview.

Requisitos específicos:
1. Crear workflow .github/workflows/ci.yml con:
   - Lint: ESLint y Prettier (fail on warnings)
   - Test: Unit tests (Jest) y E2E tests (Playwright)
   - Build: next build (debe pasar)
   - Security: Dependabot y CodeQL
2. Crear workflow .github/workflows/deploy-preview.yml para:
   - Deploy en Railway (preview environment)
   - Generar URL de preview
   - Comentar en PR con URL
3. Configurar dependabot.yml para actualizaciones automáticas
4. Configurar CodeQL para análisis de seguridad
5. Documentar flujo de CI/CD en docs/ci-cd.md

Contexto:
- Platform: GitHub Actions
- Hosting: Railway (production y preview)
- Testing: Jest + Playwright
- Code Quality: ESLint + Prettier
- Branch strategy: Git Flow (main, develop, feature/*)

Archivos a crear/modificar (ISOLATED):
- .github/workflows/ci.yml (nuevo)
- .github/workflows/deploy-preview.yml (nuevo)
- .github/dependabot.yml (nuevo)
- docs/ci-cd.md (nuevo)

Workflow ci.yml debe incluir:
- Matrix: node-version (18, 20)
- Caching de node_modules
- Lint job
- Test job (unit + e2e)
- Build job
- Upload de artifacts

Criterios de aceptación:
1. CI pipeline ejecuta: lint, test, build en cada commit/PR
2. Lint job falla si hay warnings
3. Tests ejecutan correctamente (cuando existan)
4. Build pasa para producción
5. Deploy preview genera URL en PR
6. Dependabot configurado
7. CodeQL configurado
8. Documentación clara del pipeline

Dependencias:
- Task 0.1 (estructura base)
- Task 0.2 (configuración Railway)

Consideraciones de aislamiento:
- Workflows son independientes entre sí
- No modifica código fuente (solo tests CI/CD)
- Deploy preview no afecta producción
- CI/CD pipeline es un proceso separado

---

### Phase 0: Foundation - Task 4
**Owner:** Nadir  
**Agent:** DevOps Engineer

**Prompt:**
Configurar variables de entorno y Docker para el proyecto HAGO PRODUCE. Asegurar que configuración sea segura y portable entre local, CI/CD, y Railway.

Requisitos específicos:
1. Crear .env.example con TODAS las variables necesarias:
   - DATABASE_URL (PostgreSQL en Railway)
   - NEXTAUTH_SECRET, NEXTAUTH_URL
   - JWT_SECRET
   - OPENAI_API_KEY
   - Railway tokens (RAILWAY_TOKEN, RAILWAY_PROJECT_ID)
   - OTROS: NODE_ENV, APP_URL
2. Crear docker-compose.yml para desarrollo local:
   - Servicio app (Next.js)
   - Servicio db (PostgreSQL local)
   - Volúmenes y redes
3. Crear Dockerfile optimizado para producción:
   - Multi-stage build
   - Optimizado para Railway
   - Cache de dependencias
4. Documentar variables y configuración en docs/environments.md
5. Crear script scripts/setup-env.sh para ayuda

Contexto:
- Entornos: Local, CI/CD, Railway (preview/prod)
- Secrets management: Railway + GitHub Secrets
- Docker: Opcional pero recomendado para consistencia
- Security: Nunca commitear .env

Archivos a crear/modificar (ISOLATED):
- .env.example (nuevo)
- docker-compose.yml (nuevo)
- Dockerfile (nuevo)
- docs/environments.md (nuevo)
- scripts/setup-env.sh (nuevo)

.env.example debe incluir:
```bash
# App
NODE_ENV=development
APP_URL=http://localhost:3000

# Database (Railway)
DATABASE_URL=postgresql://user:pass@host:port/db

# Auth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret

# AI
OPENAI_API_KEY=sk-...

# Railway
RAILWAY_TOKEN=your-token
RAILWAY_PROJECT_ID=your-project-id
```

Criterios de aceptación:
1. .env.example completo con todas las variables
2. docker-compose.yml funciona para desarrollo local
3. Dockerfile optimizado y probado
4. Documentación clara de cada variable
5. Script setup-env.sh ayuda al desarrollador
6. .env en .gitignore
7. Railway configurable con estas variables

Dependencias:
- Task 0.1 (estructura base)
- Task 0.2 (configuración Railway)

Consideraciones de aislamiento:
- .env.example NO contiene valores reales
- Docker config es autónoma
- No modifica código de la app
- Variables son configuración, no código

---

### Phase 0: Foundation - Task 5
**Owner:** Nadir  
**Agent:** Architecture Agent

**Prompt:**
Setup de Figma para diseño UI/UX del proyecto HAGO PRODUCE. Crear wireframes de las pantallas principales siguiendo la arquitectura C4 definida.

Requisitos específicos:
1. Crear archivo en Figma con estructura:
   - Pages: Login, Dashboard, Invoice List, Create Invoice, Product List, Customer Portal
   - Components: Buttons, Inputs, Tables, Modals
   - Design System: Colors, Typography, Spacing
2. Definir vistas por rol:
   - Admin: Dashboard, Invoice Management, Products, Customers, Chat
   - Accounting: Invoice List, Status Management, Reports
   - Management: Dashboard, Reports
   - Customer: Invoice Viewing, Account Statement
3. Crear diagramas de navegación y user flows
4. Exportar screenshots a docs/figma/wireframes/
5. Documentar decisiones de diseño en docs/figma/design-system.md

Contexto:
- Herramienta: Figma
- Usuarios: ~6 internos, ~70 externos
- Responsivo: Mobile-first
- Accesibilidad: WCAG 2.1 AA
- Idiomas: ES y EN
- Stack UI: Next.js + TailwindCSS + shadcn/ui

Archivos a crear/modificar (ISOLATED):
- docs/figma/wireframes/ (directorio con screenshots)
- docs/figma/design-system.md (nuevo)
- docs/figma/navigation-flow.md (nuevo)

Pantallas a diseñar (mínimo):
1. Login (auth)
2. Dashboard Admin
3. Invoice List (filtrado, búsqueda)
4. Create Invoice (autocomplete, cálculos)
5. Invoice Detail
6. Product List (catálogo)
7. Product Detail (precios por proveedor)
8. Customer Portal (mis facturas)
9. Chat Interface (interno)

Criterios de aceptación:
1. Wireframes creados para todas las pantallas principales
2. Vistas por rol definidas y diferenciadas
3. Design system documentado (colors, typography)
4. Screenshots exportados y organizados
5. Navegación documentada
6. Considera responsividad y accesibilidad
7. No interfere con desarrollo de código

Dependencias:
- Task 0.1 (estructura base)
- Documentos de arquitectura existentes (01_architecture_c4.md)

Consideraciones de aislamiento:
- Figma es una herramienta visual independiente
- Screenshots son documentos, no código
- Design decisions documentadas sin implementar
- Preparación para frontend development (Fase 1A)

---

### Phase 0: Foundation - Task 6
**Owner:** Arthur (Trabajo Paralelo)  
**Agent:** Software Architect

**Prompt:**
Review de la arquitectura del proyecto HAGO PRODUCE. Validar que la arquitectura C4 existente sea correcta, completa, y alineada con Railway y los requisitos del proyecto.

Requisitos específicos:
1. Revisar docs/01_architecture_c4.md:
   - Nivel Context: Actores, sistemas externos
   - Nivel Containers: SPA, API, BD, Make, Notificaciones
   - Nivel Components: Módulos de backend
   - Nivel Code: Detalles técnicos
2. Validar decisiones arquitectónicas:
   - Uso de Next.js monorepo (correcto para Railway)
   - Integración con Railway (PostgreSQL, deployment)
   - Separación de módulos (products, invoices, chat)
   - Manejo de errores y logging
3. Crear/actualizar ADR (Architecture Decision Records):
   - ADR-001: Use Next.js monorepo on Railway
   - ADR-002: PostgreSQL on Railway (no Supabase)
   - ADR-003: Integration with Make.com via webhooks
4. Documentar findings y recomendaciones en docs/architecture/phase0-review.md
5. Validar escalabilidad y mantenibilidad

Contexto:
- Plataforma: Railway (changed from Supabase)
- Arquitectura: C4 existente
- Stack: Next.js, TypeScript, PostgreSQL
- Metodología: DRY, SOLID
- Documento base: docs/01_architecture_c4.md

Archivos a crear/modificar (ISOLATED):
- docs/architecture/adr/ (directorio nuevo)
- docs/architecture/adr/ADR-001-nextjs-monorepo-railway.md (nuevo)
- docs/architecture/adr/ADR-002-postgresql-railway.md (nuevo)
- docs/architecture/adr/ADR-003-make-webhooks.md (nuevo)
- docs/architecture/phase0-review.md (nuevo)

Criterios de aceptación:
1. C4 architecture revisada y validada
2. ADRs creados para decisiones clave
3. Railway integración validada
4. Escalabilidad y mantenibilidad confirmadas
5. Recomendaciones documentadas
6. No modifica código (solo documentación)
7. Review documentado con findings

Dependencias:
- Task 0.1-0.4 (configuración Railway)
- Documentos de arquitectura existentes
- Paralelo a tareas de Nadir (no interfere)

Consideraciones de aislamiento:
- Arthur trabaja en PARALELO
- Review es documentación, no código
- ADRs son decisiones, no implementación
- No bloquea a Nadir en tareas de setup

---

### Phase 0: Foundation - Task 7
**Owner:** Arthur (Trabajo Paralelo)  
**Agent:** Software Architect

**Prompt:**
Review del tech stack del proyecto HAGO PRODUCE. Validar que las tecnologías seleccionadas sean apropiadas para Railway, escalables, y alineadas con requisitos del proyecto.

Requisitos específicos:
1. Revisar stack tecnológico:
   - Frontend: Next.js 14, TypeScript, TailwindCSS, shadcn/ui
   - Backend: Next.js API Routes, TypeScript
   - Database: PostgreSQL (Railway managed)
   - ORM: Prisma
   - Auth: NextAuth.js (o Supabase Auth adapter for Railway)
   - Chat/LLM: OpenAI API
   - Testing: Jest, Playwright
   - CI/CD: GitHub Actions
2. Validar compatibilidad con Railway:
   - Next.js deployment en Railway
   - PostgreSQL managed
   - Variables de entorno
   - Deployment pipeline
3. Crear matriz de compatibilidad y versiones
4. Documentar pros/contras de cada tecnología
5. Crear docs/tech-stack.md actualizado
6. Identificar riesgos y dependencias

Contexto:
- Plataforma: Railway
- Stack definido previamente
- Usuarios: ~6 internos, ~70 externos
- Facturas/día: ~10
- Products: 400-600
- Requisitos: Rápido (3 min invoice), escalable

Archivos a crear/modificar (ISOLATED):
- docs/tech-stack.md (nuevo)
- docs/architecture/tech-stack-review.md (nuevo)

tech-stack.md debe incluir:
- Tabla de tecnologías con versiones
- Propósito de cada tecnología
- Alternativas consideradas
- Risks y mitigaciones
- Future upgrades plan

Criterios de aceptación:
1. Tech stack validado y documentado
2. Compatibilidad con Railway confirmada
3. Matriz de versiones creada
4. Pros/contras documentados
5. Riesgos identificados con mitigaciones
6. No modifica código (solo documentación)
7. Stack es apropiado para requisitos

Dependencias:
- Task 0.2 (configuración Railway)
- Documentos existentes
- Paralelo a Nadir

Consideraciones de aislamiento:
- Arthur trabaja en PARALELO
- Review es documentación
- No bloquea desarrollo de Nadir
- Input para Fase 1A (implementación)

---

### Phase 0: Foundation - Task 8
**Owner:** Arthur (Trabajo Paralelo)  
**Agent:** Security Agent

**Prompt:**
Review de seguridad del proyecto HAGO PRODUCE. Validar que configuración inicial sea segura y cumplir con requisitos de GDPR y CRA.

Requisitos específicos:
1. Revisar configuración de seguridad:
   - Variables de entorno (no harcodeadas)
   - .gitignore (sin .env, secrets)
   - Railway secrets management
   - GitHub Secrets
2. Validar autenticación y autorización:
   - NextAuth.js o alternativas
   - JWT tokens (expiración, refresh)
   - RBAC (role-based access control)
   - Customer portal auth
3. Revisar data security:
   - HTTPS enforce
   - SQL injection prevention (Prisma)
   - XSS prevention (Next.js default)
   - Input validation (Zod)
4. Crear docs/security/phase0-review.md:
   - Checklist de seguridad
   - Riesgos identificados
   - Recomendaciones
5. Validar compliance:
   - GDPR (protección de datos)
   - CRA (Canadá)
   - Audit logging requirement

Contexto:
- Plataforma: Railway
- Auth: NextAuth.js o similar
- Database: PostgreSQL (Railway)
- Compliance: GDPR, CRA
- Data: Customer data, financial data

Archivos a crear/modificar (ISOLATED):
- docs/security/phase0-review.md (nuevo)
- docs/security/checklist.md (nuevo)
- docs/security/gdpr-compliance.md (nuevo)
- docs/security/cra-compliance.md (nuevo)

Checklist de seguridad debe incluir:
- [ ] Variables de entorno configuradas
- [ ] .env en .gitignore
- [ ] Secrets en Railway y GitHub
- [ ] Auth mechanism definido
- [ ] RBAC roles definidos
- [ ] HTTPS enforced
- [ ] Input validation plan (Zod)
- [ ] Audit logging planned
- [ ] Data encryption (en tránsito y reposo)

Criterios de aceptación:
1. Seguridad inicial validada
2. Checklist completo
3. Riesgos documentados con mitigaciones
4. Compliance (GDPR, CRA) revisado
5. Recomendaciones para Fase 1A
6. No modifica código
7. Arthur trabaja en PARALELO

Dependencias:
- Task 0.4 (configuración environments)
- Task 0.2 (configuración Railway)
- Paralelo a Nadir

Consideraciones de aislamiento:
- Review es documentación
- No bloquea a Nadir
- Input para implementación (Fase 1A)
- Security baseline establecido

---

### Phase 0: Foundation - Task 9
**Owner:** Nadir  
**Agent:** Documentation Agent

**Prompt:**
Documentación completa de Fase 0 (Levantamiento del Proyecto). Compilar y documentar todo lo realizado en Fase 0 para referencia futura y onboarding del equipo.

Requisitos específicos:
1. Crear docs/phase0/summary.md con:
   - Resumen ejecutivo de Fase 0
   - Tareas completadas
   - Decisiones tomadas
   - Configuración establecida
   - Herramientas instaladas/configuradas
2. Crear docs/phase0/lessons-learned.md:
   - What worked well
   - Challenges encountered
   - Improvements for next phases
3. Actualizar README.md con:
   - Links a documentación de Fase 0
   - Quick start para nuevos miembros
   - Diagrama de configuración
4. Crear docs/phase0/handoff.md:
   - Checklist de handoff a Fase 1A
   - Pre-requisites para Fase 1A
   - Known issues or risks
5. Documentar Figma setup y access
6. Crear guía de onboarding para Arthur y Nadir

Contexto:
- Fase 0 completada: Repositorio, Railway, CI/CD, Environments, Figma
- Review completado: Arquitectura, Tech Stack, Seguridad (Arthur)
- Próxima fase: Fase 1A (Core, Auth, Products)
- Equipo: Nadir, Arthur

Archivos a crear/modificar (ISOLATED):
- docs/phase0/summary.md (nuevo)
- docs/phase0/lessons-learned.md (nuevo)
- docs/phase0/handoff.md (nuevo)
- README.md (actualizar - solo agregar secciones)
- docs/onboarding/nadir.md (nuevo)
- docs/onboarding/arthur.md (nuevo)

Criterios de aceptación:
1. Summary completo con todas las tareas
2. Lessons learned documentadas
3. README actualizado con links a Fase 0
4. Handoff checklist completo
5. Onboarding guías creadas
6. Figma access y setup documentado
7. Preparado para Fase 1A

Dependencias:
- Todas las tareas de Fase 0 deben estar completadas
- Reviews de Arthur completados

Consideraciones de aislamiento:
- Documentación es readonly de tareas pasadas
- No modifica código
- Agrega valor y contexto
- Prepara terreno para Fase 1A

---

## NOTAS DE EJECUCIÓN

### Orden de Ejecución

**Nadir (Sequential en Setup, Parallel en Review):**
1. Task 0.1: Setup Repositorio (base)
2. Task 0.2: Configurar Railway (depende de 0.1)
3. Task 0.3: Setup CI/CD (depende de 0.2)
4. Task 0.4: Configurar Environments (depende de 0.2)
5. Task 0.5: Setup Figma (independiente, puede ser paralelo)
6. Task 0.9: Documentación (después de todo)

**Arthur (Paralelo desde el inicio):**
- Task 0.6: Review Arquitectura (paralelo a 0.2-0.5)
- Task 0.7: Review Tech Stack (paralelo a 0.2-0.5)
- Task 0.8: Review Seguridad (paralelo a 0.2-0.5)

### Sincronización

- **Daily Standup (15 min):** Nadir y Arthur se sincronizan sobre progreso
- **Review de PRs:** Arthur review tasks de Nadir cuando haya PRs
- **Handoff a Fase 1A:** Task 0.9 coordina el handoff

### Conflicto Prevention

1. **Nadir:** Trabaja en archivos de configuración y setup
2. **Arthur:** Trabaja en documentación de review (NO modifica código)
3. **Separación de archivos:** Cada task especifica archivos aislados
4. **Git branches:** Cada task en su propia branch feature/fase0-task-n

### Métricas de Éxito Fase 0

- [ ] Todas las 9 tareas completadas
- [ ] Repositorio funcional y configurado
- [ ] Railway configurado y listo
- [ ] CI/CD pipeline probado
- [ ] Environments documentados
- [ ] Figma wireframes creados
- [ ] Reviews completados y documentados
- [ ] Documentación completa y accesible
- [ ] Ready para Fase 1A

---

*Última actualización: Junio 20, 2025*
*Adaptado para Railway como plataforma principal*