# Security Implementation Plan: Product Sync System

**Status**: Pending Authentication Integration  
**Priority**: High  
**Estimated Effort**: 2-4 hours

---

## Overview

The product sync system endpoints are currently unauthenticated. Before production deployment, these endpoints must be secured with JWT authentication and role-based access control (RBAC).

## Affected Endpoints

### 1. Sync Routes (`/api/sync/*`)

**Risk Level**: High (DoS, Cost, Data Pollution)

| Endpoint | Method | Required Auth | Required Role |
|----------|--------|---------------|---------------|
| `/api/sync/openfoodfacts/trigger` | POST | JWT | ADMIN |
| `/api/sync/openprices/trigger` | POST | JWT | ADMIN |
| `/api/sync/all/trigger` | POST | JWT | ADMIN |
| `/api/sync/jobs/:jobId/trigger` | POST | JWT | ADMIN |
| `/api/sync/status` | GET | JWT | ADMIN, MODERATOR |
| `/api/sync/history` | GET | JWT | ADMIN, MODERATOR |
| `/api/sync/jobs` | GET | JWT | ADMIN, MODERATOR |

**Why Authentication is Critical**:
- Manual triggers cause external API calls (cost/rate limits)
- Can trigger heavy database writes
- DoS risk from repeated sync triggers
- Job triggers can impact system performance

### 2. Validation Routes (`/api/validation/*`)

**Risk Level**: Critical (Data Integrity)

| Endpoint | Method | Required Auth | Required Role | Permission |
|----------|--------|---------------|---------------|------------|
| `/api/validation/queue` | GET | JWT | MODERATOR, ADMIN | PRODUCT_VIEW |
| `/api/validation/stats` | GET | JWT | MODERATOR, ADMIN | PRODUCT_VIEW |
| `/api/validation/:id` | GET | JWT | MODERATOR, ADMIN | PRODUCT_VIEW |
| `/api/validation/:id/approve` | POST | JWT | MODERATOR, ADMIN | PRODUCT_APPROVE |
| `/api/validation/:id/reject` | POST | JWT | MODERATOR, ADMIN | PRODUCT_REJECT |
| `/api/validation/:id/merge/:targetId` | POST | JWT | MODERATOR, ADMIN | PRODUCT_MERGE |

**Why Authentication is Critical**:
- Approve/reject/merge actions mutate core product data
- Could allow malicious actors to corrupt product catalog
- Business logic requires audit trail (who approved/rejected)
- GDPR compliance requires authenticated actions

## Implementation Steps

### Phase 1: Extend Authentication System

1. **Add new roles** (if not present):
   ```typescript
   enum UserRole {
     USER
     MODERATOR  // Can review products
     ADMIN      // Can trigger syncs + review products
     INSTITUTION
   }
   ```

2. **Add new permissions**:
   ```typescript
   enum Permission {
     // Existing permissions...
     PRODUCT_VIEW
     PRODUCT_APPROVE
     PRODUCT_REJECT
     PRODUCT_MERGE
     SYNC_TRIGGER
     SYNC_VIEW
   }
   ```

### Phase 2: Create Auth Middleware

Reference existing pattern from `backend/src/api/middlewares/auth.middleware.ts`:

```typescript
// backend/src/api/middlewares/productAuth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }
    next();
  };
};

export const requirePermission = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !hasPermission(req.user, permissions)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }
    next();
  };
};
```

### Phase 3: Apply Middleware to Routes

#### Sync Routes

```typescript
// backend/src/api/routes/sync.routes.ts

import { requireAuth, requireRole } from '../../api/middlewares/productAuth.middleware.js';

// Apply auth to all sync routes
router.use(requireAuth);
router.use(requireRole('ADMIN'));

// OR apply selectively:
router.post('/openfoodfacts/trigger', requireAuth, requireRole('ADMIN'), handler);
router.get('/status', requireAuth, requireRole('ADMIN', 'MODERATOR'), handler);
```

#### Validation Routes

```typescript
// backend/src/api/routes/validation.routes.ts

import { requireAuth, requireRole, requirePermission } from '../../api/middlewares/productAuth.middleware.js';

// Read operations - Moderator or Admin
router.get('/queue', requireAuth, requireRole('MODERATOR', 'ADMIN'), handler);
router.get('/stats', requireAuth, requireRole('MODERATOR', 'ADMIN'), handler);
router.get('/:id', requireAuth, requireRole('MODERATOR', 'ADMIN'), handler);

// Write operations - Require specific permissions
router.post('/:id/approve', requireAuth, requirePermission('PRODUCT_APPROVE'), handler);
router.post('/:id/reject', requireAuth, requirePermission('PRODUCT_REJECT'), handler);
router.post('/:id/merge/:targetId', requireAuth, requirePermission('PRODUCT_MERGE'), handler);
```

### Phase 4: Update app.ts Route Registration

