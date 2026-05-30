# Expensio Backend - Authentication & User Onboarding Implementation

## Overview

This implementation provides a complete, production-ready backend authentication and user onboarding system for Expensio using Fastify, Supabase Auth, Drizzle ORM, and PostgreSQL.

## Architecture

The backend follows a modular, scalable architecture with clear separation of concerns:

```
apps/api/src/
├── plugins/
│   ├── auth.plugin.ts          # JWT verification & user authentication
│   └── error-handler.plugin.ts # Global error handling
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts     # Supabase token verification & user sync
│   │   ├── auth.controller.ts  # Auth endpoints
│   │   ├── auth.routes.ts      # Auth route definitions
│   │   ├── auth.schemas.ts     # Auth Zod schemas
│   │   └── auth.types.ts       # Auth TypeScript types
│   └── users/
│       ├── users.repository.ts # Data access layer
│       ├── users.service.ts    # Business logic
│       ├── users.controller.ts # Request/response handling
│       ├── users.routes.ts     # Route definitions
│       ├── users.schemas.ts    # User Zod schemas
│       └── users.types.ts      # User TypeScript types
├── db/
│   ├── schema.ts               # Drizzle ORM schema definitions
│   └── index.ts                # Database connection
├── config/
│   └── env.ts                  # Environment variables
└── utils/
    └── errors.ts               # Error classes & response formatting
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  supabase_auth_id UUID UNIQUE,
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR,
  username VARCHAR UNIQUE,
  avatar_url TEXT,
  provider VARCHAR NOT NULL DEFAULT 'google',
  currency VARCHAR NOT NULL DEFAULT 'INR',
  timezone VARCHAR NOT NULL DEFAULT 'UTC',
  monthly_salary NUMERIC,
  is_onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Authentication Flow

### 1. **Google Login (Frontend)**

```
User clicks "Continue with Google"
  ↓
Supabase Auth SDK handles OAuth flow
  ↓
Frontend receives authenticated session
  ↓
Frontend extracts JWT token
```

### 2. **Backend Verification**

```
Frontend sends: GET /api/v1/users/me
  ├─ Header: Authorization: Bearer {JWT}
  ↓
Auth Plugin (auth.plugin.ts)
  ├─ Extract JWT from Authorization header
  ├─ Verify with Supabase using authService.verifyToken()
  ├─ Sync user to PostgreSQL via userRepository.syncFromSupabase()
  └─ Attach authenticated user to request.user
  ↓
Protected Route Handler
```

### 3. **Response to Frontend**

```
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Pranav",
    "avatarUrl": "https://...",
    "monthlySalary": null,
    "isOnboardingCompleted": false
  }
}
```

## API Endpoints

### Authentication

#### POST `/api/v1/auth/sync`

Sync authenticated user profile (already authenticated via middleware).

**Headers:**

```
Authorization: Bearer {supabase_jwt}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { ...user object... },
    "isOnboardingCompleted": false
  }
}
```

---

### User Management

#### GET `/api/v1/users/me`

Get current authenticated user profile.

**Headers:**

```
Authorization: Bearer {supabase_jwt}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Pranav",
    "avatarUrl": "https://...",
    "monthlySalary": 85000,
    "isOnboardingCompleted": true
  }
}
```

---

#### POST `/api/v1/users/onboarding`

Complete user onboarding with name and salary.

**Headers:**

```
Authorization: Bearer {supabase_jwt}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Pranav Katiyar",
  "monthlySalary": 85000
}
```

**Validation Rules:**

- `name`: 2-100 characters (required)
- `monthlySalary`: Must be > 0 (required)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Pranav Katiyar",
    "avatarUrl": "https://...",
    "monthlySalary": 85000,
    "isOnboardingCompleted": true
  },
  "message": "Onboarding completed successfully"
}
```

---

#### PUT `/api/v1/users/me`

Update user profile information.

**Headers:**

```
Authorization: Bearer {supabase_jwt}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "username": "newusername",
  "currency": "USD",
  "timezone": "America/New_York",
  "monthlySalary": 100000
}
```

**Response:**

```json
{
  "success": true,
  "data": { ...updated user... },
  "message": "Profile updated successfully"
}
```

---

## Error Handling

### Centralized Error System

All errors follow a consistent response format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {} // optional
}
```

### Error Types

| Status | Code             | Example                   |
| ------ | ---------------- | ------------------------- |
| 400    | VALIDATION_ERROR | Invalid input data        |
| 401    | UNAUTHORIZED     | Missing or invalid JWT    |
| 403    | FORBIDDEN        | Access denied             |
| 404    | NOT_FOUND        | User profile not found    |
| 409    | CONFLICT         | Username already taken    |
| 500    | DATABASE_ERROR   | Database operation failed |
| 500    | INTERNAL_ERROR   | Unknown server error      |

### Custom Error Classes

```typescript
// Usage in controller
if (!request.user) {
  throw new UnauthorizedError('User not authenticated');
}

