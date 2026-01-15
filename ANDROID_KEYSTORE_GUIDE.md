# Android Release Keystore Guide

## Overview

This guide explains how to generate and manage the Android release keystore for **A KI PRI SA YÉ** app. The keystore is required for signing your Android app before uploading to Google Play Store.

## ⚠️ Critical Information

### Keystore Security Rules

1. **NEVER** commit keystore files to version control (Git)
2. **ALWAYS** keep multiple secure backups of your keystore
3. **NEVER** share your keystore password
4. **NEVER** lose your keystore - you cannot update your app without it!

### What is a Keystore?

A keystore is a binary file that contains your app's private key. Google Play uses this to verify that app updates come from you (the original developer). If you lose your keystore:
- You cannot update your existing app
- You must publish as a completely new app
- Users cannot upgrade; they must uninstall and reinstall

## Generating the Release Keystore

### Prerequisites

- Java JDK installed (required for `keytool` command)
- Terminal/Command line access

### Step 1: Navigate to Android Directory

```bash
cd android
```

### Step 2: Run the Generation Script

We provide a convenient script that runs the exact command from the specification:

```bash
./generate-release-keystore.sh
```

This script will:
1. Check if a keystore already exists (prevents accidental overwrite)
2. Run the keytool command with the correct parameters
3. Prompt you for required information

### Step 3: Provide Information

The keytool will prompt you for:

1. **Keystore password**: Choose a strong password (min 6 characters)
   - Example: Use a password manager to generate a strong password
   - Store this password securely!

2. **Key password**: Can be the same as keystore password (press Enter)

3. **Certificate information**:
   - **First and last name**: Your name or organization name
   - **Organizational unit**: Your team/department (e.g., "Development")
   - **Organization**: Your organization name (e.g., "A KI PRI SA YÉ")
   - **City**: Your city
   - **State/Province**: Your state or province
   - **Country code**: Two-letter country code (e.g., "FR" for France, "GP" for Guadeloupe)

Example:
```
What is your first and last name?
  [Unknown]:  A KI PRI SA YÉ Team
What is the name of your organizational unit?
  [Unknown]:  Development
What is the name of your organization?
  [Unknown]:  A KI PRI SA YÉ
What is the name of your City or Locality?
  [Unknown]:  Fort-de-France
What is the name of your State or Province?
  [Unknown]:  Martinique
What is the two-letter country code for this unit?
  [Unknown]:  MQ
Is CN=A KI PRI SA YÉ Team, OU=Development, O=A KI PRI SA YÉ, L=Fort-de-France, ST=Martinique, C=MQ correct?
  [no]:  yes
```

### Manual Generation (Alternative)

If you prefer to run the command manually:

