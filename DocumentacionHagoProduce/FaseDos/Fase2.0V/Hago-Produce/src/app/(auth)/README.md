# Auth UI Documentation

Este módulo contiene la interfaz de usuario para la autenticación.

## Componentes

### Login Form
- Ruta: `/login`
- Componente: `src/components/auth/LoginForm.tsx`
- Funcionalidad: Autenticación de usuarios con email y contraseña.
- Manejo de Errores: Muestra errores inline.
- Redirección: Al dashboard principal `/` tras login exitoso.

### Register Form
- Ruta: `/register`
- Componente: `src/components/auth/RegisterForm.tsx`
- Funcionalidad: Creación de nuevos usuarios (destinado para uso administrativo inicial).
- Roles: Permite seleccionar el rol del usuario.

## Hooks

### useAuth
Maneja el estado global de autenticación.
- `user`: Objeto del usuario actual.
- `accessToken`: Token JWT.
- `login(token, user)`: Actualiza el estado y guarda en localStorage.
- `logout()`: Limpia el estado y localStorage, redirige a login.

### useProtectedRoute
Protege rutas que requieren autenticación.
- Uso: `useProtectedRoute(['ADMIN', 'MANAGEMENT'])`
- Redirige a `/login` si no hay sesión.
- Redirige a `/` si el rol no está autorizado.

## Estilos
Utiliza componentes de `shadcn/ui` estilizados con TailwindCSS.
