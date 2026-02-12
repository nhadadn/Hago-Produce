# Onboarding Guide - Nadir

## Welcome to Hago Produce!

This guide helps you get started with the development environment.

## 🛠️ Tools Required
- Node.js v20 (managed via nvm)
- Git
- VS Code (Recommended)
- Docker (Optional)

## 🚀 Getting Started

1.  **Repository Setup**
    ```bash
    git clone <repo>
    cd hago-produce
    npm install
    ```

2.  **Environment Variables**
    - Ask the Lead Dev for the `RAILWAY_TOKEN` and `DATABASE_URL`.
    - Create `.env` from `.env.example`.

3.  **Running Locally**
    ```bash
    npm run dev
    ```
    Visit `http://localhost:3000`.

## 📚 Key Documentation
- [Architecture](../architecture/phase0-review.md)
- [CI/CD](../ci-cd.md)
- [Project Goals](../../README.md)
