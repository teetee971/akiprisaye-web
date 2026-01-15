# 📊 POST-PRODUCTION MONITORING CHECKLIST

**Date:** 2026-01-08  
**Status:** Production Monitoring Active  
**Duration:** First 48 hours critical

---

## 🎯 PURPOSE

Lightweight client-side observability to detect real production friction without:
- ❌ Backend/API
- ❌ Analytics tools (GA, PostHog, Sentry)
- ❌ User tracking/cookies
- ❌ Personal data collection

**Method:** Console logs only (developer tools)

---

## 🔍 WHAT TO TEST (Samsung S24+)

### 1️⃣ Quick Scan Feature (PROMPT 3 Optimization)

**Route:** `/recherche-prix`

**First Visit:**
- [ ] Open `/recherche-prix` in incognito/private mode
- [ ] Verify "Scanner maintenant" quick scan button appears
- [ ] Check console for: `[UX_MONITOR] navigation:page_view`
- [ ] Tap quick scan button
- [ ] Check console for: `[UX_MONITOR] navigation:quick_scan_button_used`
- [ ] Check console for: `[UX_MONITOR] navigation:search_mode_selected {"mode":"barcode"}`

**Expected Console Logs:**
```
[UX_MONITOR] navigation:page_view {"route":"/recherche-prix"}
[UX_MONITOR] navigation:quick_scan_button_used
[UX_MONITOR] navigation:search_mode_selected {"mode":"barcode"}
```

**Return Visit:**
- [ ] Visit `/recherche-prix` again (localStorage should remember preference)
- [ ] Quick scan button should still work
- [ ] Console logs confirm mode remembered

---

### 2️⃣ Barcode Scanning (PROMPT 3 Optimization)

**Route:** `/scan-ean`

**Camera Permission Flow:**
- [ ] Open `/scan-ean`
- [ ] Check console for: `[UX_MONITOR] scan:scan_started {"mode":"barcode"}`
- [ ] Check console for: `[UX_MONITOR] permission:camera_permission_requested`
- [ ] ALLOW camera when prompted
- [ ] Check console for: `[UX_MONITOR] permission:camera_permission_granted in Xms`
- [ ] Scan a barcode
- [ ] Check console for: `[UX_MONITOR] scan:scan_completed in Xms {"mode":"barcode","success":true}`

**Expected Console Logs (Success):**
```
[UX_MONITOR] scan:scan_started {"mode":"barcode"}
[UX_MONITOR] permission:camera_permission_requested
[UX_MONITOR] permission:camera_permission_granted in 1234ms
[UX_MONITOR] scan:scan_completed in 3456ms {"mode":"barcode","success":true}
```

**Camera Permission Denied:**
- [ ] Open `/scan-ean` in incognito
- [ ] DENY camera when prompted
- [ ] Check console for: `[UX_MONITOR] permission:camera_permission_denied in Xms {"reason":"..."}`
- [ ] Verify fallback to image upload appears
- [ ] Upload barcode image
- [ ] Check console for scan completion (success or failure)

**Expected Console Logs (Denied):**
```
[UX_MONITOR] scan:scan_started {"mode":"barcode"}
[UX_MONITOR] permission:camera_permission_requested
[UX_MONITOR] permission:camera_permission_denied in 567ms {"reason":"NotAllowedError: Permission denied"}
```

**Scan Failure:**
- [ ] Upload image without barcode
- [ ] Check console for: `[UX_MONITOR] scan:scan_completed in Xms {"mode":"barcode","success":false}`

---

### 3️⃣ Geolocation (Map Feature)

**Route:** `/carte`

**Geolocation Flow:**
- [ ] Open `/carte`
- [ ] Tap "Activer ma position" button
- [ ] Check console for: `[UX_MONITOR] permission:geolocation_requested`
- [ ] ALLOW location when prompted
- [ ] Check console for: `[UX_MONITOR] permission:geolocation_granted in Xms`
- [ ] Map should center on your location

**Expected Console Logs (Success):**
```
[UX_MONITOR] permission:geolocation_requested
[UX_MONITOR] permission:geolocation_granted in 2345ms
```

