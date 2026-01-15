# Geolocation Permissions-Policy Deployment Guide

This document explains how to fix the "Geolocation has been disabled in this document by permissions policy" error and properly configure geolocation permissions for your web application.

## Table of Contents

1. [Understanding the Problem](#understanding-the-problem)
2. [Browser Configuration](#browser-configuration)
3. [Server Headers Setup](#server-headers-setup)
4. [Iframe Configuration](#iframe-configuration)
5. [Platform-Specific Instructions](#platform-specific-instructions)
6. [WebView Configuration](#webview-configuration)
7. [Testing Locally](#testing-locally)
8. [Troubleshooting](#troubleshooting)

---

## Understanding the Problem

The Permissions-Policy (formerly Feature-Policy) is a web platform security feature that allows websites to control which browser features can be used. When geolocation is blocked, you'll see errors like:

- "Geolocation has been disabled in this document by permissions policy"
- "User denied Geolocation" (even when the user didn't explicitly deny)
- Silent failures with no error message

### Common Causes

1. **Missing Permissions-Policy header** on the server
2. **Restrictive Permissions-Policy** that blocks geolocation
3. **Iframe without `allow` attribute** when embedded in another page
4. **WebView without proper permissions** in mobile apps
5. **HTTPS requirement** - geolocation requires secure context (HTTPS)

---

## Browser Configuration

### Permissions-Policy Header

The modern way to control feature permissions is via the `Permissions-Policy` HTTP header.

**Recommended configuration:**

```http
Permissions-Policy: geolocation=(self)
```

This allows geolocation on your own domain only.

**To allow on your domain and specific trusted domains:**

```http
Permissions-Policy: geolocation=(self "https://trusted-domain.com")
```

**To allow on all origins (not recommended for production):**

```http
Permissions-Policy: geolocation=*
```

### Legacy Feature-Policy Header

For older browsers, also include the legacy `Feature-Policy` header:

```http
Feature-Policy: geolocation 'self'
```

---

## Server Headers Setup

### Generic Web Server

Add these headers to your HTTP responses:

```http
Permissions-Policy: geolocation=(self)
Feature-Policy: geolocation 'self'
```

### Apache (.htaccess)

```apache
<IfModule mod_headers.c>
    Header set Permissions-Policy "geolocation=(self)"
    Header set Feature-Policy "geolocation 'self'"
</IfModule>
```

### Nginx

```nginx
add_header Permissions-Policy "geolocation=(self)" always;
add_header Feature-Policy "geolocation 'self'" always;
```

### Node.js / Express

```javascript
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(self)');
  res.setHeader('Feature-Policy', "geolocation 'self'");
  next();
});
```

---

## Iframe Configuration

If your page is embedded in an iframe, the **parent page** must explicitly allow geolocation.

### Parent Page Configuration

Add the `allow` attribute to the iframe:

```html
<iframe 
  src="https://your-site.com" 
  allow="geolocation"
></iframe>
```

For multiple features:

```html
<iframe 
  src="https://your-site.com" 
  allow="geolocation; camera; microphone"
></iframe>
```

### Important Notes

- The `allow` attribute must be added by the **parent page**, not your page
- Your page cannot grant itself permissions when embedded
- If you cannot modify the parent page, geolocation will not work in the iframe

---

## Platform-Specific Instructions

### Netlify

Create a `_headers` file in your publish directory (usually `public/` or `dist/`):

```
/*
  Permissions-Policy: geolocation=(self)
  Feature-Policy: geolocation 'self'
```

For specific paths:

```
/map
  Permissions-Policy: geolocation=(self)
  Feature-Policy: geolocation 'self'

/store-locator
  Permissions-Policy: geolocation=(self)
  Feature-Policy: geolocation 'self'
```

**Documentation:** https://docs.netlify.com/routing/headers/

### Cloudflare Pages

Create a `_headers` file in your build output directory:

```
/*
  Permissions-Policy: geolocation=(self)
  Feature-Policy: geolocation 'self'
```

Or use Cloudflare Transform Rules in the dashboard:
1. Go to **Rules** → **Transform Rules** → **Modify Response Header**
2. Add rule: Set `Permissions-Policy` to `geolocation=(self)`
3. Add rule: Set `Feature-Policy` to `geolocation 'self'`

**Documentation:** https://developers.cloudflare.com/pages/platform/headers/

### Vercel

Create a `vercel.json` file in your project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(self)"
        },
        {
          "key": "Feature-Policy",
          "value": "geolocation 'self'"
        }
      ]
    }
  ]
}
```

**Documentation:** https://vercel.com/docs/projects/project-configuration#headers

### GitHub Pages

⚠️ **Limitation:** GitHub Pages does not support custom HTTP headers.

**Workarounds:**
1. Use a service like Cloudflare in front of GitHub Pages
2. Migrate to Netlify or Vercel for free static hosting with header support
3. Accept that geolocation won't work on GitHub Pages

### AWS S3 + CloudFront

Configure CloudFront to add custom headers:

1. Go to **CloudFront** → **Distributions**
2. Select your distribution → **Behaviors** → Edit
3. Go to **Response Headers Policy** → Create new policy
4. Add custom headers:
   - `Permissions-Policy: geolocation=(self)`
   - `Feature-Policy: geolocation 'self'`

**Documentation:** https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-response-headers.html

### Firebase Hosting

Edit `firebase.json`:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Permissions-Policy",
            "value": "geolocation=(self)"
          },
          {
            "key": "Feature-Policy",
            "value": "geolocation 'self'"
          }
        ]
      }
    ]
  }
}
```

**Documentation:** https://firebase.google.com/docs/hosting/full-config#headers

---

## WebView Configuration

### Android WebView

In your Android app, add location permissions to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Enable geolocation in your WebView:

```java
WebView webView = findViewById(R.id.webview);
WebSettings webSettings = webView.getSettings();
webSettings.setJavaScriptEnabled(true);
webSettings.setGeolocationEnabled(true);

// Set up geolocation permissions callback
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onGeolocationPermissionsShowPrompt(
        String origin, 
        GeolocationPermissions.Callback callback
    ) {
        callback.invoke(origin, true, false);
    }
});
```

### iOS WKWebView

Add location permissions to `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show nearby stores.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>We need your location to show nearby stores.</string>
```

Configure WKWebView:

```swift
import WebKit
import CoreLocation

class ViewController: UIViewController, CLLocationManagerDelegate {
    let locationManager = CLLocationManager()
    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Request location permissions
        locationManager.delegate = self
        locationManager.requestWhenInUseAuthorization()
        
        // Configure WebView
        let config = WKWebViewConfiguration()
        webView = WKWebView(frame: view.bounds, configuration: config)
        view.addSubview(webView)
        
        // Load your page
        if let url = URL(string: "https://your-site.com") {
            webView.load(URLRequest(url: url))
        }
    }
}
```

---

## Testing Locally

### 1. Test on HTTPS

Geolocation requires HTTPS (or localhost). Use one of these methods:

**Option A: Use localhost (works without HTTPS)**
```bash
npm run dev  # Vite/React
# Access at http://localhost:5173
```

**Option B: Use HTTPS locally with mkcert**
```bash
# Install mkcert
brew install mkcert  # macOS
# or
choco install mkcert  # Windows

# Create local CA
mkcert -install

# Create certificate
mkcert localhost 127.0.0.1

# Start dev server with HTTPS
npm run dev -- --https
```

### 2. Test Headers

Check if headers are correctly set:

**Using curl:**
```bash
curl -I https://your-site.com
```

**Using browser DevTools:**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Reload the page
4. Click on the main document request
5. Check **Response Headers** for `Permissions-Policy` and `Feature-Policy`

### 3. Test Geolocation Permissions

Use the browser console:

```javascript
// Check if geolocation is available
console.log('Geolocation available:', 'geolocation' in navigator);

// Check permission state
navigator.permissions.query({ name: 'geolocation' })
  .then(result => console.log('Permission state:', result.state));

// Request geolocation
navigator.geolocation.getCurrentPosition(
  (position) => console.log('Success:', position),
  (error) => console.error('Error:', error)
);
```

### 4. Test with Diagnostics

Use the diagnostic utility from our codebase:

```javascript
import { getGeolocationDiagnostics } from './src/utils/geolocation';

const diagnostics = await getGeolocationDiagnostics();
console.log('Diagnostics:', diagnostics);
```

---

## Troubleshooting

### Error: "Geolocation has been disabled in this document by permissions policy"

**Solutions:**
1. Add `Permissions-Policy: geolocation=(self)` header to your server
2. If in iframe, ensure parent has `allow="geolocation"` attribute
3. Check if domain is using HTTPS (required for geolocation)

### Error: "User denied Geolocation" (but didn't deny)

**Solutions:**
1. Check browser's site settings - permission may be blocked
2. Clear browser cache and cookies
3. Test in incognito/private mode
4. Check if iframe has proper `allow` attribute

### Geolocation works on localhost but not production

**Solutions:**
1. Ensure production is using HTTPS
2. Verify `Permissions-Policy` header is set on production server
3. Check browser console for any CSP (Content Security Policy) errors
4. Verify DNS and SSL certificate are properly configured

### Geolocation works on desktop but not mobile

**Solutions:**
1. Check if mobile device has GPS enabled
2. Verify mobile browser is up to date
3. Test in mobile browser's incognito mode
4. If in WebView, check native app permissions

### Headers are set but still not working

**Solutions:**
1. Clear browser cache completely (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. Check for conflicting headers (e.g., restrictive CSP)
3. Verify header value syntax is correct (no typos)
4. Check if CDN or proxy is stripping/overriding headers
5. Test with `curl -I` to verify headers are actually being sent

---

## Additional Resources

- [MDN: Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)
- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [W3C: Permissions Policy Spec](https://w3c.github.io/webappsec-permissions-policy/)
- [Can I Use: Permissions Policy](https://caniuse.com/permissions-policy)

---

## Quick Reference

### ✅ Checklist for Deployment

- [ ] HTTPS is enabled (required for geolocation)
- [ ] `Permissions-Policy: geolocation=(self)` header is set
- [ ] `Feature-Policy: geolocation 'self'` header is set (for legacy browsers)
- [ ] If using iframes, parent has `allow="geolocation"` attribute
- [ ] Headers are tested with curl or browser DevTools
- [ ] Geolocation tested in multiple browsers (Chrome, Firefox, Safari)
- [ ] Geolocation tested on mobile devices
- [ ] Error handling is in place (using our `requestGeolocation` utility)
- [ ] User receives friendly error messages (not raw technical errors)

### 🔍 Quick Commands

**Test headers:**
```bash
curl -I https://your-site.com | grep -i "policy"
```

**Test geolocation in browser console:**
```javascript
navigator.geolocation.getCurrentPosition(
  pos => console.log('✅ Success:', pos.coords),
  err => console.error('❌ Error:', err.message)
);
```

---

**Last Updated:** January 2026  
**Maintained by:** Akiprisaye Web Development Team
