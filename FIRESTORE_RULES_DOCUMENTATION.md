# Firestore Security Rules Documentation

## Overview

This document describes the Firestore security rules implemented for the A KI PRI SA YÉ application. These rules ensure data security and prevent unauthorized access while maintaining functionality.

## Rule Structure

### Products Collection (`/products/{ean}`)

**Purpose**: Store product information indexed by EAN codes

**Rules**:
- **Read**: Public (anyone can read product data)
- **Write**: Disabled (only cloud functions can write)

**Rationale**: Product data is public information that should be accessible to all users for price comparison. Writing is restricted to prevent tampering.

### Prices Collection (`/prices/{priceId}`)

**Purpose**: Store price information for products across different stores

**Rules**:
- **Read**: Public (anyone can read prices)
- **Write**: Disabled (only cloud functions can write)

**Rationale**: Price data must be publicly accessible for comparison features. Writing is restricted to maintain data integrity.

### Users Collection (`/users/{userId}`)

**Purpose**: Store user profile and preferences

**Rules**:
- **Read**: Authenticated users can only read their own data
- **Write**: Authenticated users can only write their own data

**Rationale**: User data is private and should only be accessible by the user themselves.

### Receipts Collection (`/receipts/{receiptId}`)

**Purpose**: Store uploaded receipt data from OCR processing

**Rules**:
- **Create**: Authenticated users only
- **Read**: Users can only read receipts they created
- **Update**: Disabled (only cloud functions can update)

**Rationale**: Receipts contain sensitive purchase information. Users should only see their own receipts. Updates are handled by admin workflows.

### Contact Messages Collection (`/contact_messages/{messageId}`)

**Purpose**: Store contact form submissions

**Rules**:
- **Create**: Anyone (to allow contact form submissions)
- **Read**: Admin users only
- **Update**: Admin users only
- **Delete**: Disabled (for audit trail)

**Rationale**: Users need to be able to contact support without authentication. Only admins should read and manage messages. Deletion is prevented to maintain audit history.

### Paniers Collection (`/paniers/{panierId}`)

**Purpose**: Ti-Panié Solidaire - Solidarity baskets

**Rules**:
- **Read**: Public
- **Write**: Disabled (prevents fake announcements)

**Rationale**: Solidarity basket offers should be visible to everyone. Writing is restricted to prevent abuse.

### Producteurs Collection (`/producteurs/{producteurId}`)

**Purpose**: Ti-Panié Solidaire - Verified producers

**Rules**:
- **Read**: Public
- **Write**: Disabled (ensures producer identity)

**Rationale**: Producer information should be publicly accessible. Writing is restricted to maintain verified producer identities.

### Stores Collection (`/stores/{storeId}`)

**Purpose**: Store location and information

**Rules**:
- **Read**: Public
- **Write**: Disabled

**Rationale**: Store information is needed for price comparison and mapping features. Writing is restricted to maintain data quality.

## Admin Access

Admin-only operations require the user's authentication token to have `admin: true` in custom claims.

To set admin claims (using Firebase Admin SDK):
```javascript
admin.auth().setCustomUserClaims(uid, { admin: true });
```

## Security Best Practices

1. **Never expose admin credentials** in client-side code
2. **Always validate data** in cloud functions before writing to Firestore
3. **Use rate limiting** to prevent abuse of public endpoints
4. **Monitor security rules** regularly for potential improvements
5. **Audit logs** should be reviewed periodically

## Testing Rules

Use Firebase Emulator Suite to test security rules:

```bash
firebase emulators:start --only firestore
```

## Deployment

Deploy rules to production:

```bash
firebase deploy --only firestore:rules
```

## Change Log

- **2026-01-13**: Added contact_messages and stores rules
- **2026-01-13**: Enhanced receipts rules with update restrictions
- **2025-12**: Initial rules implementation