**Geolocation Denied:**
- [ ] Open `/carte` in incognito
- [ ] Tap "Activer ma position"
- [ ] DENY location when prompted
- [ ] Check console for: `[UX_MONITOR] permission:geolocation_denied in Xms {"reason":"PERMISSION_DENIED"}`
- [ ] Verify app continues working (non-blocking message)

**Expected Console Logs (Denied):**
```
[UX_MONITOR] permission:geolocation_requested
[UX_MONITOR] permission:geolocation_denied in 890ms {"reason":"PERMISSION_DENIED"}
```

---

### 4️⃣ Real-Time Scan Feedback (PROMPT 3 Optimization)

**Route:** `/scan-ean` (camera active)

**Visual Feedback States:**
- [ ] Open scanner and allow camera
- [ ] Observe scanning overlay border colors:
  - Blue border = Searching
  - Yellow border = Detected
  - Green border = Reading
- [ ] Check console for timing (scan feedback is visual only, no specific logs)
- [ ] Verify smooth transitions between states

**Expected Behavior:**
- Blue → Yellow → Green → Success
- No jarring jumps
- Clear visual confirmation at each step

---

## 📊 NORMAL VS ABNORMAL SIGNALS

### ✅ NORMAL (Expected in Production)

**High Frequency (OK):**
```
[UX_MONITOR] navigation:page_view {"route":"/..."}
[UX_MONITOR] navigation:search_mode_selected {"mode":"..."}
[UX_MONITOR] scan:scan_started {"mode":"barcode"}
[UX_MONITOR] permission:camera_permission_requested
[UX_MONITOR] permission:geolocation_requested
```

**Moderate Frequency (OK):**
```
[UX_MONITOR] permission:camera_permission_denied in Xms {"reason":"..."}
[UX_MONITOR] permission:geolocation_denied in Xms {"reason":"..."}
[UX_MONITOR] scan:scan_completed in Xms {"mode":"barcode","success":false}
```
*Some users will deny permissions or scan unclear images - this is expected.*

**Low Frequency (OK):**
```
[UX_MONITOR] scan:scan_completed in Xms {"mode":"barcode","success":true}
[UX_MONITOR] permission:camera_permission_granted in Xms
[UX_MONITOR] permission:geolocation_granted in Xms
```
*Success after permission grant.*

---

### ⚠️ ABNORMAL (Investigate)

**High Permission Denial Rate (>70%):**
```
[UX_MONITOR] permission:camera_permission_denied in Xms {"reason":"..."}
[UX_MONITOR] permission:geolocation_denied in Xms {"reason":"..."}
```
**Action:** Check if Permissions-Policy is still correct in production.

**High Scan Failure Rate (>60%):**
```
[UX_MONITOR] scan:scan_completed in Xms {"mode":"barcode","success":false}
```
**Action:** Users may need better instructions (lighting, distance, clarity).

**Slow Permission Timing (>5000ms):**
```
[UX_MONITOR] permission:camera_permission_granted in 8234ms
```
**Action:** Browser/device performance issue, not app issue.

**Repeated JS Errors:**
```
[UX_MONITOR] error:js_error {"message":"...","context":"...","stack":"..."}
```
**Action:** Bug in code - investigate stack trace.

**Unhandled Promise Rejections:**
```
[UX_MONITOR] error:unhandled_promise_rejection {"reason":"...","context":"..."}
```
**Action:** Missing error handling - add try/catch.

---

## 🚨 ACTION TRIGGERS

### 🟢 DEPLOY REMAINING OPTIMIZATIONS

**Trigger:** After 48 hours with clean signals:
- Permission grant rate >30%
- Scan success rate >40%
- No critical JS errors
- Quick scan feature used frequently

**Action:** Implement PROMPT 3 remaining optimizations:
- #3: Progressive Results
- #4: GPS Value Prompt
- #5: Skeleton Loading

---

### 🟡 MONITOR LONGER

**Trigger:** Mixed signals:
- Permission denial rate 50-70%
- Scan failure rate 40-60%
- Occasional JS errors (< 5 per hour)

**Action:** Wait 72 hours, collect more data, analyze patterns.

