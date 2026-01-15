# Android App - A KI PRI SA YÉ

This directory contains the Android native project for **A KI PRI SA YÉ**, built with Capacitor.

## Quick Start

### Prerequisites

- Node.js 20+ and npm
- Java JDK 17 (for Android builds)
- Android Studio (for advanced development)

### Build Android App

1. **Build web app and sync to Android:**
   ```bash
   npm run build
   npx cap sync android
   ```

2. **Generate release keystore (first time only):**
   ```bash
   cd android
   ./generate-release-keystore.sh
   ```
   
   📚 See [ANDROID_KEYSTORE_GUIDE.md](../ANDROID_KEYSTORE_GUIDE.md) for detailed instructions.

3. **Encode keystore for GitHub Actions (first time only):**
   ```bash
   cd android
   ./encode-keystore-base64.sh
   ```
   
   This creates a Base64-encoded version for GitHub Secrets.

4. **Build signed AAB for Google Play:**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   
   Output: `app/build/outputs/bundle/release/app-release.aab`

### Open in Android Studio

```bash
npx cap open android
```

## Project Structure

```
android/
├── app/                                # Main Android app module
│   ├── src/main/
│   │   ├── AndroidManifest.xml        # App manifest
│   │   ├── java/                       # Java/Kotlin source
│   │   ├── res/                        # Android resources
│   │   └── assets/                     # Web app assets (synced from dist/)
│   └── build.gradle                    # App-level Gradle config
├── gradle/                             # Gradle wrapper files
├── build.gradle                        # Project-level Gradle config
├── gradlew                             # Gradle wrapper script (Unix)
├── gradlew.bat                         # Gradle wrapper script (Windows)
├── generate-release-keystore.sh       # Keystore generation script
├── encode-keystore-base64.sh          # Base64 encoding script for CI/CD
└── release.jks                         # Release keystore (not in Git)
```

## Key Files

- **`app/build.gradle`**: Android app configuration (version, dependencies, build types)
- **`app/src/main/AndroidManifest.xml`**: App permissions and configuration
- **`release.jks`**: Release keystore for app signing (generated locally, not committed)
- **`generate-release-keystore.sh`**: Script to generate the release keystore
- **`encode-keystore-base64.sh`**: Script to encode keystore for GitHub Actions

## Important Commands

### Build Commands

```bash
# Build debug APK
./gradlew assembleDebug

# Build release AAB (requires keystore)
./gradlew bundleRelease

# Build release APK (requires keystore)
./gradlew assembleRelease

# Clean build
./gradlew clean
```

### Verification Commands

```bash
# Verify keystore
keytool -list -v -keystore release.jks

# View AAB contents
unzip -l app/build/outputs/bundle/release/app-release.aab
```

## Release Signing

### Google Play App Signing (Current Setup)

This project uses Google Play App Signing:

1. You sign the AAB with your upload key (`release.jks`)
2. Upload to Google Play Console
3. Google re-signs with their production key
4. Google distributes optimized APKs to users

**Benefits:**
- Google manages the production key
- Can rotate upload key if compromised
- Automatic APK optimization for different devices

### Keystore Management

⚠️ **CRITICAL**: Never commit `release.jks` to Git!

- ✅ Keystore is excluded via `.gitignore`
- ✅ Use the provided script: `./generate-release-keystore.sh`
- ✅ Back up your keystore securely (multiple locations)
- ✅ Store passwords in a password manager

📚 See [ANDROID_KEYSTORE_GUIDE.md](../ANDROID_KEYSTORE_GUIDE.md) for complete guide.

## Configuration

### App Version

Update in `app/build.gradle`:

```gradle
defaultConfig {
    versionCode 1          // Increment for each release
    versionName "1.0"      // User-visible version
}
```

### Signing Configuration

The release build type is configured for Google Play App Signing:

```gradle
buildTypes {
    release {
        debuggable false
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

To add local signing (optional):

```gradle
signingConfigs {
    release {
        storeFile file('release.jks')
        storePassword System.getenv("KEYSTORE_PASSWORD") ?: ''
        keyAlias 'release'
        keyPassword System.getenv("KEY_PASSWORD") ?: ''
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        // ... other config
    }
}
```

## Troubleshooting

### "Task failed with exit code 1"

Check:
1. Java JDK 17 is installed
2. `JAVA_HOME` environment variable is set
3. Run `./gradlew clean` and try again

### "Keystore was tampered with, or password was incorrect"

Check:
1. Keystore password is correct
2. Using the right keystore file
3. Keystore file hasn't been corrupted

### "Cannot resolve symbol 'R'"

1. Sync project: File → Sync Project with Gradle Files
2. Rebuild: Build → Rebuild Project
3. Invalidate caches: File → Invalidate Caches / Restart

### Build fails after web app changes

```bash
# Rebuild web app and sync
cd ..
npm run build
npx cap sync android
```

## Documentation

- 📱 [ANDROID_SETUP.md](../ANDROID_SETUP.md) - Complete Android setup guide
- 🔐 [ANDROID_KEYSTORE_GUIDE.md](../ANDROID_KEYSTORE_GUIDE.md) - Keystore generation and management
- 📦 [Capacitor Documentation](https://capacitorjs.com/docs)
- 🏗️ [Android Developer Guide](https://developer.android.com/guide)

## CI/CD

The project includes GitHub Actions workflows for Android builds:

- `.github/workflows/android-play-aab.yml` - Build AAB for Google Play
- `.github/workflows/android-play.yml` - Alternative AAB build workflow

These workflows:
1. Build the web app (`npm run build`)
2. Sync to Android (`npx cap sync android`)
3. Build release AAB (`./gradlew bundleRelease`)
4. Upload AAB as artifact

**Note**: CI builds currently use Google Play App Signing without local keystore signing.

## Support

For issues or questions:
1. Check the documentation links above
2. Review [ANDROID_SETUP.md](../ANDROID_SETUP.md)
3. Check Android logs: `adb logcat`
4. Open an issue on GitHub

---

**A KI PRI SA YÉ** - Price Observatory for the French Overseas Territories
