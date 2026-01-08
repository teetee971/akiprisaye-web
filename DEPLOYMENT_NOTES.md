# Deployment Notes: Geolocation Permissions Configuration

## Overview

This document provides deployment instructions for ensuring the geolocation feature works correctly across different hosting environments and integration contexts. The geolocation API can be blocked by various security policies, and this guide helps you configure them properly.

## Problem: "Geolocation has been disabled in this document by permissions policy"

If you see this error, it means the Permissions-Policy HTTP header or iframe attributes are blocking geolocation access. Follow the solutions below based on your deployment scenario.

---

## Solution 1: Configure Permissions-Policy HTTP Header

The Permissions-Policy header controls which browser features are allowed on your site.

### For Production Deployments

Add the following HTTP header to allow geolocation on your domain:

```
Permissions-Policy: geolocation=(self)
```

Or if you need to allow geolocation for specific third-party domains:

```
Permissions-Policy: geolocation=(self "https://trusted-domain.com")
```

### Platform-Specific Instructions

#### Cloudflare Pages / Workers

**Using `_headers` file** (recommended):
Create a file named `_headers` in your `public` directory:

```
/*
  Permissions-Policy: geolocation=(self)
  X-Frame-Options: SAMEORIGIN
```

**Using Cloudflare Transform Rules:**
1. Go to Cloudflare Dashboard → Rules → Transform Rules
2. Create a new HTTP Response Header Modification rule
3. Add header: `Permissions-Policy` with value `geolocation=(self)`

#### Vercel

Create or update `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(self)"
        }
      ]
    }
  ]
}
```

#### Netlify

Create or update `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Permissions-Policy = "geolocation=(self)"
```

Or create a `_headers` file in your publish directory:

```
/*
  Permissions-Policy: geolocation=(self)
```

#### Firebase Hosting

Update `firebase.json`:

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
          }
        ]
      }
    ]
  }
}
```

#### Apache (.htaccess)

```apache
<IfModule mod_headers.c>
  Header set Permissions-Policy "geolocation=(self)"
</IfModule>
```

#### Nginx

```nginx
add_header Permissions-Policy "geolocation=(self)" always;
```

#### AWS S3 + CloudFront

1. Create a CloudFront Function or Lambda@Edge
2. Add the header in the response:

```javascript
function handler(event) {
  var response = event.response;
  response.headers['permissions-policy'] = {
    value: 'geolocation=(self)'
  };
  return response;
}
```

---

## Solution 2: Configure iframe Embedding (if applicable)

If your application is embedded in an iframe, the parent page must explicitly allow geolocation.

### In the Parent Page HTML

```html
<iframe
  src="https://your-app.com"
  allow="geolocation"
  width="100%"
  height="600"
></iframe>
```

### For Multiple Features

```html
<iframe
  src="https://your-app.com"
  allow="geolocation; camera; microphone"
  width="100%"
  height="600"
></iframe>
```

### Important Notes for iframes

- The iframe's `src` must be served over HTTPS (geolocation requires secure context)
- The parent page must also have the Permissions-Policy header allowing geolocation
- Some browsers may require user gesture (click) to request permission in iframes

---

## Solution 3: Mobile WebView Configuration

If you're embedding this web app in a native mobile application WebView, you need to configure the WebView to allow geolocation.

### Android WebView

In your Android activity:

```java
WebView webView = findViewById(R.id.webview);
WebSettings webSettings = webView.getSettings();
webSettings.setJavaScriptEnabled(true);
webSettings.setGeolocationEnabled(true);

// Set up geolocation permissions
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onGeolocationPermissionsShowPrompt(
        String origin,
        GeolocationPermissions.Callback callback
    ) {
        // Always allow geolocation from your app's origin
        callback.invoke(origin, true, false);
    }
});
```

Don't forget to add permissions in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

### iOS WKWebView

In your iOS view controller (Swift):

```swift
import WebKit
import CoreLocation

class ViewController: UIViewController, WKUIDelegate, CLLocationManagerDelegate {
    let locationManager = CLLocationManager()
    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configure location manager
        locationManager.delegate = self
        locationManager.requestWhenInUseAuthorization()
        
        // Configure WebView
        let configuration = WKWebViewConfiguration()
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.uiDelegate = self
        
        // Load your app
        if let url = URL(string: "https://your-app.com") {
            webView.load(URLRequest(url: url))
        }
    }
}
```

Add to `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show nearby stores</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>We need your location to show nearby stores</string>
```

---

## Testing Your Configuration

### 1. Test Permissions-Policy Header

Open browser developer tools and check the response headers:

```javascript
fetch(window.location.href)
  .then(response => response.headers.get('permissions-policy'))
  .then(policy => console.log('Permissions-Policy:', policy));
```

### 2. Test Geolocation API

Open browser console and run:

```javascript
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('✓ Geolocation working:', pos.coords),
  (err) => console.error('✗ Geolocation error:', err.message)
);
```

### 3. Test Permissions API

```javascript
navigator.permissions.query({ name: 'geolocation' })
  .then(result => console.log('Permission state:', result.state));
