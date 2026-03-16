# CBC Learning Ecosystem — Production Monorepo

> **Kenyan EdTech platform** · M-Pesa fee payments · CBC competency tracking · Offline-first PWA

[![Deploy Backend](https://railway.app/button.svg)](https://railway.app)
[![Deploy Frontend](https://vercel.com/button)](https://vercel.com)

---

## Deploy in 3 commands

```bash
# 1. Generate secure secrets
node infra/generate-secrets.js

# 2. Create Railway project + paste secrets from step 1
#    → railway.app → New Project → Deploy from GitHub

# 3. Create Vercel project
#    → vercel.com → New Project → Import from GitHub (frontend folder)
```

See the **Deployment Runbook** for the full 30-minute step-by-step guide.

---

## Repository Structure

```
cbc-learning-ecosystem/
├── backend/              Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── index.ts      Entry point
│   │   ├── config/       database.ts, redis.ts
│   │   ├── middleware/   auth.ts, validation.ts, startup-validation.ts
│   │   ├── utils/        logger.ts
│   │   ├── controllers/  mpesa.controller.ts
│   │   ├── routes/       mpesa.routes.ts
│   │   ├── services/     mpesa.service.ts, payment-provider.service.ts, ...
│   │   └── database/
│   │       ├── migrate.ts
│   │       ├── migrations/
│   │       └── seeds/
│   ├── Dockerfile
│   ├── railway.toml
│   ├── render.yaml
│   ├── knexfile.js
│   ├── package.json
│   └── tsconfig.json
├── frontend/             React 18 + Vite + PWA
│   ├── src/
│   │   ├── App.tsx       Root with role-based routing
│   │   ├── main.tsx      Entry + service worker registration
│   │   ├── index.css     Tailwind + CBC brand tokens
│   │   ├── components/   TeacherClassroomPortal, StudentLabPortal, MpesaPayment, ...
│   │   ├── services/     mpesa-payment.service.ts
│   │   ├── store/        auth.ts (Zustand)
│   │   └── hooks/        useOnlineStatus.ts
│   ├── public/
│   │   ├── manifest.json
│   │   ├── service-worker.js
│   │   └── offline.html
│   ├── Dockerfile
│   ├── vercel.json
│   ├── nginx.conf
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── infra/
│   └── generate-secrets.js
├── .github/
│   └── workflows/deploy.yml
└── docker-compose.dev.yml
```

---

## Demo Accounts

Password for all: `Demo@2026!`

| Role | Email |
|------|-------|
| Admin | admin@demo.cbclearning.co.ke |
| Teacher | teacher@demo.cbclearning.co.ke |
| Parent | parent@demo.cbclearning.co.ke |
| Student | student@demo.cbclearning.co.ke |

---

## Local Development

```bash
# Start full stack (Postgres + Redis + Backend + Frontend with hot reload)
docker compose -f docker-compose.dev.yml up

# Backend only
cd backend && npm install && npm run dev

# Frontend only
cd frontend && npm install && npm run dev
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20, Express 4, TypeScript 5 |
| Database | PostgreSQL 15 via Knex |
| Cache / Queue | Redis 7 via IORedis + Bull |
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| PWA | Workbox service worker, Web App Manifest |
| Payments | Safaricom Daraja API (M-Pesa STK Push + C2B) |
| SMS | Africa's Talking |
| Deploy | Railway (backend) + Neon (DB) + Vercel (frontend) |
| CI/CD | GitHub Actions |

---

## Key Features

- **M-Pesa native** — STK Push fee collection, C2B paybill, instant settlement
- **CBC-compliant** — 7 competency areas, 2-6-3-3-3 curriculum structure
- **Offline-first** — service worker cache, sync queue, conflict resolution
- **ODPC compliant** — Kenya Data Protection Act, KICD-endorsed
- **No-phone policy** — school lab device access, sessionStorage (no localStorage)
- **Rural-ready** — <100KB per session, works on 3G, progressive image loading

---

*CBC Learning Ecosystem — Pre-Seed 2026 · tech@cbclearning.co.ke*
