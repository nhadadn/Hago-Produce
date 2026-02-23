# CI/CD Pipeline Documentation

## Overview

Este proyecto utiliza GitHub Actions para la Integración Continua (CI) y Despliegue Continuo (CD).

## Workflows

### 1. CI (`ci.yml`)

Se ejecuta en cada push a `main`, `develop` y en Pull Requests.

**Jobs:**
- **Lint:** Ejecuta ESLint para asegurar calidad de código.
- **Test:** Ejecuta tests unitarios (Jest).
- **Build:** Verifica que la aplicación compile correctamente (`next build`).

### 2. Deploy Preview (`deploy-preview.yml`)

Se ejecuta en Pull Requests abiertos.

**Pasos:**
- Instala Railway CLI.
- Despliega una instancia efímera o de preview en Railway.
- Comenta en el PR con el estado del deploy.

### 3. Dependabot

Configurado para revisar actualizaciones de dependencias semanalmente (`npm` y `github-actions`).

## Configuración de Secretos

Para que los workflows funcionen, configurar los siguientes Repository Secrets en GitHub:

- `RAILWAY_TOKEN`: Token de acceso a Railway.

## CodeQL (Seguridad)

GitHub CodeQL está habilitado por defecto en los settings del repositorio para análisis de seguridad estático.