```

Expected states:
- `granted`: User has allowed
- `denied`: User has blocked
- `prompt`: User hasn't decided yet

---

## Troubleshooting

### Issue: Still getting permission errors after adding headers

**Solutions:**
1. Clear browser cache and hard reload (Ctrl+Shift+R or Cmd+Shift+R)
2. Verify headers are actually being sent (check Network tab in DevTools)
3. Check if there are multiple Permissions-Policy headers conflicting
4. Ensure your site is served over HTTPS (required for geolocation)

### Issue: Works on desktop but not mobile

**Solutions:**
1. Check mobile browser's site settings (long press on address bar → Site settings)
2. Some browsers require user gesture (tap) before requesting permission
3. Ensure mobile browser is up to date
4. Check mobile OS location permissions (Settings → Apps → Browser → Permissions)

### Issue: Works in some browsers but not others

**Solutions:**
1. Check browser compatibility (geolocation is widely supported but Permissions API varies)
2. Different browsers may interpret Permissions-Policy differently
3. Safari on iOS requires HTTPS and may have stricter requirements
4. Test with browser's private/incognito mode to rule out cached permissions

### Issue: Works locally but not in production

**Solutions:**
1. Verify production server is serving the Permissions-Policy header
2. Check CDN/proxy configuration (CloudFlare, AWS CloudFront, etc.)
3. Ensure HTTPS is properly configured with valid certificate
4. Check if production domain is different (some permissions are origin-bound)

---

## Security Best Practices

1. **Use `(self)` for Permissions-Policy**: Only allow geolocation on your own domain
2. **Serve over HTTPS**: Geolocation requires a secure context
3. **Request permission on user action**: Always request geolocation in response to user interaction
4. **Provide clear explanations**: Tell users why you need their location
5. **Handle denials gracefully**: Provide manual location input as fallback
6. **Cache location data**: Avoid repeated permission prompts
7. **Respect user privacy**: Don't track or store precise location without consent

---

## Additional Resources

- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [MDN: Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)
- [W3C: Permissions Policy Specification](https://w3c.github.io/webappsec-permissions-policy/)
- [Can I Use: Geolocation](https://caniuse.com/geolocation)
- [Chrome: Feature Policy / Permissions Policy](https://developer.chrome.com/docs/privacy-sandbox/permissions-policy/)

---

## Support

If you continue to experience issues after following this guide:

1. Check browser console for specific error messages
2. Verify your deployment platform's documentation for custom headers
3. Test with the LocationButton component which provides detailed error messages
4. Review the geolocation utility error logs in browser DevTools

For platform-specific issues, consult your hosting provider's documentation on setting HTTP headers.

---

## Usage Examples

### Using the LocationButton Component

The `LocationButton` component provides a pre-built UI for requesting user location with error handling:

```tsx
import LocationButton from '@/components/LocationButton';
import type { GeoPosition } from '@/utils/geoLocation';

function MyComponent() {
  const handleLocationObtained = (position: GeoPosition) => {
    console.log('User location:', position.lat, position.lon);
    // Use position for distance calculations, map centering, etc.
  };

  const handleError = (error) => {
    console.error('Geolocation error:', error.type, error.message);
    // Handle error (show manual input, fallback to default location, etc.)
  };

  return (
    <LocationButton
      onLocationObtained={handleLocationObtained}
      onError={handleError}
      variant="primary"
      size="md"
      showDetailedErrors={true}
    />
  );
}
```

### Using the requestGeolocation Utility Directly

For more control, use the `requestGeolocation` function directly:

```typescript
import { requestGeolocation, GeolocationErrorType } from '@/utils/geoLocation';

async function getLocation() {
  const result = await requestGeolocation();

  if (result.success && result.position) {
    console.log('Position:', result.position);
    // Use position.lat and position.lon
  } else if (result.error) {
    console.error('Error:', result.error.type);
    
    // Handle specific error types
    if (result.error.type === GeolocationErrorType.PERMISSIONS_POLICY) {
      // Show deployment documentation link
      alert('Configuration serveur requise. Voir DEPLOYMENT_NOTES.md');
    } else if (result.error.type === GeolocationErrorType.PERMISSION_DENIED) {
      // Provide manual location input
      showManualLocationInput();
    }
  }
}
```

### Replacing Old getUserPosition Calls

If you have existing code using `getUserPosition`, you can upgrade it to use `requestGeolocation` for better error handling:

**Before:**
```typescript
const position = await getUserPosition();
if (position) {
  // use position
} else {
  // generic error handling
}
```

**After:**
```typescript
const result = await requestGeolocation((msg, type) => {
  // Optional: show message to user
  if (type === 'error') {
    showErrorToast(msg);
  }
});

if (result.success && result.position) {
  // use result.position
} else if (result.error) {
  // specific error handling with result.error.type
  // and result.error.remediation
}
```