```typescript
// backend/src/app.ts

// Protected routes - require authentication
app.use('/api/sync', authLimiter, syncRoutes);
app.use('/api/validation', authLimiter, validationRoutes);
```

### Phase 5: Add Audit Logging

Enhance actions to log who performed them:

```typescript
// In validation services
export async function approveProduct(
  productId: string,
  reviewedBy: string  // Now required, from req.user.id
): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      status: 'VALIDATED',
      validatedAt: new Date(),
      validatedBy: reviewedBy,
    },
  });

  // Add audit log
  await prisma.auditLog.create({
    data: {
      action: 'PRODUCT_APPROVED',
      userId: reviewedBy,
      resourceType: 'Product',
      resourceId: productId,
      timestamp: new Date(),
    },
  });
}
```

### Phase 6: Testing

1. **Unit Tests**:
   - Test middleware with valid/invalid tokens
   - Test role/permission checks
   - Test audit logging

2. **Integration Tests**:
   - Test each endpoint with different roles
   - Verify 401 for unauthenticated requests
   - Verify 403 for insufficient permissions

3. **Manual Testing**:
   ```bash
   # Should fail (no auth)
   curl -X POST http://localhost:3001/api/sync/openfoodfacts/trigger

   # Should succeed (with admin token)
   curl -X POST http://localhost:3001/api/sync/openfoodfacts/trigger \
     -H "Authorization: Bearer <admin-token>"
   ```

## Additional Security Enhancements

### 1. Rate Limiting (Already Implemented)

The routes already use `apiLimiter` from existing middleware. Ensure it's configured appropriately:

```typescript
// Stricter limits for privileged operations
const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: 'Too many sync requests, please try again later',
});

app.use('/api/sync', requireAuth, syncLimiter, syncRoutes);
```

### 2. IP Whitelisting (Optional)

For admin operations, consider IP whitelisting:

```typescript
const allowedIPs = process.env.ADMIN_IPS?.split(',') || [];

const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).json({ error: 'IP not whitelisted' });
  }
  next();
};

app.use('/api/sync', ipWhitelist, syncRoutes);
```

### 3. Request Validation

Already partially implemented. Ensure all endpoints validate:
- Parameter types
- Parameter ranges
- Required fields

### 4. CORS Configuration

Ensure CORS is properly configured to only allow admin dashboard origin:

```typescript
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.ADMIN_DASHBOARD_URL,
  ],
  credentials: true,
};
```

## Migration Plan

### Development Environment

1. Create test admin user:
   ```bash
   npm run create-admin-user
   ```

2. Test all endpoints with authentication

3. Update frontend admin dashboard to include auth headers

### Staging Environment

1. Deploy with authentication enabled
2. Run full integration test suite
3. Verify audit logs are working
4. Performance test with auth overhead

### Production Environment

1. Enable authentication in production config
2. Create admin users for operations team
3. Provide documentation for obtaining/using tokens
4. Monitor for authentication failures
5. Set up alerts for suspicious activity

## Monitoring & Alerts

Set up monitoring for:

1. **Failed Authentication Attempts**
   - Alert if >10 failures in 5 minutes

2. **Unauthorized Access Attempts**
   - Alert on 403 responses

3. **Sync Trigger Frequency**
   - Alert if triggered >20 times/day

4. **Validation Actions**
   - Daily report of approve/reject/merge counts
   - Flag unusual patterns

## Documentation Updates

After implementation, update:

1. **API Documentation** (`SYNC_SYSTEM_README.md`)
   - Add authentication requirements
   - Document how to obtain tokens
   - Show example requests with auth headers

2. **Quick Start Guide** (`SYNC_QUICK_START.md`)
   - Add authentication setup steps
   - Update curl examples with tokens

3. **OpenAPI/Swagger Docs**
   - Add security schemes
   - Document required roles/permissions

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Extend Auth System | 1 hour | None |
| 2. Create Middleware | 1 hour | Phase 1 |
| 3. Apply to Routes | 30 min | Phase 2 |
| 4. Update App Config | 15 min | Phase 3 |
| 5. Add Audit Logging | 1 hour | Phase 3 |
| 6. Testing | 1-2 hours | Phase 5 |
| **Total** | **4-6 hours** | |

## Success Criteria

- [ ] All sync endpoints require admin authentication
- [ ] All validation endpoints require moderator/admin authentication
- [ ] Appropriate RBAC permissions enforced
- [ ] Audit logs capture all actions with user ID
- [ ] Rate limiting prevents abuse
- [ ] 100% test coverage for auth middleware
- [ ] Documentation updated
- [ ] Security review passed

## Notes

- Current code includes TODO comments in route files pointing to this plan
- Territory filtering for OpenPrices also noted as future enhancement
- Deduplication and normalization unit tests pending

---

**Created**: 2026-02-08  
**Last Updated**: 2026-02-08  
**Owner**: Backend Team  
**Reviewers**: Security Team, DevOps