if (!user) {
  throw new NotFoundError('User profile not found');
}

if (isTaken) {
  throw new ValidationError('Username is already taken');
}
```

---

## Middleware & Plugins

### Authentication Plugin (`auth.plugin.ts`)

**Responsibility:** Verify JWT tokens and attach authenticated user to requests.

```typescript
fastify.decorate('authenticate', async (request, reply) => {
  // 1. Extract JWT from Authorization header
  // 2. Verify with Supabase
  // 3. Sync user to database
  // 4. Attach to request.user
});
```

**Usage:**

```typescript
fastify.get(
  '/protected-route',
  {
    preHandler: [fastify.authenticate],
  },
  handler
);
```

### Error Handler Plugin (`error-handler.plugin.ts`)

**Responsibility:** Catch and format all errors consistently.

- Catches Fastify errors
- Catches AppErrors
- Catches unknown errors
- Formats response with proper status codes

---

## Data Access Layer

### UserRepository

The repository pattern provides a clean data access abstraction:

```typescript
// Find operations
userRepository.findById(id);
userRepository.findByEmail(email);
userRepository.findBySupabaseId(supabaseAuthId);

// Write operations
userRepository.create(data);
userRepository.update(id, data);

// Utility operations
userRepository.isUsernameTaken(username, excludeUserId);
userRepository.syncFromSupabase(supabaseUser);
```

---

## Validation Schemas (Zod)

### User Profile Update

```typescript
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  username: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  avatarUrl: z.string().url().optional(),
  currency: z.string().min(3).max(3).optional(),
  timezone: z.string().optional(),
  monthlySalary: z.number().nonnegative().optional(),
});
```

### Complete Onboarding

```typescript
export const completeOnboardingSchema = z.object({
  name: z.string().min(2).max(100),
  monthlySalary: z.number().positive(),
});
```

---

## Response Format Standards

### Success Response

```typescript
{
  success: true,
  data: { ...payload... },
  message?: "Optional message"
}
```

### Error Response

```typescript
{
  success: false,
  message: "Error description",
  code: "ERROR_CODE",
  details?: { ...error details... }
}
```

---

## Security Features

1. **JWT Verification**: All routes verify Supabase JWT tokens
2. **Input Validation**: Zod validates all user inputs
3. **SQL Injection Prevention**: Drizzle ORM parameterized queries
4. **Type Safety**: Full TypeScript throughout
5. **Database Constraints**: Unique constraints on email, username
6. **Timestamps**: Track all user modifications

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database

# Supabase
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_key

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## Frontend Integration

### Login Check Flow

```typescript
// When app loads
async function checkAuthStatus() {
  const response = await fetch('/api/v1/users/me', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const { data } = await response.json();

  if (!data.isOnboardingCompleted) {
    navigate('/onboarding');
  } else {
    navigate('/dashboard');
  }
}
```

### Onboarding Flow

```typescript
// After user fills form
async function completeOnboarding(name, salary) {
  const response = await fetch('/api/v1/users/onboarding', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      monthlySalary: salary,
    }),
  });

  if (response.ok) {
    navigate('/dashboard');
  }
}
```

---

## Testing

### Test Login with Mock Token

```bash
curl -X GET http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer mock-token"
```

### Test Onboarding

```bash
curl -X POST http://localhost:3001/api/v1/users/onboarding \
  -H "Authorization: Bearer mock-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pranav",
    "monthlySalary": 85000
  }'
```

---

## Production Readiness

✅ **Implemented:**

- Centralized error handling
- Comprehensive validation
- Modular architecture
- Type-safe codebase
- Database migrations
- Consistent API response format
- JWT authentication
- User synchronization

✅ **Ready for:**

- Friends management
- Groups & split expenses
- Notifications
- Real-time activity
- MPIN authentication
- File uploads
- Analytics

---

## Future Enhancements

1. **Rate Limiting**: Prevent abuse on auth endpoints
2. **Request Logging**: Track all API requests
3. **Audit Logging**: Track user data modifications
4. **Email Verification**: Verify user emails
5. **Refresh Tokens**: Implement token rotation
6. **Device Tracking**: Track user devices
7. **2FA**: Two-factor authentication
8. **OAuth Providers**: GitHub, Google, Apple OAuth

---

## References

- [Fastify Documentation](https://www.fastify.io/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Zod Validation](https://zod.dev/)
- [PostgreSQL](https://www.postgresql.org/docs/)
