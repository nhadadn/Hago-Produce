# Gestión de Entornos

## Variables de Entorno

| Variable | Descripción | Entorno |
| --- | --- | --- |
| `NODE_ENV` | Define el entorno (`development`, `production`, `test`). | Todos |
| `APP_URL` | URL base de la aplicación. | Todos |
| `DATABASE_URL` | String de conexión a PostgreSQL. En Railway se setea automático. | Todos |
| `NEXTAUTH_SECRET` | Llave para firmar cookies de sesión. | Todos |
| `NEXTAUTH_URL` | URL canónica para Auth (igual a `APP_URL`). | Todos |
| `JWT_SECRET` | Secret para firmar JWT tokens. | Todos |
| `OPENAI_API_KEY` | API Key para funciones de IA. | Todos |
| `RAILWAY_TOKEN` | Token de despliegue de Railway (CI/CD). | CI/CD |
| `RAILWAY_PROJECT_ID` | ID del proyecto en Railway. | CI/CD |

## Docker

El proyecto incluye configuración para Docker.

### Desarrollo Local
Para levantar la base de datos y la app en contenedores:
```bash
docker-compose up -d
```

### Producción
El `Dockerfile` utiliza un build multi-stage optimizado para reducir el tamaño de la imagen final (usando `output: 'standalone'` de Next.js).

## Scripts

- `scripts/setup-env.sh` (Linux/Mac) o `scripts/setup-env.bat` (Windows): Copia `.env.example` a `.env` si no existe.
