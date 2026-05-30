# API Quick Reference

## Base URL

```
http://localhost:3001
```

## Authentication

All protected endpoints require:

```
Authorization: Bearer {supabase_jwt}
```

---

## Endpoints

### 1. Get Current User

```http
GET /api/v1/users/me
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Pranav",
    "avatarUrl": null,
    "monthlySalary": null,
    "isOnboardingCompleted": false
  }
}
```

---

### 2. Complete Onboarding

```http
POST /api/v1/users/onboarding
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Pranav Katiyar",
  "monthlySalary": 85000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Pranav Katiyar",
    "avatarUrl": null,
    "monthlySalary": 85000,
    "isOnboardingCompleted": true
  },
  "message": "Onboarding completed successfully"
}
```

---

### 3. Update Profile

```http
PUT /api/v1/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Pranav",
  "username": "pranav_k",
  "currency": "USD",
  "timezone": "America/New_York",
  "monthlySalary": 100000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Pranav",
    "username": "pranav_k",
    "monthlySalary": 100000,
    ...
  },
  "message": "Profile updated successfully"
}
```

---

### 4. Sync Profile (After Login)

```http
POST /api/v1/auth/sync
Authorization: Bearer {token}
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

## Error Responses

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      {
        "path": "name",
        "message": "Name must be at least 2 characters"
      }
    ]
  }
}
```

### Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

### Not Found

```json
{
  "success": false,
  "message": "User profile not found",
  "code": "NOT_FOUND"
}
```

---

## Frontend Implementation

### Check Onboarding Status

```typescript
async function checkOnboarding() {
  const token = session.access_token;
  const res = await fetch('/api/v1/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const { data } = await res.json();

  if (!data.isOnboardingCompleted) {
    return navigate('/onboarding');
  }
  return navigate('/dashboard');
}
```

### Submit Onboarding

```typescript
async function submitOnboarding(name, salary) {
  const token = session.access_token;

  const res = await fetch('/api/v1/users/onboarding', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      monthlySalary: salary,
    }),
  });

  if (!res.ok) {
    const { message, details } = await res.json();
    throw new Error(message);
  }

  return navigate('/dashboard');
}
```

---

## Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 400  | Validation Error                     |
| 401  | Unauthorized (missing/invalid token) |
| 403  | Forbidden (no permission)            |
| 404  | Not Found                            |
| 409  | Conflict (username taken)            |
| 500  | Server Error                         |

---

## Field Validation

### Name

- **Min:** 2 characters
- **Max:** 100 characters
- **Required:** Yes (during onboarding)

### Monthly Salary

- **Min:** > 0
- **Type:** Number
- **Required:** Yes (during onboarding)

### Username

- **Min:** 3 characters
- **Format:** Alphanumeric + underscore only
- **Must be unique**

### Currency

- **Format:** ISO 4217 (e.g., "USD", "INR")
- **Default:** "INR"

### Timezone

- **Format:** IANA timezone (e.g., "America/New_York")
- **Default:** "UTC"

---

## Mock Testing

### Use Mock Token in Development

```bash
curl -X GET http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer mock-token"
```

### Custom Mock User

```bash
curl -X GET http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer mock-token:$(echo '{"id":"user1","email":"test@example.com","user_metadata":{"name":"Test"}}' | base64)"
```
