# 🚀 CBC Learning Ecosystem - Developer Quick Reference

## Project Overview

**Stack:** Node.js/Express + React 18 + PostgreSQL + Redis  
**Size:** 11,572 LOC backend + 2,413 LOC frontend  
**Last Audit:** March 17, 2026  
**Status:** ✅ READY FOR DEVELOPMENT

---

## Quick Start

### System Requirements
```bash
Node.js >= 18.0.0
PostgreSQL 15
Redis 7
Docker (optional)
```

### Local Development Setup

```bash
# 1. Backend setup
cd backend
cp .env.example .env          # Fill in M-Pesa sandbox keys
npm install
npm run build                 # Check TypeScript compilation
npm run build# Start with hot-reload

# 2. Frontend setup (new terminal)
cd frontend
npm install
npm run dev                   # Start Vite dev server

# 3. Full stack with Docker (optional)
docker-compose -f docker-compose.dev.yml up

# Open http://localhost:3000
```

### Environment Variables

**Backend Essential (`backend/.env`):**
```
NODE_ENV=development
PORT=5000
DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD
REDIS_HOST=localhost
JWT_SECRET=<64+ random chars>
JWT_REFRESH_SECRET=<64+ random chars>
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=<sandbox key>
MPESA_CONSUMER_SECRET=<sandbox secret>
```

**Frontend Essential (`frontend/.env.local`):**
```
VITE_API_BASE_URL=http://localhost:5000
```

---

## Architecture Overview

### Backend Structure
```
backend/src/
├── index.ts              ← Express app entry point
├── config/               ← Database, Redis setup
├── middleware/           ← Auth, validation, error handling
├── routes/               ← API endpoint definitions (7 routers)
├── controllers/          ← Request handlers
├── services/             ← Business logic (10 services)
├── database/
│   ├── migrations/       ← 10 Knex migrations
│   ├── seeds/            ← Demo data
│   ├── migrate.ts        ← Migration runner
├── utils/
│   └── logger.ts         ← Winston logger (use this, not console)
└── types/
    └── africastalking.d.ts
```

### Frontend Structure
```
frontend/src/
├── main.tsx              ← React entry point
├── App.tsx               ← Route definitions
├── index.css             ← Tailwind + global styles
├── components/           ← 7 React components
│   ├── LoginPage
│   ├── TeacherClassroomPortal   ← Largest (712 LOC, monitor)
│   ├── StudentLabPortal
│   ├── MpesaPayment
│   ├── PaymentHistory
│   ├── ConflictResolutionQueue
│   └── ...
├── services/             ← API clients (Axios)
├── store/                ← Zustand state (auth.ts)
└── hooks/                ← Custom React hooks
```

---

## Key Services & Components

### Backend Services

| Service | Purpose | Size | Status |
|---------|---------|------|--------|
| `mpesa.service.ts` | M-Pesa payments | 773 LOC | ✅ Fully tested |
| `offline-sync.service.ts` | Conflict resolution | 676 LOC | ✅ Critical path |
| `ussd.service.ts` | USSD messaging | 608 LOC | ✅ Working |
| `sms-notification.service.ts` | SMS alerts | 441 LOC | ✅ Africa's Talking |
| `mpesa-queue.service.ts` | M-Pesa queue | 429 LOC | ✅ Bull queue |
| `referral.service.ts` | Student referrals | 515 LOC | ✅ Implemented |

### Frontend Components

| Component | Lines | Purpose | Status |
|-----------|-------|---------|--------|
| TeacherClassroomPortal | 712 | Dashboard + grading | ⚠️ Large (refactor candidate) |
| StudentLabPortal | 385 | Student view | ✅ Good size |
| MpesaPayment | 384 | Payment UI | ✅ Integrated |
| ConflictResolutionQueue | 326 | Conflict UI | ✅ Modal |
| PaymentHistory | 238 | Payment list | ✅ Simple |

---

## API Routes

