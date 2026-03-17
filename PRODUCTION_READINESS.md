# 📋 CBC Learning Ecosystem - Production Action Plan

**Generated:** March 17, 2026  
**Current Status:** ✅ DEVELOPMENT-READY  
**Target Status:** 🎯 PRODUCTION-READY  
**Estimated Timeline:** 2-3 weeks

---

## Pre-Production Checklist

### 🔴 CRITICAL (Must Fix Before Deploy)

#### 1. Backend Linting Errors (14 issues)
**Estimated Time:** 30 minutes  
**Severity:** CRITICAL - prevents merge to main

```bash
cd backend && npm run lint
# Errors to fix:
- 3x ussd.service.ts: wrap case blocks in braces
- 1x sms-notification.service.ts: unused expression
```

**Action:**
```typescript
// ussd.service.ts - Wrap case declarations
switch (key) {
  case 'option1': {
    const value = '...';
    // statements
    break;
  }
}
```

#### 2. Frontend Security Vulnerabilities (6)
**Estimated Time:** 2 hours  
**Severity:** CRITICAL - exposed to XSS/RCE

```bash
cd frontend && npm audit
# Key issues:
- esbuild v<=0.24.2 (dev dependency)
- serialize-javascript v<=7.0.2 (transitive)
```

**Action:**
```bash
cd frontend
npm audit fix --force                    # Breaking but necessary
npm test                                 # Verify no breaking changes
git diff package-lock.json               # Review changes
```

#### 3. Add Pre-commit Hooks
**Estimated Time:** 1 hour  
**Severity:** CRITICAL - prevents code quality regression

```bash
npm install -D husky lint-staged
npx husky install

# Add to .husky/pre-commit:
npx lint-staged
```

**In package.json:**
```json
{
  "lint-staged": {
    "backend/src/**/*.ts": "cd backend && npm run lint -- --fix",
    "frontend/src/**/*.{ts,tsx}": "cd frontend && npm run lint -- --fix"
  }
}
```

---

### 🟡 HIGH (Complete Next Week)

#### 4. Write Payment Flow Tests
**Estimated Time:** 8 hours  
**Owner:** QA Lead  
**Priority:** Must complete before production

```typescript
// backend/src/services/__tests__/mpesa.service.test.ts
describe('M-Pesa Payment Service', () => {
  describe('Idempotency Key Safety', () => {
    it('should return same result for duplicate request', async () => {
      const idempotencyKey = 'key-123';
      const result1 = await MpesaService.initiatePayment(idempotencyKey, {...});
      const result2 = await MpesaService.initiatePayment(idempotencyKey, {...});
      
      expect(result1.id).toBe(result2.id);
      expect(result1.amount).toBe(result2.amount);
    });
    
    it('should handle concurrent callbacks safely', async () => {
      const promises = Array(5).fill(null).map(() => 
        MpesaService.handleCallback(testCallbackData)
      );
      
      const results = await Promise.all(promises);
      const uniqueIds = new Set(results.map(r => r.id));
      
      expect(uniqueIds.size).toBe(1);  // Only one recorded
    });
  });
  
  describe('Rate Limiting', () => {
    it('should enforce 5 req/min per user', async () => {
      const userId = 1;
      const requests = Array(6).fill(null).map(() =>
        MpesaService.initiatePayment(userId, {...})
      );
      
      // First 5 should succeed, 6th should fail
      // Verify with jest.fake timers
    });
  });
});
```

#### 5. Refactor TeacherClassroomPortal
**Estimated Time:** 4 hours  
**Owner:** Frontend Lead  
**Goal:** Split 712 LOC into modular components

```typescript
// frontend/src/components/TeacherClassroomPortal/
├── TeacherClassroomPortal.tsx    (main, ~200 LOC)
├── AssessmentsTab.tsx            (~150 LOC)
├── AttendanceTab.tsx             (~150 LOC)
├── ClassbookTab.tsx              (~150 LOC)
├── LessonPlanTab.tsx             (~120 LOC)
└── utils/
    ├── designTokens.ts
    ├── dataHelpers.ts
    └── components.tsx             (Badge, MiniBar, etc.)
```

#### 6. Consolidate Logging
**Estimated Time:** 1 hour  
**Owner:** Any Dev

```bash
cd backend
grep -r "console\." src --include="*.ts"  # Find all 19

# Replace with:
import { logger } from '../utils/logger';
logger.info('...', { context });
```

---

### 🟢 MEDIUM (Sprint 2)

#### 7. Add E2E Test Suite
**Estimated Time:** 6-8 hours  
**Tool:** Cypress or Playwright  
**Scope:**
- [ ] Login flow
- [ ] Attendance marking
- [ ] Payment initiation (sandbox mode)
- [ ] Conflict resolution

```bash
npm install -D cypress
npx cypress open

# Test flow example:
cy.visit('http://localhost:3000/login');
cy.get('input[name=email]').type('teacher@demo.school');
cy.get('input[name=password]').type('testpass123');
cy.get('button[type=submit]').click();
cy.url().should('include', '/teacher');
```

#### 8. Setup CI/CD Pipeline
**Estimated Time:** 4-6 hours  
**Platform:** GitHub Actions  
**Jobs:**
- Lint + Type Check
- Unit Tests
- Integration Tests
- Build Docker images
- Push to registry

