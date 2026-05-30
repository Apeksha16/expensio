# Backend Implementation - File Structure & Components

## Complete File Listing

```
apps/api/
├── src/
│   ├── index.ts                                    # Main Fastify app entry point
│   │
│   ├── config/
│   │   └── env.ts                                  # Environment variables & validation
│   │
│   ├── db/
│   │   ├── index.ts                                # Drizzle database connection
│   │   └── schema.ts                               # ALL Drizzle ORM schema definitions
│   │
│   ├── plugins/
│   │   ├── auth.plugin.ts                          # ✅ JWT verification middleware
│   │   └── error-handler.plugin.ts                 # ✅ Global error handling
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── index.ts                            # Module exports
│   │   │   ├── auth.service.ts                     # ✅ Supabase verification & sync
│   │   │   ├── auth.controller.ts                  # ✅ Auth endpoints
│   │   │   ├── auth.routes.ts                      # ✅ Auth route definitions
│   │   │   ├── auth.schemas.ts                     # ✅ Zod validation schemas
│   │   │   └── auth.types.ts                       # ✅ TypeScript types & interfaces
│   │   │
│   │   └── users/
│   │       ├── index.ts                            # ✅ Module exports
│   │       ├── users.repository.ts                 # ✅ Data access layer (NEW)
│   │       ├── users.service.ts                    # ✅ Business logic & onboarding
│   │       ├── users.controller.ts                 # ✅ Request/response handlers
│   │       ├── users.routes.ts                     # ✅ Route definitions (UPDATED)
│   │       ├── users.schemas.ts                    # ✅ Zod schemas (UPDATED)
│   │       └── users.types.ts                      # ✅ TypeScript types (UPDATED)
│   │
│   ├── routes/
│   │   ├── health.ts                               # Health check endpoint
│   │   └── expense.ts                              # Expense routes (existing)
│   │
│   ├── utils/
│   │   └── errors.ts                               # ✅ Error classes & utilities
│   │
│   └── sockets/
│       └── socket.manager.ts                       # WebSocket management
│
├── drizzle/
│   ├── 0000_chief_chronomancer.sql                 # Initial schema
│   ├── 0001_sleepy_strong_guy.sql                  # First iteration
│   ├── 0002_confused_johnny_storm.sql              # Schema expansion
│   └── 0003_add_supabase_auth_id_and_onboarding_f
│       elds.sql                                    # ✅ NEW: Auth schema updates
│
└── drizzle.config.ts                               # Drizzle configuration
```

---

## Key Files Overview

### 1. **Database Schema** (`src/db/schema.ts`)

Defines Drizzle ORM table for users with:

- UUID primary key
- Supabase auth ID (unique)
- Email (unique)
- Name, avatar, username (unique)
- Provider, currency, timezone
- Monthly salary
- Onboarding completion flag
- Timestamps

### 2. **Error Handling** (`src/utils/errors.ts`)

Custom error classes:

- `AppError` - Base error class
- `ValidationError` - 400 status
- `UnauthorizedError` - 401 status
- `ForbiddenError` - 403 status
- `NotFoundError` - 404 status
- `ConflictError` - 409 status
- `DatabaseError` - 500 status
- `UnknownError` - 500 status

### 3. **Auth Plugin** (`src/plugins/auth.plugin.ts`)

Fastify plugin that:

- Extracts JWT from Authorization header
- Verifies token with Supabase
- Syncs user to database
- Attaches user to request.user
- Returns 401 on failure

### 4. **Error Handler Plugin** (`src/plugins/error-handler.plugin.ts`)

Global error handler that:

- Catches all errors
- Formats responses consistently
- Returns proper status codes
- Includes stack traces in development

### 5. **User Repository** (`src/modules/users/users.repository.ts`)

Data access layer providing:

```typescript
findById(id); // Get user by ID
findByEmail(email); // Get user by email
findBySupabaseId(id); // Get by Supabase ID
isUsernameTaken(username, exclude); // Check username uniqueness
create(data); // Create new user
update(id, data); // Update user
syncFromSupabase(supabaseUser); // Sync from Supabase Auth
```

