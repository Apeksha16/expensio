# Quick Start Guide - Expensio Backend

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Supabase account
- pnpm or npm

---

## 📦 Installation

### 1. Clone & Install

```bash
cd expensio
npm install
```

### 2. Environment Variables

Create `.env.local` in root directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/expensio

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000

# Optional
REDIS_URL=redis://localhost:6379
```

### 3. Database Migration

```bash
npm run db:push
```

### 4. Build

```bash
npm run build
```

### 5. Start Server

```bash
npm run dev
# or
npm start
```

✅ Server running at `http://localhost:3001`

---

## 🧪 Test Endpoints

### 1. Check User Profile

```bash
curl -X GET http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer mock-token"
```

Expected Response:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "apeksha@expensio.app",
    "name": "Apeksha",
    "avatarUrl": null,
    "monthlySalary": null,
    "isOnboardingCompleted": false
  }
}
```

### 2. Complete Onboarding

```bash
curl -X POST http://localhost:3001/api/v1/users/onboarding \
  -H "Authorization: Bearer mock-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pranav Katiyar",
    "monthlySalary": 85000
  }'
```

### 3. Update Profile

```bash
curl -X PUT http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer mock-token" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "pranav_k",
    "currency": "USD",
    "timezone": "America/New_York"
  }'
```

---

## 📚 Documentation

### Main Guides

1. **[Implementation Details](./BACKEND_AUTH_IMPLEMENTATION.md)**
   - Architecture overview
   - Authentication flow
   - Database schema
   - Error handling

2. **[API Quick Reference](./API_QUICK_REFERENCE.md)**
   - All endpoints
   - Request/response examples
   - Field validation rules

3. **[File Structure](./BACKEND_FILE_STRUCTURE.md)**
   - Complete file listing
   - Component descriptions
   - Change summary

4. **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)**
   - Project status
   - Key metrics
   - Deployment checklist

---

## 🔧 Development Commands

```bash
# Build
npm run build

# Development with hot reload
npm run dev

# Database
npm run db:push          # Apply migrations
npm run db:studio        # Open Drizzle Studio
npm run db:generate      # Generate new migration

# Lint
npm run lint
```

---

## 📱 Frontend Integration

### Example: React Integration

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthCheck() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Get session from Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      // Check onboarding status
      const response = await fetch('/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const { data } = await response.json();

      if (!data.isOnboardingCompleted) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  return null;
}
```

### Onboarding Form

```typescript
import { useState } from 'react';

export function OnboardingForm() {
  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/v1/users/onboarding', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          monthlySalary: parseInt(salary)
        })
      });

      if (!response.ok) {
        const { message } = await response.json();
        setError(message);
        return;
      }

      // Navigate to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Failed to complete onboarding');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={2}
        maxLength={100}
      />

      <input
        type="number"
        placeholder="Monthly Salary"
        value={salary}
        onChange={(e) => setSalary(e.target.value)}
        required
        min="1"
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button type="submit">Complete Onboarding</button>
    </form>
  );
}
```

---

## 🐛 Troubleshooting

### Database Connection Error

```
Error: Could not connect to database
```

**Solution:**

1. Check DATABASE_URL is correct
2. Verify PostgreSQL is running
3. Run migrations: `npm run db:push`

### JWT Verification Failed

```
Error: Invalid or expired authentication token
```

**Solution:**

1. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
2. Verify token hasn't expired
3. Use mock token for testing: `mock-token`

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**

```bash
# Find and kill process on port 3001
lsof -i :3001
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

---

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  supabase_auth_id UUID UNIQUE,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  username VARCHAR UNIQUE,
  avatar_url TEXT,
  provider VARCHAR DEFAULT 'google',
  currency VARCHAR DEFAULT 'INR',
  timezone VARCHAR DEFAULT 'UTC',
  monthly_salary NUMERIC,
  is_onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚢 Deployment

### Deploy to Production

1. **Build**

   ```bash
   npm run build
   ```

2. **Set Environment Variables**

   ```bash
   export DATABASE_URL=prod_db_url
   export SUPABASE_URL=prod_supabase_url
   export SUPABASE_SERVICE_ROLE_KEY=prod_key
   export NODE_ENV=production
   export PORT=3001
   ```

3. **Run Migration**

   ```bash
   npm run db:push
   ```

4. **Start Server**
   ```bash
   npm start
   ```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
ENV NODE_ENV=production
CMD ["npm", "start"]
```

```bash
docker build -t expensio-api .
docker run -p 3001:3001 \
  -e DATABASE_URL=... \
  -e SUPABASE_URL=... \
  expensio-api
```

---

## ✅ Validation Checklist

Before deploying:

- [ ] Environment variables set
- [ ] Database migrated
- [ ] Build successful
- [ ] All endpoints tested
- [ ] Frontend integrated
- [ ] Error handling verified
- [ ] Performance tested

---

## 📞 Support

### Resources

- **API Docs:** `/docs/API_QUICK_REFERENCE.md`
- **Implementation:** `/docs/BACKEND_AUTH_IMPLEMENTATION.md`
- **File Structure:** `/docs/BACKEND_FILE_STRUCTURE.md`

### Issues

If you encounter issues:

1. Check the troubleshooting section above
2. Review the detailed documentation
3. Check server logs: `npm run dev`
4. Verify database connection

---

## 🎯 Next Steps

1. ✅ Start development server
2. ✅ Test endpoints with cURL
3. ✅ Integrate with frontend
4. ✅ Run full integration tests
5. ✅ Deploy to production

**Happy coding! 🚀**