```bash
keytool -genkeypair \
  -keystore release.jks \
  -alias release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Parameters Explained:**
- `-keystore release.jks`: Output file name
- `-alias release`: Key alias (identifier)
- `-keyalg RSA`: Use RSA algorithm
- `-keysize 2048`: 2048-bit key (secure standard)
- `-validity 10000`: Valid for 10,000 days (~27 years)

## Keystore Information

After generation, your keystore will have:

- **File**: `release.jks`
- **Location**: `android/release.jks`
- **Alias**: `release`
- **Algorithm**: RSA
- **Key Size**: 2048 bits
- **Validity**: 10,000 days (~27 years from creation date)

## Securing Your Keystore

### Storage Best Practices

1. **Primary Storage**:
   - Store in a secure location outside the repository
   - Consider a dedicated "credentials" folder with restricted access

2. **Backup Strategy** (Choose multiple):
   - Encrypted cloud storage (e.g., password-protected cloud drive)
   - Encrypted USB drive in secure physical location
   - Password manager's secure document storage
   - Company secure credentials vault

3. **Password Management**:
   - Store passwords in a secure password manager (LastPass, 1Password, Bitwarden, etc.)
   - Never store passwords in plain text files
   - Document which password manager contains the credentials

### Documentation to Keep

Create a secure document with:
```
App: A KI PRI SA YÉ Android App
Keystore File: release.jks
Keystore Password: [stored in password manager]
Key Alias: release
Key Password: [stored in password manager]
Creation Date: [YYYY-MM-DD]
Expiry Date: [YYYY-MM-DD] (~27 years from creation)
Certificate DN: [Your certificate distinguished name]
Backup Locations: [List your backup locations]
```

## Configuring Android Build

### Option 1: Local Signing (Development/Testing)

If you want to sign locally during development, update `android/app/build.gradle`:

```gradle
android {
    ...
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
            debuggable false
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

Set environment variables before building:
```bash
export KEYSTORE_PASSWORD="your_keystore_password"
export KEY_PASSWORD="your_key_password"
./gradlew bundleRelease
```

### Option 2: Google Play App Signing (Recommended)

**A KI PRI SA YÉ currently uses Google Play App Signing**, which means:

1. You sign the initial upload with your upload key (this keystore)
2. Google Play re-signs with their own production key
3. This provides additional security and allows Google to optimize APKs

**For Google Play App Signing:**
- You still need this keystore for the initial upload
- Google manages the production signing key
- You can reset your upload key if compromised (production key is safe)

The current build configuration is compatible with Google Play App Signing.

## Verifying Your Keystore

To view keystore information:

```bash
keytool -list -v -keystore release.jks -alias release
```

To view certificate:

```bash
keytool -list -v -keystore release.jks
```

## Troubleshooting

### "keytool: command not found"

**Solution**: Install Java JDK
```bash
# Ubuntu/Debian
sudo apt-get install default-jdk

# macOS (with Homebrew)
brew install openjdk

# Windows
# Download and install JDK from Oracle or Adoptium
```

### "Keystore was tampered with, or password was incorrect"

**Solution**: 
- Verify you're using the correct password
- Ensure keystore file hasn't been corrupted
- Restore from backup if necessary

### "Cannot recover key"

**Solution**:
- Ensure key password matches keystore password (if you set them the same)
- Check for typos in password

### Lost Keystore or Password

**This is a critical situation:**
1. Check all backup locations immediately
2. Check password manager
3. If truly lost:
   - For existing published app: Contact Google Play support
   - They may allow account verification to reset upload key
   - Production key managed by Google is NOT lost
4. Prevention: Follow backup best practices above

## Building Signed APK/AAB

### Using Gradle Command Line

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Using Android Studio

1. Open project in Android Studio
2. Menu: **Build** → **Generate Signed Bundle / APK**
3. Select **Android App Bundle** (recommended) or **APK**
4. Click **Next**
5. Choose existing keystore: `release.jks`
6. Enter passwords
7. Select **release** build variant
8. Click **Finish**

## CI/CD Configuration

### ⚠️ Critical: Keystore Encoding for GitHub Actions

To sign your Android App Bundle (AAB) in GitHub Actions, you must encode your keystore as Base64 and store it as a GitHub secret.

#### Step 1: Encode Your Keystore to Base64

After generating your `release.jks` keystore, encode it to Base64.

**Option A: Using the Helper Script (Recommended)**

```bash
# Navigate to the android directory where release.jks is located
cd android

# Run the Base64 encoding script
./encode-keystore-base64.sh
```

The script will:
- Verify the keystore exists
- Encode it to Base64
- Display the content for copying
- Guide you through adding it to GitHub Secrets
- Optionally delete the temporary file

**Option B: Manual Encoding**

```bash
# Navigate to the android directory where release.jks is located
cd android

# Encode the keystore to Base64
base64 release.jks > release.jks.base64

# Or on macOS (if the above doesn't work):
base64 -i release.jks -o release.jks.base64
```

**Important:**
- The output file `release.jks.base64` will contain a long string of characters
- This is a temporary file - you'll copy its content to GitHub and then delete it
- **NEVER commit** either `release.jks` or `release.jks.base64` to Git

#### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Content of `release.jks.base64` | Base64-encoded keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Your keystore password | Password you used when creating the keystore |
| `ANDROID_KEY_ALIAS` | `release` | Key alias (default: `release`) |
| `ANDROID_KEY_PASSWORD` | Your key password | Key password (often same as keystore password) |

**To copy the Base64 content:**

```bash
# Display the content (select and copy)
cat release.jks.base64

# Or copy to clipboard (macOS)
cat release.jks.base64 | pbcopy

# Or copy to clipboard (Linux with xclip)
cat release.jks.base64 | xclip -selection clipboard
```

**After adding secrets to GitHub:**

```bash
# Delete the temporary Base64 file
rm release.jks.base64

# Verify your keystore is still safe
ls -l release.jks
```

#### Step 3: Update GitHub Actions Workflow

Your workflow must decode the keystore before building. See the example in `.github/workflows/android-play-aab.yml`.

The workflow should:

1. **Decode the keystore** from the Base64 secret
2. **Verify** the file was created successfully
3. **Configure** signing in build.gradle with environment variables
4. **Build** the signed AAB
5. **Clean up** the keystore after the build

Example workflow steps:

```yaml
- name: Decode keystore from Base64
  run: |
    echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/release.jks
    if [ ! -f android/release.jks ]; then
      echo "❌ Failed to decode keystore"
      exit 1
    fi
    echo "✅ Keystore decoded successfully"

- name: Build signed Android App Bundle
  working-directory: android
  env:
    KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
    KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
    KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
  run: ./gradlew bundleRelease

- name: Verify AAB was signed
  run: |
    if [ ! -f android/app/build/outputs/bundle/release/app-release.aab ]; then
      echo "❌ AAB not found"
      exit 1
    fi
    echo "✅ Signed AAB created successfully"
```

#### Troubleshooting CI/CD

**Error: "Tous les app bundles importés doivent être signés"**

This means your AAB is not signed. Check:

1. ✅ All four secrets exist in GitHub Actions (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`)
2. ✅ The keystore is decoded successfully (check workflow logs for "✅ Keystore decoded successfully")
3. ✅ The `build.gradle` has signing configuration (see "Configuring Android Build" below)
4. ✅ Environment variables are passed to Gradle (check `env:` section in workflow)

**Error: "base64: invalid input"**

- Ensure you copied the entire Base64 string without line breaks or truncation
- Try encoding again: `base64 release.jks | tr -d '\n' > release.jks.base64`

**Error: "keystore was tampered with, or password was incorrect"**

- Verify `ANDROID_KEYSTORE_PASSWORD` matches the password used when creating the keystore
- Verify `ANDROID_KEY_PASSWORD` is correct (often same as keystore password)

## Keystore Rotation

If you need to change your keystore (security incident, expiry):

### With Google Play App Signing (Current Setup)

1. Generate new keystore using this guide
2. Sign new AAB with new keystore
3. Upload to Google Play Console
4. Google Play Console → Release → Setup → App integrity
5. Request new upload key

Google will verify your account and accept the new upload key. Your production key remains unchanged, so users can still update the app.

### Without Google Play App Signing

You cannot change the keystore. Apps signed with different keys are considered different apps.

## Google Play Console Compliance Checklist

Before submitting your AAB to Google Play Console, verify all requirements are met:

### ✅ Pre-Submission Checklist

#### Signing Requirements
- [ ] **AAB is signed** with a valid keystore (not debug keystore)
- [ ] **Keystore is NOT in version control** (verify with `git status`)
- [ ] **Key alias matches** build.gradle configuration (`release`)
- [ ] **Signing config** is properly configured in `android/app/build.gradle`
- [ ] **Environment variables** are correctly set (if using CI/CD)

#### Build Verification
- [ ] **AAB file exists**: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] **AAB is not empty** (check file size > 5 MB)
- [ ] **Gradle build succeeded** without errors
- [ ] **No debug symbols** in release build (`debuggable false` in build.gradle)

#### Google Play App Signing Compatibility
- [ ] **App Signing enabled** in Google Play Console (recommended)
- [ ] **Upload key** matches your `release.jks` keystore
- [ ] **First upload** includes properly signed AAB
- [ ] **Certificate fingerprint** matches (if updating existing app)

### 🚨 Common Google Play Console Errors

#### Error: "Tous les app bundles importés doivent être signés"

**English:** "All imported app bundles must be signed"

**Cause:** Your AAB is unsigned or improperly signed

**Solution:**
1. Verify signing configuration in `android/app/build.gradle`:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('../release.jks')
               storePassword System.getenv("KEYSTORE_PASSWORD")
               keyAlias System.getenv("KEY_ALIAS") ?: 'release'
               keyPassword System.getenv("KEY_PASSWORD")
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               // ...
           }
       }
   }
   ```

2. Verify keystore exists: `ls -l android/release.jks`

3. Verify environment variables are set:
   ```bash
   export KEYSTORE_PASSWORD="your_password"
   export KEY_PASSWORD="your_password"
   export KEY_ALIAS="release"
   ```

4. Rebuild: `cd android && ./gradlew clean bundleRelease`

#### Error: "Upload key doesn't match"

**Cause:** You're trying to update an existing app with a different keystore

**Solution:**
- Use the same keystore as the original upload
- OR enroll in Google Play App Signing and upload a new upload key

#### Error: "Invalid keystore format"

**Cause:** Corrupted keystore or incorrect password

**Solution:**
- Verify keystore: `keytool -list -v -keystore release.jks`
- Re-generate keystore if corrupted
- Restore from backup

### ✅ CI/CD Specific Checks

If using GitHub Actions or similar:

- [ ] **Secret `ANDROID_KEYSTORE_BASE64` exists** and contains valid Base64
- [ ] **Secret `ANDROID_KEYSTORE_PASSWORD` exists** and is correct
- [ ] **Secret `ANDROID_KEY_ALIAS` exists** (should be `release`)
- [ ] **Secret `ANDROID_KEY_PASSWORD` exists** and is correct
- [ ] **Workflow decodes keystore** before building
- [ ] **Workflow passes environment variables** to Gradle
- [ ] **Workflow verifies AAB** was created successfully
- [ ] **Keystore is cleaned up** after build (security)

### 🔍 Verification Commands

Before uploading to Play Console:

```bash
# Verify AAB exists
ls -lh android/app/build/outputs/bundle/release/app-release.aab

# Verify AAB is signed (should show certificate info)
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab

# Check AAB details with bundletool (optional)
# Download bundletool: https://github.com/google/bundletool/releases
java -jar bundletool.jar validate --bundle=android/app/build/outputs/bundle/release/app-release.aab
```

### ✅ First Upload Checklist

For first-time submission to Google Play:

- [ ] **App signed** with upload keystore (`release.jks`)
- [ ] **Version code** is 1 or appropriate initial version
- [ ] **Version name** matches your release (e.g., "1.0")
- [ ] **Package name** matches Google Play Console app (`com.akiprisaye.app`)
- [ ] **Google Play App Signing** enrolled (recommended)
- [ ] **Store listing** completed in Play Console
- [ ] **Content rating** completed
- [ ] **Privacy policy** URL added (if collecting data)

### 📋 Post-Upload Verification

After uploading to Play Console:

- [ ] **Upload successful** (no red errors)
- [ ] **App bundle explorer** shows correct APK splits
- [ ] **Track created** (Internal testing/Closed testing/Production)
- [ ] **Signing certificate** matches your expectations
- [ ] **Test installation** works on real device

## Summary Checklist

After generating keystore:

- [ ] Keystore file created (`release.jks`)
- [ ] Keystore verified with `keytool -list`
- [ ] Password stored in secure password manager
- [ ] At least 2 secure backups created
- [ ] Backup locations documented
- [ ] `.gitignore` configured (already done in this project)
- [ ] Team members informed about keystore location (if applicable)
- [ ] Build tested with new keystore
- [ ] CI/CD secrets configured (if applicable)

## Support

For keystore-related issues:
- Android Keystore Documentation: https://developer.android.com/studio/publish/app-signing
- Google Play App Signing: https://support.google.com/googleplay/android-developer/answer/9842756

For project-specific questions, see `ANDROID_SETUP.md`.

## Security Reminders

🔒 **The keystore is the key to your app's identity. Treat it like a password.**

- ✅ Back up securely
- ✅ Store passwords in password manager
- ✅ Restrict access to authorized team members only
- ❌ Never commit to version control
- ❌ Never share via email or messaging
- ❌ Never store in unencrypted cloud storage
