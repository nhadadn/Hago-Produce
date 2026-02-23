# Auth Module API Documentation

Este módulo maneja la autenticación de usuarios mediante JWT.

## Endpoints

### 1. Login
**POST** `/api/v1/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "MANAGEMENT"
    },
    "tokens": {
      "accessToken": "jwt_token...",
      "refreshToken": "jwt_refresh_token..."
    }
  }
}
```

### 2. Register
**POST** `/api/v1/auth/register`

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Doe",
  "role": "MANAGEMENT" // Opcional (Default: MANAGEMENT)
}
```

**Response (201 Created):**
Misma estructura que Login.

### 3. Refresh Token
**POST** `/api/v1/auth/refresh`

**Body:**
```json
{
  "refreshToken": "jwt_refresh_token..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token..."
  }
}
```

### 4. Get Current User (Me)
**GET** `/api/v1/auth/me`

**Headers:**
`Authorization: Bearer <access_token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "MANAGEMENT",
      "createdAt": "2023-..."
    }
  }
}
```

## Roles
- `ADMIN`: Acceso total.
- `ACCOUNTING`: Acceso a facturación y pagos.
- `MANAGEMENT`: Acceso a reportes y vistas generales.
- `CUSTOMER`: Acceso limitado a sus propios datos.

## Seguridad
- Access Token expira en 1 hora.
- Refresh Token expira en 7 días.
- Contraseñas hasheadas con bcrypt.