### 6. **Auth Service** (`src/modules/auth/auth.service.ts`)

Authentication logic:

- `verifyToken(token)` - Verify JWT with Supabase
- `syncUser(supabaseUser)` - Sync to database
- Handles mock tokens for development

### 7. **Users Service** (`src/modules/users/users.service.ts`)

Business logic:

- `getUserById(id)` - Fetch user
- `isUsernameTaken(username)` - Username uniqueness
- `updateUser(id, data)` - Update profile
- `completeOnboarding(userId, data)` - Complete onboarding with validation

### 8. **Users Controller** (`src/modules/users/users.controller.ts`)

Request handlers:

- `getMe()` - GET /api/v1/users/me
- `updateMe()` - PUT /api/v1/users/me
- `completeOnboarding()` - POST /api/v1/users/onboarding

### 9. **Users Routes** (`src/modules/users/users.routes.ts`)

Fastify route definitions:

```
GET    /api/v1/users/me              (authenticated)
PUT    /api/v1/users/me              (authenticated)
POST   /api/v1/users/onboarding      (authenticated)
```

### 10. **Validation Schemas** (`src/modules/users/users.schemas.ts`)

Zod schemas:

- `updateProfileSchema` - Profile update validation
- `completeOnboardingSchema` - Onboarding validation

### 11. **Auth Controller** (`src/modules/auth/auth.controller.ts`)

Auth endpoints:

- `syncProfile()` - POST /api/v1/auth/sync

### 12. **Auth Routes** (`src/modules/auth/auth.routes.ts`)

Auth route definitions

---

## Database Migration

Generated migration file: `0003_add_supabase_auth_id_and_onboarding_fields.sql`

```sql
ALTER TABLE "users" ALTER COLUMN "currency" SET DEFAULT 'INR';
ALTER TABLE "users" ADD COLUMN "supabase_auth_id" uuid;
ALTER TABLE "users" ADD COLUMN "provider" text DEFAULT 'google' NOT NULL;
ALTER TABLE "users" ADD COLUMN "is_onboarding_completed" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_onboarded";
ALTER TABLE "users" ADD CONSTRAINT "users_supabase_auth_id_unique" UNIQUE("supabase_auth_id");
```

---

## Environment Setup

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000

# Cache & Queue (Optional)
REDIS_URL=redis://localhost:6379
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=masterkey
```

---

## API Response Format

### Success Response

```typescript
interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: any;
  stack?: string; // Development only
}
```

---

## Testing the Implementation

### 1. Check User Profile

```bash
curl -X GET http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer mock-token"
```

### 2. Complete Onboarding

```bash
curl -X POST http://localhost:3001/api/v1/users/onboarding \
  -H "Authorization: Bearer mock-token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Pranav","monthlySalary":85000}'
```

### 3. Update Profile

```bash
curl -X PUT http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer mock-token" \
  -H "Content-Type: application/json" \
  -d '{"username":"pranav_k","currency":"USD"}'
