# Security Audit – akiprisaye-web

**Last Updated**: 2026-02-06  
**Context**: Bundle optimization + npm security audit  
**Location**: `frontend/`

## Summary

Current status: **2 moderate severity vulnerabilities** (accepted with documented rationale)

- Critical: 0
- High: 0
- Moderate: 2 (esbuild via vite - dev server only)
- Low: 0
- Total: 2

## Vulnerability Details

### esbuild ≤0.24.2 (GHSA-67mh-4wv8-2f99)

**Severity**: Moderate (CVSS 5.3)  
**Type**: Development server CORS vulnerability  
**Package**: `esbuild` (transitive dependency via `vite`)  
**Affected Versions**: esbuild ≤0.24.2, vite 0.11.0 - 6.1.6  
**Current Version**: vite 5.4.21 (latest in 5.x branch)

#### Description
The vulnerability allows any website to send requests to the development server and read responses due to improper CORS handling in the dev server.

#### Impact Assessment
- **Production Risk**: ✅ **NONE** - Vulnerability only affects development servers, not production builds
- **Development Risk**: ⚠️ **LOW** - Requires:
  - Developer running local dev server
  - Developer visiting a malicious website simultaneously
  - Attacker knowing the dev server URL/port
  - Attack complexity rated as "HIGH" with User Interaction required
- **Attack Vector**: Network, High Complexity, Requires User Interaction

#### Fix Available
- **Available Fix**: Upgrade to vite 7.3.1
- **Breaking Changes**: ✅ Yes - Vite 7.x introduces breaking changes to config and plugins
- **Decision**: **RISK ACCEPTED** - Vulnerability does not affect production deployments

#### Rationale for Acceptance

1. **No Production Impact**: The vulnerability is explicitly limited to development servers. Production builds served via Cloudflare Pages are not affected.

2. **Low Real-World Risk**: Exploitation requires:
   - Active development server running locally
   - Developer simultaneously visiting a malicious website
   - Attacker having knowledge of the dev server configuration (host/port)
   - Attack complexity rated as "HIGH" by CVSS

3. **Breaking Changes Cost**: Upgrading to Vite 7.x would require:
   - Major version bump (5.x → 7.x)
   - Extensive testing of build configurations
   - Potential changes to plugins (@vitejs/plugin-react, vite-plugin-static-copy)
   - Risk of introducing regressions before critical deployment

4. **Already on Latest 5.x**: We're running vite 5.4.21, the latest version in the 5.x branch, which includes all non-breaking security patches available.

5. **Alternative Mitigations**: Developers can:
   - Only run dev servers on localhost (not exposed networks)
   - Close dev servers when not actively developing
   - Avoid browsing untrusted sites while running dev servers
   - Use browser extensions to limit CORS if needed

## Production Build Validation

✅ **Build Status**: Success  
✅ **Bundle Size**: Optimized with lazy loading  
✅ **Security**: No vulnerable packages in production runtime  
✅ **Performance**: Initial bundle reduced by 63%

```bash
# Latest build results (2026-02-06)
npm run build
# ✓ 3216 modules transformed
# dist/assets/index-BGyPw5NC.js: 580.03 kB (145.44 kB gzip)
# + 30+ lazy-loaded chunks
# ✓ built in 20.07s
```

### Key Improvements
- Initial bundle: **1,564 KB → 580 KB** (-63%)
- Gzipped: **403 KB → 145 KB** (-64%)
- All page components lazy-loaded via React.lazy()
- Critical components (Layout, ErrorBoundary, Providers) remain eager-loaded

## Developer Guidelines

### Security Best Practices
1. ✅ **DO**: Run development servers only on localhost
2. ✅ **DO**: Close dev servers when not actively developing  
3. ❌ **DON'T**: Expose dev servers to untrusted networks
4. ❌ **DON'T**: Browse untrusted websites while dev server is running

### Build Commands
```bash
cd frontend
npm ci                 # Install exact versions from package-lock.json
npm audit              # Review vulnerabilities
npm run build          # Production build
```

## Mitigation Strategy

### Short-term (Current - Q1 2026)
- ✅ Document vulnerability and acceptance rationale
- ✅ Ensure production builds are not affected
- ✅ Developer awareness and best practices
- ✅ Bundle optimization with lazy loading

### Medium-term (Q2-Q3 2026)
- 📅 Monitor Vite 7.x adoption and stability
- 📅 Test compatibility with all plugins and dependencies
- 📅 Plan upgrade in next major version release
- 📅 Ensure no regressions in build process

## Audit History

| Date | Vulnerabilities | Action | Status |
|------|----------------|--------|--------|
| 2026-01-27 | 2 moderate (esbuild) | Initial documentation | Documented |
| 2026-02-06 | 2 moderate (esbuild) | Bundle optimization + audit update | ✅ Accepted |

## Next Review

**Scheduled**: Q2 2026 or before next major version release  
**Trigger**: Vite 7.x stability confirmation or new vulnerability disclosure

## Verification Commands

```bash
# Check current vulnerabilities
cd frontend
npm audit

# Expected output: 2 moderate vulnerabilities (documented above)

# Verify production build
npm run build
# Expected: Success with optimized bundle sizes
```

---

**Status**: ✅ Accepted  
**Approved by**: Development Team  
**Last Review**: 2026-02-06  
**Next Review**: Q2 2026