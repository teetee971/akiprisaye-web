# Cloudflare Deployment Verification Checklist

## Pre-Deployment Verification ✅ COMPLETE

- [x] All 27 files in `/functions` audited
- [x] Zero global scope async operations
- [x] JavaScript syntax validated
- [x] Code review passed
- [x] Documentation created

## Post-Deployment Testing (À faire après le déploiement)

### 1. Deployment Success
- [ ] Push to main branch or create pull request
- [ ] Cloudflare Pages build completes without errors
- [ ] No "Disallowed operation called within global scope" error
- [ ] Deployment status shows "Success"

### 2. Function Endpoints Testing

#### Health Check
```bash
curl https://YOUR_DOMAIN/api/health
# Expected: {"status":"healthy", "version":"1.1.0", ...}
```

#### Rate Limiting (Contact Form)
```bash
# Test 1 - Should succeed
curl -X POST https://YOUR_DOMAIN/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","subject":"Test","message":"Test message"}'

# Test 2-6 - Should succeed
# (repeat 4 more times)

# Test 7 - Should fail with 429 (rate limit exceeded)
curl -X POST https://YOUR_DOMAIN/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","subject":"Test","message":"Test message"}'
# Expected: {"error":"Rate limit exceeded", ...}
```

#### News API
```bash
curl https://YOUR_DOMAIN/api/news
# Expected: {"data":[...], "meta":{...}}
```

#### Product Search
```bash
curl "https://YOUR_DOMAIN/api/products/search?q=lait"
# Expected: [{"name":"...", "brand":"...", "ean":"...", ...}]
```

#### Price Comparison
```bash
curl "https://YOUR_DOMAIN/api/compare?ean=3017620422003&territoire=guadeloupe"
# Expected: {"ean":"3017620422003", "prices":[...], ...}
```

#### Observations API
```bash
curl "https://YOUR_DOMAIN/api/observations?territoire=Guadeloupe&limit=5"
# Expected: {"meta":{...}, "data":[...]}
```

#### Territorial Comparison
```bash
curl "https://YOUR_DOMAIN/api/comparaison/territoires?produit=riz"
# Expected: {"meta":{...}, "comparaison":[...]}
```

#### Price Evolution
```bash
curl "https://YOUR_DOMAIN/api/evolution/prix?produit=riz&territoire=Guadeloupe"
# Expected: {"meta":{...}, "evolution":[...]}
```

### 3. Runtime Warnings Check

In Cloudflare Pages dashboard:
- [ ] Go to "Functions" tab
- [ ] Check "Logs" section
- [ ] Verify ZERO warnings about:
  - Global scope violations
  - Disallowed operations
  - Worker exceptions
  - Timeout errors

### 4. Performance Verification

- [ ] All endpoints respond within < 1 second
- [ ] Rate limiting cleanup doesn't cause performance issues
- [ ] No memory leaks (monitor over 24 hours)

### 5. Functional Testing

#### Rate Limiting
- [ ] Rate limiting enforces 5 requests per hour per IP
- [ ] Rate limit resets after 1 hour
- [ ] Cleanup removes expired entries without errors

#### OCR Endpoint (if implemented)
```bash
curl -X POST https://YOUR_DOMAIN/api/ocr \
  -F "image=@test-receipt.jpg"
# Expected: {"success":true, "data":{...}}
```

## Issues to Watch For

### If deployment still fails:

1. **Check build logs** in Cloudflare Pages dashboard
2. **Verify wrangler.toml** configuration (if exists)
3. **Check environment variables** in Cloudflare dashboard
4. **Review Git commits** to ensure all changes were pushed

### If functions fail at runtime:

1. **Check Cloudflare Functions logs** for specific errors
2. **Verify fetch() calls** are not being blocked
3. **Check CORS headers** for API endpoints
4. **Monitor memory usage** for rate limiting Map size

## Success Criteria ✅

All of the following must be true:
- ✅ Deployment succeeds without errors
- ✅ All API endpoints return valid responses
- ✅ Rate limiting works correctly
- ✅ Zero runtime warnings in logs
- ✅ Response times < 1 second
- ✅ No memory leaks after 24 hours

## Rollback Plan

If issues occur:
1. Revert to previous commit
2. Push to trigger new deployment
3. Report issues in GitHub issue tracker

## Support

- **GitHub Issues:** https://github.com/teetee971/akiprisaye-web/issues
- **Cloudflare Docs:** https://developers.cloudflare.com/pages/functions
- **Fix Summary:** See `CLOUDFLARE_FUNCTIONS_FIX_SUMMARY.md`

---

**Last Updated:** 2026-01-13
**Status:** Ready for deployment
**Verification Status:** Pre-deployment checks complete ✅