---

### 🔴 INVESTIGATE & FIX

**Trigger:** Critical issues:
- Permission denial rate >80%
- Scan failure rate >80%
- Frequent JS errors (> 10 per hour)
- App crashes/freezes

**Action:** Roll back or hotfix immediately.

---

## 🧪 CONSOLE FILTERING

**Chrome DevTools:**
```
Filter: [UX_MONITOR]
```

**Firefox DevTools:**
```
Filter: UX_MONITOR
```

**Safari DevTools:**
```
Filter: UX_MONITOR
```

**View Only Errors:**
```
Filter: [UX_MONITOR] error
```

**View Only Permissions:**
```
Filter: [UX_MONITOR] permission
```

**View Only Scans:**
```
Filter: [UX_MONITOR] scan
```

---

## 📈 SUCCESS METRICS (48H)

### Ideal Targets:
- [ ] Quick scan button used >50 times
- [ ] Camera permission granted >30% of requests
- [ ] Geolocation granted >20% of requests
- [ ] Scan success rate >40%
- [ ] Zero critical JS errors
- [ ] Zero unhandled promise rejections

### Acceptable Ranges:
- [ ] Camera permission granted >20% (acceptable)
- [ ] Geolocation granted >10% (acceptable)
- [ ] Scan success rate >30% (acceptable)
- [ ] <5 JS errors per 100 page views (acceptable)

### Red Flags:
- [ ] Camera permission denied >80% (investigate)
- [ ] Geolocation denied >90% (investigate)
- [ ] Scan success rate <20% (improve instructions)
- [ ] >10 JS errors per 100 page views (bug)

---

## 🔧 HOW TO DISABLE MONITORING

**Environment Variable:**
```bash
# In .env or Cloudflare Pages settings
VITE_UX_MONITOR_ENABLED=false
```

**Code Toggle:**
```typescript
// In src/utils/uxMonitor.ts (line 20)
const UX_MONITOR_ENABLED = false; // Set to false
```

**After Deployment:**
- Monitoring stops immediately
- No console logs
- Zero performance impact
- All monitoring code is dormant

---

## 📝 WHAT TO REPORT (After 48H)

### Summary Template:
```markdown
## UX Monitor Report (48H)

**Period:** [Start Date] to [End Date]
**Device:** Samsung S24+ / Android

### Quick Scan Feature
- Times used: X
- Conversion to scan: X%
- User feedback: [Positive/Negative/Neutral]

### Camera Permissions
- Requested: X times
- Granted: X% (Xms avg)
- Denied: X% (reasons: ...)

### Geolocation Permissions
- Requested: X times
- Granted: X% (Xms avg)
- Denied: X% (reasons: ...)

### Scan Success Rate
- Total scans: X
- Success: X%
- Failure: X% (common reasons: ...)

### Errors
- JS errors: X
- Unhandled rejections: X
- Critical issues: [None/List]

### Recommendation
[Deploy remaining optimizations / Monitor longer / Investigate issues]
```

---

## 🎯 NEXT STEPS DECISION TREE

```
After 48H monitoring:

Clean signals (>30% permissions, >40% scans, <5 errors)
├─→ ✅ Deploy PROMPT 3 remaining optimizations
└─→ ✅ Implement #3, #4, #5

Mixed signals (20-30% permissions, 30-40% scans, 5-10 errors)
├─→ ⏳ Monitor 72H more
└─→ ⏳ Analyze user patterns

Critical issues (<20% permissions, <30% scans, >10 errors)
├─→ 🔴 Investigate root cause
├─→ 🔴 Check Permissions-Policy
└─→ 🔴 Hotfix or rollback
```

---

## 🔒 PRIVACY COMPLIANCE

**RGPD/GDPR:** ✅ Compliant
- No cookies
- No user IDs
- No fingerprinting
- No external services
- No personal data
- Console logs only (developer tools)

**Data Retention:** None (console logs are ephemeral)

**User Impact:** Zero (no UI changes, no performance impact)

---

**Monitoring Status:** 🟢 ACTIVE  
**Next Review:** 48 hours after deployment  
**Disable If:** No issues found after 72 hours