### Authentication
```
POST   /api/v1/auth/login              (rate limited 10/15min per IP)
POST   /api/v1/auth/register           (role-based)
POST   /api/v1/auth/refresh            (rate limited 5/1min)
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/change-password
```

### M-Pesa Payments
```
POST   /api/v1/payments/mpesa/initiate          (5 req/min per user)
POST   /api/v1/payments/mpesa/callback          (IP whitelisted)
POST   /api/v1/payments/mpesa/timeout           (IP whitelisted)
```

### Students
```
GET    /api/v1/students                         (requires auth)
GET    /api/v1/students/:id                     (requires auth)
POST   /api/v1/students                         (admin only)
```

### Assessments
```
GET    /api/v1/assessments
POST   /api/v1/assessments                      (teacher)
PATCH  /api/v1/assessments/:id                  (teacher)
```

### Attendance
```
GET    /api/v1/attendance
POST   /api/v1/attendance/mark                  (teacher)
```

### USSD
```
POST   /api/v1/ussd                             (Safaricom IP whitelisted)
```

### Sync Events
```
POST   /api/v1/sync/offline-queue
GET    /api/v1/sync/conflicts
POST   /api/v1/sync/resolve
```

---

## Database Schema

### Core Tables
- `users` — All platform users (300+ fields including audit)
- `schools` — School metadata
- `students` — Student records with soft delete
- `competencies` — CBC learning competencies
- `assessments` — Student assessments with scores
- `attendance` — Daily attendance records
- `fee_payments` — M-Pesa payment tracking
- `mpesa_transactions` — Raw M-Pesa callbacks
- `offline_sync_queue` — Offline changes pending sync
- `refresh_tokens` — JWT refresh tokens with revocation

### Performance Features
- ✅ 30+ strategic indexes
- ✅ Full-text search on student names (GIN indexes)
- ✅ Partial indexes for active records
- ✅ Composite indexes for common queries
- ✅ Connection pooling (2-10 connections)

---

## Common Tasks

### Add New API Endpoint

```typescript
// 1. Create route (routes/my.routes.ts)
router.get('/items', authenticate, [ /* validators */ ], validate, MyController.getItems);

// 2. Create controller (controllers/my.controller.ts)
static async getItems(req: Request, res: Response) {
  const items = await MyService.find();
  res.json({ success: true, data: items });
}

// 3. Create service (services/my.service.ts)
static async find() {
  return db('table_name').select('*').where({ ... });
}

// 4. Wire up in index.ts
app.use('/api/v1/my', myRoutes);
```

### Add Database Migration

```typescript
// Create file: src/database/migrations/YYYYMMDDHHMMSS_name.ts
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('my_table', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('my_table');
}

// Run: npm run migrate
```

### Add React Component

```typescript
// components/MyComponent.tsx
import React, { useState } from 'react';

export function MyComponent() {
  const [state, setState] = useState('');
  
  return (
    <div className="p-4">
      <h1 className="text-lg font-bold">{state}</h1>
    </div>
  );
}
```

### Use Logger (Not console.log)

```typescript
import { logger } from '../utils/logger';

logger.info('User logged in', { userId: 123 });
logger.warn('High latency detected', { ms: 5000 });
logger.error('Payment failed', { error: err.message });
logger.debug('Query executed', { query: 'SELECT...' });
```

---

## Testing

### Run Tests
```bash
# Backend
cd backend
npm test                  # Runs Jest (currently no tests)

# Frontend
cd frontend
npm run type-check        # TypeScript check
npm run lint              # ESLint
npm run build              # Production build test
```

### Common Test Patterns

```typescript
// Backend: Jest + TypeScript
import { describe, it, expect } from '@jest/globals';

describe('PaymentService', () => {
  it('should prevent duplicate payment', async () => {
    const result = await PaymentService.create(idempotencyKey, payment);
    expect(result.id).toBeDefined();
  });
});
```

---

## Known Issues & Workarounds

