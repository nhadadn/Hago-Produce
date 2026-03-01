# Pipeline de Integración y Pruebas

## Tests de Integración - Ejecución Local

Para ejecutar los tests de integración en tu máquina local de manera reproducible, sigue estos pasos.

### Requisitos
- **Docker Desktop** instalado y corriendo.
- **Puerto 5434** disponible.

### Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run test:integration` | **Comando principal.** Levanta Docker, sincroniza DB, genera cliente y ejecuta tests. |
| `npm run test:integration:setup` | Solo levanta el contenedor de base de datos de prueba. |
| `npm run test:integration:teardown` | Detiene y elimina el contenedor de prueba. |
| `npm run test:integration:db-push` | Sincroniza el schema de Prisma con la DB de prueba. |
| `npm run test:integration:generate` | Genera el cliente de Prisma. |

### Arquitectura de Puertos
Para evitar conflictos, el proyecto utiliza la siguiente asignación de puertos para PostgreSQL:

- **5432**: Base de datos de desarrollo (Nube / Neon).
- **5433**: Base de datos de desarrollo local (`docker-compose.yml`).
- **5434**: Base de datos de **TESTS** (`docker-compose.test.yml`).

### Notas Importantes
- El contenedor de tests usa `tmpfs`, lo que significa que la base de datos es **efímera**. Cada vez que reinicias el contenedor, los datos se pierden, garantizando un entorno limpio para cada ejecución.
- Si encuentras errores de conexión, asegúrate de que el puerto 5434 no esté ocupado por otro proceso.

## Nota para Desarrolladores Windows (EPERM Error)
Durante `npx prisma db push` o `prisma generate`, puede aparecer:
`EPERM: operation not permitted`

Esto ocurre cuando VS Code o el servidor de desarrollo tienen archivos de Prisma bloqueados.

**Solución:**
1. Detén el servidor de desarrollo (`npm run dev`) si está corriendo.
2. Cierra completamente VS Code.
3. Ejecuta el comando en una terminal externa (PowerShell/CMD) como Administrador si es necesario.

## Solución Definitiva: Entorno de Tests de Integración
Implementado el 2026-02-27.

El entorno utiliza un archivo `docker-compose.test.yml` dedicado que levanta una base de datos PostgreSQL efímera en memoria (`tmpfs`) en el puerto **5434**.
Esto garantiza:
1.  **Aislamiento total**: No afecta la base de datos de desarrollo (5432) ni local (5433).
2.  **Velocidad**: Al usar `tmpfs`, las operaciones de disco son mínimas.
3.  **Reproducibilidad**: Cada ejecución comienza con una base de datos vacía.

### Ejecución en CI/CD
El pipeline de GitHub Actions (`.github/workflows/ci.yml`) ha sido configurado para:
1.  Levantar el servicio de PostgreSQL (5434).
2.  Crear un archivo `.env.test` dinámicamente con las credenciales correctas.
3.  Ejecutar las migraciones (`db push`) y generación de cliente (`prisma generate`) antes de los tests.

