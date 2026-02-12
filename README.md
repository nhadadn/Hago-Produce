# HAGO PRODUCE

## 📋 Descripción del Proyecto

**HAGO PRODUCE** es un sistema web integral diseñado para centralizar la facturación, gestión de costos y seguimiento de clientes de una empresa dedicada a la venta de materias primas (frutas, verduras, frutos secos) en Canadá.

El objetivo principal es reemplazar el uso de **QuickBooks** y **Google Sheets** por una plataforma propia y optimizada, integrando además un agente digital inteligente para facilitar la toma de decisiones operativas.

## 🎯 Objetivos Clave

- **Independencia Tecnológica:** Dejar de utilizar QuickBooks antes del 01/04/2026.
- **Eficiencia Operativa:** Reducir el tiempo de creación de facturas de ~20 minutos a menos de 3 minutos.
- **Centralización:** Unificar toda la información del negocio en un solo portal accesible.
- **Innovación:** Implementar un agente digital (Chat) para consultas rápidas de precios, proveedores y estados de cuenta.

## 🏗️ Stack Tecnológico

- **Frontend:** Next.js 14, TailwindCSS, shadcn/ui.
- **Backend:** Next.js API Routes (Monorepo).
- **Base de Datos:** PostgreSQL (Railway Managed).
- **ORM:** Prisma.
- **Autenticación:** NextAuth.js / Supabase Auth.
- **IA / Agente:** OpenAI API (GPT-4o-mini).
- **Infraestructura:** Railway (App + DB).

## 🚀 Instalación y Setup

```bash
# Clonar el repositorio
git clone <repo-url>
cd hago-produce

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Levantar entorno de desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
/
├── src/                # Código fuente (Frontend + Backend)
├── docs/               # Documentación del proyecto
├── .github/            # CI/CD Workflows
├── scripts/            # Scripts de utilidad
├── docker/             # Configuración Docker
├── DocumentacionHagoProduce/ # Documentación original (Legacy/Ref)
├── public/             # Archivos estáticos
└── README.md
```

## 📦 Módulos Principales (MVP)

1.  **Autenticación y Usuarios:** Gestión de roles (Admin, Contabilidad, Gerencia, Clientes).
2.  **Gestión de Catálogos:** Productos, Proveedores y Clientes.
3.  **Facturación:** Creación, edición, historial, notas y exportación a PDF.
4.  **Chat / Agente:** Asistente interno para consultas de negocio.
5.  **Portal de Clientes:** Acceso para visualizar y descargar facturas y estados de cuenta.

## 👥 Roles y Permisos

- **Admin / Comercial:** Gestión total (facturas, productos, clientes).
- **Contabilidad:** Gestión de estados de pago, notas y reportes.
- **Gerencia:** Visualización de reportes y KPIs.
- **Clientes Externos:** Acceso de lectura a sus propias facturas y estados de cuenta.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📚 Documentación de Fase 0 (Foundation)

- [Resumen de Fase 0](docs/phase0/summary.md)
- [Lecciones Aprendidas](docs/phase0/lessons-learned.md)
- [Handoff a Fase 1A](docs/phase0/handoff.md)
- [Onboarding Guide](docs/onboarding/nadir.md)
- [Arquitectura (Review)](docs/architecture/phase0-review.md)
- [Seguridad (Checklist)](docs/security/checklist.md)