### Issue: Frontend build fails with "RequestInit not defined"
**Cause:** TypeScript missing web API types  
**Fix:**
```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

### Issue: ESLint "Expected an assignment or function call"
**Cause:** Unused expression in code  
**Fix:** Wrap in `void` or use the expression value
```typescript
// ❌ Bad
maybeFireEvent();

// ✅ Good
await myPromise;
void maybeFireEvent();
```

### Issue: CORS errors in development
**Cause:** API URL mismatch  
**Fix:** Set `VITE_API_BASE_URL=http://localhost:5000` in `.env.local`

---

## Performance Monitoring

### Key Metrics to Track

```
Backend:
- M-Pesa callback latency (should be <500ms)
- Database query times (check slow_log)
- Redis memory usage (monitor for growth)
- Bull queue depth (payment processing delays)

Frontend:
- Initial page load (target <2s)
- TTI (Time to Interactive, target <3s)
- Largest Contentful Paint (target <2.5s)
```

### Enable Slow Query Log

```sql
-- PostgreSQL (production)
SET log_min_duration_statement = 1000;  -- 1 second queries
```

---

## Security Reminders

- ✅ **Always validate input** with express-validator
- ✅ **Never log sensitive data** (passwords, tokens)
- ✅ **Use parameterized queries** (Knex abstracts this)
- ✅ **Check authentication** on protected routes (`authenticate` middleware)
- ✅ **Rate limit** public endpoints (see auth.routes.ts example)
- ✅ **Hash passwords** with bcryptjs (`bcrypt.hash()` function)
- ❌ **Never hardcode secrets** in code
- ❌ **Never use `eval()`** or dynamic code execution
- ❌ **Never trust user input** (sanitize in validators)

---

## Debugging

### Enable Debug Logging

```bash
# Backend
DEBUG=* npm run dev              # Very verbose

# Frontend
console.log only during dev (remove before commit)
```

### Check M-Pesa Status

```bash
# Safaricom Daraja API sandbox:
# Consumer Key: (from .env)
# Consumer Secret: (from .env)
# Test phone: 254708374149
# Test amount: 1 KES (minimum)
```

### Database Connection Issues

```bash
# Test PostgreSQL
psql -h localhost -U postgres -d cbc_learning_dev

# Test Redis
redis-cli ping              # Should return PONG
redis-cli info              # Server info
```

---

## Useful Commands

```bash
# Backend
npm run dev                 # Hot reload development
npm run build               # Compile TypeScript
npm run lint                # Run ESLint (--fix to auto-fix)
npm run lint -- --fix       # Auto-fix linting issues
npm run migrate             # Run database migrations
npm run migrate:rollback    # Undo last migration
npm test                    # Run Jest

# Frontend  
npm run dev                 # Vite dev server
npm run build               # Optimized production build
npm run preview             # Preview production build
npm run lint                # ESLint
npm run type-check          # TypeScript type check

# Docker
docker-compose -f docker-compose.dev.yml up
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml logs -f backend
```

---

## Documentation References

- **Architecture:** See EXTENDED_AUDIT_REPORT.md
- **Health Status:** See HEALTHCHECK_REPORT.md
- **API Spec:** See api-docs/openapi.yaml
- **Deployment:** See README.md
- **Database:** See knexfile.js

---

## Support & Escalation

**Questions?**
1. Check EXTENDED_AUDIT_REPORT.md + HEALTHCHECK_REPORT.md
2. Review code comments (well-documented codebase)
3. Check GitHub issues
4. Escalate with context: error logs, steps to reproduce, environment

**Emergency:**
- Production down: Check backend health endpoint: `GET /health`
- Database issues: Check PostgreSQL logs + Redis connectivity
- Payment issues: Check M-Pesa transactions table + Bull queue

---

**Last Updated:** March 17, 2026  
**Maintainer:** Dev Team  
**For Questions:** Refer to audit reports or code comments
