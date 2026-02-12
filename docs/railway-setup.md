# Configuración de Deployment en Railway

Este documento describe el proceso de configuración y despliegue del proyecto **HAGO PRODUCE** en la plataforma Railway.

## 📋 Requisitos Previos

- Cuenta en [Railway](https://railway.app/)
- CLI de Railway instalado (opcional, pero recomendado)
- Acceso al repositorio de GitHub

## 🚀 Configuración del Proyecto en Railway

1.  **Crear Nuevo Proyecto:**
    - Ir a Dashboard > New Project > Deploy from GitHub repo.
    - Seleccionar el repositorio `hago-produce`.

2.  **Configuración de Servicios:**
    - El proyecto se desplegará como un servicio web (Next.js).
    - Railway detectará automáticamente `railway.json` para la configuración de build y start.

3.  **Base de Datos (PostgreSQL):**
    - En el canvas del proyecto, hacer click derecho > New > Database > PostgreSQL.
    - Railway aprovisionará una instancia de PostgreSQL.
    - Las variables de entorno `DATABASE_URL` y otras credenciales se generarán automáticamente.

## 🔧 Variables de Entorno

Configurar las siguientes variables en la pestaña "Variables" del servicio web:

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `DATABASE_URL` | Conexión a DB (Auto-link) | `postgresql://...` |
| `NEXTAUTH_SECRET` | Secreto para Auth | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL de la aplicación | `https://hago-produce.up.railway.app` |
| `OPENAI_API_KEY` | API Key de OpenAI | `sk-...` |

## 📦 Build y Deploy

La configuración de build se define en `railway.json`:

```json
{
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

- **Builder:** Usamos Nixpacks para una detección automática y optimizada del entorno Node.js.
- **Healthcheck:** Railway verificará `/api/health` para confirmar que el deploy fue exitoso.

## 🔄 CI/CD (GitHub Actions)

Aunque Railway puede hacer deploy automático al push, utilizaremos GitHub Actions para correr tests y lints antes del deploy, y para generar Preview Environments.

Ver [CI/CD Setup](./ci-cd.md) para más detalles.