```

---

## Type Definitions Updated

### User Type (`packages/types/src/index.ts`)

```typescript
interface User {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  currency?: string | null;
  timezone?: string | null;
  monthlySalary?: number | null;
  isOnboardingCompleted?: boolean | null; // Updated from isOnboarded
  createdAt: Date;
  updatedAt?: Date | null;
}
```

### Validation Schemas (`packages/validation/src/index.ts`)

```typescript
completeOnboardingSchema; // New
updateProfileSchema; // Updated
```

---

## Architecture Decisions

### 1. **Repository Pattern**

- Decouples data access from business logic
- Makes testing easier
- Allows for future caching layer

### 2. **Service Layer**

- Contains business logic
- Validates data before persistence
- Can be reused by different controllers

### 3. **Centralized Error Handling**

- Consistent error responses
- Easy to debug
- Professional error messages

### 4. **Middleware Plugins**

- Auth middleware verifies all protected routes
- Error middleware catches all exceptions
- Keeps code DRY

### 5. **Validation at Every Layer**

- Zod schemas at controller level
- Service layer validation
- Database constraints

---

## Security Features Implemented

✅ JWT verification via Supabase
✅ Input validation with Zod
✅ SQL injection prevention (Drizzle ORM)
✅ Type-safe TypeScript throughout
✅ Database constraints (unique, not null)
✅ Error handling doesn't leak sensitive data
✅ CORS configured
✅ Proper HTTP status codes

---

## Scalability Features

✅ Modular architecture
✅ Service-oriented design
✅ Repository pattern for data access
✅ Proper database indexing
✅ Stateless API design
✅ Prepared for caching layer
✅ Ready for horizontal scaling

---

## Future Enhancement Points

The architecture supports easy addition of:

- Friends management
- Groups & split expenses
- Notifications system
- Activity logging
- File uploads
- Email verification
- 2FA authentication
- OAuth provider support
- Analytics & reporting
- Real-time updates via WebSockets

---

## Build & Deployment

### Development

```bash
npm run dev        # Start with hot reload
npm run build      # Build TypeScript
```

### Database

```bash
npm run db:migrate # Run migrations
npm run db:push    # Push schema to DB
npm run db:studio  # Open Drizzle Studio
```

### Production

```bash
npm run build      # Compile TypeScript
npm start          # Start server
```

---

## Summary of Changes

| File                                    | Status     | Changes                                                   |
| --------------------------------------- | ---------- | --------------------------------------------------------- |
| `src/db/schema.ts`                      | ✅ Updated | Added supabase_auth_id, provider, is_onboarding_completed |
| `src/plugins/auth.plugin.ts`            | ✅ Updated | Enhanced error handling & response format                 |
| `src/plugins/error-handler.plugin.ts`   | ✅ Created | Global error handling middleware                          |
| `src/modules/auth/auth.service.ts`      | ✅ Updated | Uses userRepository                                       |
| `src/modules/auth/auth.controller.ts`   | ✅ Updated | Enhanced response format                                  |
| `src/modules/auth/auth.routes.ts`       | ✅ Updated | Added API versioning                                      |
| `src/modules/auth/auth.schemas.ts`      | ✅ Updated | Added comprehensive schemas                               |
| `src/modules/auth/auth.types.ts`        | ✅ Updated | Added response interfaces                                 |
| `src/modules/users/users.repository.ts` | ✅ Created | Data access layer                                         |
| `src/modules/users/users.service.ts`    | ✅ Updated | Added completeOnboarding                                  |
| `src/modules/users/users.controller.ts` | ✅ Updated | Added completeOnboarding endpoint                         |
| `src/modules/users/users.routes.ts`     | ✅ Updated | Added /onboarding endpoint & API versioning               |
| `src/modules/users/users.schemas.ts`    | ✅ Updated | Added completeOnboardingSchema                            |
| `src/modules/users/users.types.ts`      | ✅ Updated | Updated to match schema                                   |
| `src/utils/errors.ts`                   | ✅ Created | Error classes & formatting                                |
| `src/index.ts`                          | ✅ Updated | Registered error handler plugin                           |
| `drizzle/0003_*.sql`                    | ✅ Created | Database migration                                        |
| `packages/types/src/index.ts`           | ✅ Updated | Updated User interface                                    |
| `packages/validation/src/index.ts`      | ✅ Updated | Added onboarding schema                                   |

---

## Verification Checklist

- ✅ Drizzle schema updated with all required fields
- ✅ Database migration generated
- ✅ Auth middleware verifies JWT
- ✅ User repository implements full CRUD
- ✅ User service has complete onboarding logic
- ✅ User controller has all endpoints
- ✅ All endpoints have proper API versioning (/api/v1/)
- ✅ Error handling is centralized
- ✅ Response format is consistent
- ✅ Zod validation on all inputs
- ✅ TypeScript compilation successful
- ✅ All modules properly exported
- ✅ Types updated across packages
- ✅ Documentation complete

---

_Implementation completed and ready for production deployment._
