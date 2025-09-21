# Security Headers Documentation - A KI PRI SA YÉ

This document describes the HTTP security headers implemented to enhance the security of the A KI PRI SA YÉ web application.

## Implemented Security Headers

### 1. Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- **Purpose**: Forces HTTPS connections and prevents protocol downgrade attacks
- **Configuration**: 
  - `max-age=63072000` (2 years) - Long cache duration
  - `includeSubDomains` - Applies to all subdomains
  - `preload` - Enables inclusion in browser preload lists

### 2. Content Security Policy (CSP)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://dummyimage.com; connect-src 'self' https://*.firebaseapp.com https://*.cloudfunctions.net https://identitytoolkit.googleapis.com https://firestore.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

**Directive breakdown:**
- `default-src 'self'` - Default to same-origin only
- `script-src` - JavaScript sources:
  - `'self'` - Same origin
  - `'unsafe-inline'` - Inline scripts (for service worker registration)
  - `https://www.gstatic.com` - Firebase SDK
  - `https://cdn.jsdelivr.net` - Polyfills (lazy loading)
- `style-src` - CSS sources:
  - `'self'` - Same origin 
  - `'unsafe-inline'` - Inline styles
  - `https://fonts.googleapis.com` - Google Fonts
  - `https://unpkg.com` - Leaflet CSS
- `font-src` - Font sources:
  - `'self'` - Same origin
  - `https://fonts.gstatic.com` - Google Fonts
- `img-src` - Image sources:
  - `'self'` - Same origin
  - `data:` - Data URLs (base64 images)
  - `https://dummyimage.com` - Placeholder images
- `connect-src` - AJAX/WebSocket sources:
  - `'self'` - Same origin
  - `https://*.firebaseapp.com` - Firebase Auth domain
  - `https://*.cloudfunctions.net` - Firebase Functions
  - `https://identitytoolkit.googleapis.com` - Firebase Auth API
  - `https://firestore.googleapis.com` - Firestore API
- `frame-ancestors 'none'` - Prevents embedding in frames
- `base-uri 'self'` - Restricts base URL
- `form-action 'self'` - Restricts form submission targets

### 3. X-Frame-Options
```
X-Frame-Options: DENY
```
- **Purpose**: Prevents clickjacking attacks by denying frame embedding
- **Value**: `DENY` - Complete prohibition of framing

### 4. X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
- **Purpose**: Prevents MIME type sniffing attacks
- **Value**: `nosniff` - Forces respect of declared content types

### 5. X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
- **Purpose**: Enables legacy XSS filtering in older browsers
- **Configuration**: `1; mode=block` - Enable and block on detection

### 6. Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
- **Purpose**: Controls referrer information sent with requests
- **Value**: `strict-origin-when-cross-origin` - Send origin only on cross-origin HTTPS requests

### 7. Permissions-Policy
```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=()
```
- **Purpose**: Disables unnecessary browser APIs
- **Disabled APIs**: Location, camera, microphone, payment, device sensors
- **Security Benefit**: Reduces attack surface by preventing unauthorized API access

## Performance Headers

### Cache Control
```
Cache-Control: public, max-age=3600        # Main content
Cache-Control: public, max-age=31536000, immutable  # Static assets
Cache-Control: public, max-age=600         # API responses
```

## API-Specific Headers

For `/api/*` endpoints, additional restrictive CSP is applied:
```
Content-Security-Policy: default-src 'none'; connect-src 'self'
```
This ensures API endpoints have minimal security exposure.

## Deployment

The security headers are configured in:
1. `public/_headers` - Main configuration file for Cloudflare Pages
2. `setup_redirects.sh` - Script that generates headers for new deployments

## Testing

To verify headers are working:
1. Build: `npm run build`
2. Check: `cat dist/client/_headers`
3. Deploy and test with browser developer tools or online security scanners

## Security Score Impact

These headers significantly improve security scores on tools like:
- Mozilla Observatory
- Security Headers scanner
- Google PageSpeed Insights security audit
- Qualys SSL Labs (for HSTS preload)

## Maintenance

When adding new external resources:
1. Update the CSP directives in `public/_headers`
2. Update `setup_redirects.sh` for consistency
3. Test thoroughly to ensure functionality is maintained