```yaml
name: CI/CD

on: [push, pull_request]

jobs:
  backend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install && npm run lint
  
  backend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm install && npm run build
  
  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm install && npm run build
```

#### 9. Implement Secrets Management
**Estimated Time:** 4 hours  
**Tool:** AWS Secrets Manager or HashiCorp Vault

```bash
# Store production secrets securely, not in .env
# Implement secret rotation every 90 days
# Use IAM roles for service authentication
```

#### 10. Performance Profiling
**Estimated Time:** 4 hours  
**Tools:** Artillery (load test), Clinic.js (profiling)

```bash
# Load test M-Pesa endpoints
npm install -D artillery
artillery quick --count 100 --num 1000 http://localhost:5000/health

# Profile production code paths
clinic doctor -- node dist/index.js
```

---

## Deployment Strategy

### Stage 1: Staging Deployment (Week 1)
- Deploy to staging environment
- Run full test suite
- Performance baseline testing
- Security audit (OWASP Top 10)

### Stage 2: Canary Deployment (Week 2)
- 5% traffic to production
- Monitor error rates & latency
- Gradually increase to 50%

### Stage 3: Full Production (Week 3)
- 100% traffic to production
- Monitor 24/7
- Runbook ready for incidents

---

## Migration & Rollback Plan

### Database Migration Strategy

```bash
# Pre-production
1. Backup production database
2. Run migrations in staging
3. Test all queries with real data
4. Document rollback procedure

# Production deployment
1. Scheduled maintenance window
2. Run: npm run migrate
3. Verify: SELECT COUNT(*) FROM users;
4. Monitor: Check slow_log for new queries

# Rollback (if needed)
npm run migrate:rollback
```

### API Versioning for Rollback

```typescript
// Keep both /v1 and /v2 routes
// Allow graceful client transition
app.use('/api/v1', apiV1Routes);  // Old stable version
app.use('/api/v2', apiV2Routes);  // New features

// Deprecation timeline:
// - Week 1-4: Both versions active
// - Week 5-8: Warning headers to v1 users
// - Week 9+: Remove v1 support
```

---

## Monitoring & Observability

### Setup CloudWatch/DataDog

```bash
# Key metrics to monitor:
- Backend error rate (< 1%)
- M-Pesa callback latency (< 500ms)
- Database connection pool usage
- Redis memory usage
- Frontend page load time (< 2s)

# Alerts to configure:
- Error rate > 5%
- API response time > 1000ms
- Database down
- Payment processing delayed > 5min
```

### Log Aggregation

```bash
# Stack: ELK (Elasticsearch, Logstash, Kibana)
# or: DataDog, Sumo Logic, etc.

# Log format (JSON for parsing):
{
  "timestamp": "2026-03-17T20:00:00Z",
  "level": "error",
  "service": "backend",
  "userId": 123,
  "message": "Payment processing failed",
  "context": { "paymentId": "PAY-456", "error": "..." }
}
```

---

## Risk Assessment & Mitigation

### High Risk Items

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| M-Pesa API outage | MEDIUM | CRITICAL | Fallback payment gateway, SMS notifications |
| Database corruption | LOW | CRITICAL | Automated backups, replication |
| DDoS attack | LOW | HIGH | AWS Shield/CloudFlare DDoS protection |
| Data breach | LOW | CRITICAL | Encryption at rest, TLS in transit, WAF |

### Mitigation Actions

```bash
# 1. Database Backups
- Automated daily backups to S3
- WAL archiving every 1 minute
- Test restore procedure weekly

# 2. Disaster Recovery
- Documented RTO: 1 hour
- RPO: 5 minutes
- Practice drill: Monthly

# 3. Incident Response
- On-call rotation (24/7 coverage)
- Incident severity levels defined
- Runbooks for common issues
```

---

## Success Criteria

### Launch Readiness

- ✅ Zero critical security issues
- ✅ All backend linting errors fixed
- ✅ Frontend dependencies updated
- ✅ All tests passing (>80% coverage target)
- ✅ Performance benchmarks met
- ✅ Runbooks documented
- ✅ Team trained on deployment process

### Post-Launch (First Week)

- ✅ Error rate < 1%
- ✅ 99.9% uptime
- ✅ Payment processing < 500ms
- ✅ Page load time < 2s
- ✅ Zero data loss incidents
- ✅ All security alerts investigated

---

## Sign-off

| Role | Name | Date | Sign-off |
|------|------|------|----------|
| Tech Lead | TBD | --- | ☐ |
| QA Lead | TBD | --- | ☐ |
| DevOps Lead | TBD | --- | ☐ |
| Product Owner | TBD | --- | ☐ |

---

## Appendix: Useful Commands

```bash
# Release Checklist
./scripts/pre-production-checklist.sh

# Health Check
curl http://localhost:5000/health

# Database Status
psql -c "\dt" cbc_learning_ecosystem

# Redis Status
redis-cli info server

# Build Sizes
cd frontend && npm run build && du -sh dist/

# Security Scan
npm audit --audit-level=moderate

# Load Test
artillery run load-test.yml

# Performance Profile
clinic doctor -- node dist/index.js
```

---

## Emergency Contacts

**On-Call Schedule:** [Link to calendar]  
**Escalation:** [Team Slack channel]  
**Vendor Support:** M-Pesa (Safaricom), AWS, etc.

---

**Document Version:** 1.0  
**Last Updated:** March 17, 2026  
**Next Review:** After alpha testing
