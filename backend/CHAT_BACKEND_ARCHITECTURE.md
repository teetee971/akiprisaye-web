# Chat Backend Architecture - A KI PRI SA YÉ

**Version:** 1.0.0  
**Date:** 2024-12-19  
**Status:** Backend Implementation Complete (Frontend Pending)  
**Compliance:** RGPD Art. 5, 6, 17, 30, 32

---

## Executive Summary

This document describes the **backend-only** implementation of a secure, moderated citizen chat system for A KI PRI SA YÉ platform. The chat enables verified users to participate in private discussion groups organized by territory or theme to discuss cost of living issues.

**Scope:**
- ✅ Backend data models (Prisma)
- ✅ REST API architecture specification
- ✅ WebSocket server infrastructure (server-side)
- ✅ AI moderation backend logic
- ✅ Avatar storage preparation (S3-compatible)
- ❌ Frontend UI (planned separately)
- ❌ WebSocket client (planned separately)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Planned)                      │
│  - React UI Components                                   │
│  - Socket.io Client                                      │
│  - Avatar Upload UI                                      │
│  - Moderation Dashboard                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API + WebSocket
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Implemented)                       │
│  ┌────────────────┬───────────────┬──────────────────┐  │
│  │  REST API      │  WebSocket    │  AI Moderation   │  │
│  │  Express.js    │  Socket.io    │  Passive Filter  │  │
│  │  JWT Auth      │  Real-time    │  Non-blocking    │  │
│  └────────────────┴───────────────┴──────────────────┘  │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Data Layer (Prisma)                    │ │
│  │  - ChatUserProfile (verified users)                │ │
│  │  - ChatGroup (discussion groups)                   │ │
│  │  - ChatMessage (messages with moderation)          │ │
│  │  - ChatModerationAction (audit trail)              │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  + S3-compatible Storage (avatars, attachments)          │
└─────────────────────────────────────────────────────────┘
```

---

## Data Models

### 1. ChatUserProfile

**Purpose:** Extended user profile for chat participation  
**Parent:** User (JWT authentication)  
**Verification:** Only verified users can create profile

```prisma
model ChatUserProfile {
  id                      String            @id @default(uuid())
  userId                  String            @unique
  user                    User              @relation(...)
  
  // Public identity
  displayName             String            // Pseudonym (max 100 chars)
  avatarUrl               String?           // S3 storage URL
  
  // Territory context
  territoryCode           String            // INSEE code (971, 972, 973...)
  location                String?           // City/region (optional)
  
  // Status & moderation
  status                  ChatUserStatus    // VERIFIED | MUTED | SUSPENDED
  mutedUntil              DateTime?         // Temporary mute end date
  
  // Profile
  bio                     String?           // Max 500 chars
  notificationPreferences String?           // JSON config
  
  // Timestamps
  createdAt               DateTime          @default(now())
  updatedAt               DateTime          @updatedAt
  
  // Relations
  messages                ChatMessage[]
  memberships             ChatGroupMembership[]
  moderationActions       ChatModerationAction[]
}
```

**RGPD Compliance:**
- Art. 5: Data minimization (pseudonym, no real name required)
- Art. 6: Lawful basis (explicit consent for photo/bio)
- Art. 17: Right to erasure (CASCADE delete)

### 2. ChatGroup

**Purpose:** Discussion group organized by territory or theme  
**Types:** TERRITORIAL (DOM/COM), THEMATIC (food, fuel), SITUATION (families, students)

```prisma
model ChatGroup {
  id              String         @id @default(uuid())
  name            String         // Ex: "Vie chère Guadeloupe"
  description     String
  
  // Group type & context
  groupType       ChatGroupType  // TERRITORIAL | THEMATIC | SITUATION
  territoryCode   String?        // INSEE code (if TERRITORIAL)
  theme           ChatTheme?     // FOOD | FUEL | HOUSING (if THEMATIC)
  
  // Metadata
  icon            String?        // Emoji or URL
  metadata        String?        // JSON: {flagCode, color, rules}
  rules           String         // Group rules text
  
  // Settings
  isActive        Boolean        @default(true)
  maxMembers      Int?           // NULL = unlimited
  
  // Timestamps
  createdAt       DateTime       @default(now())
  lastActivityAt  DateTime?      // Last message timestamp
  
  // Relations
  messages        ChatMessage[]
  memberships     ChatGroupMembership[]
}
```

**Example Groups:**
- Territorial: "Vie chère Guadeloupe" (territoryCode: "971")
- Thematic: "Carburant DOM-TOM" (theme: FUEL)
- Situation: "Familles monoparentales" (groupType: SITUATION)

### 3. ChatGroupMembership

**Purpose:** User ↔ Group association with role and read tracking

```prisma
model ChatGroupMembership {
  id                    String          @id @default(uuid())
  userProfileId         String
  userProfile           ChatUserProfile @relation(...)
  groupId               String
  group                 ChatGroup       @relation(...)
  
  // Role in group
  role                  ChatGroupRole   // MEMBER | MODERATOR | ADMIN
  
  // Participation tracking
  joinedAt              DateTime        @default(now())
  lastReadAt            DateTime?       // For unread count
  notificationsEnabled  Boolean         @default(true)
  
  @@unique([userProfileId, groupId])
}
```

**Features:**
- Prevents duplicate memberships
- Tracks last read for notification badge
- Group-level notification preferences

### 4. ChatMessage

**Purpose:** Individual message with AI moderation metadata  
**Moderation:** Passive AI analysis + human review on reports

```prisma
model ChatMessage {
  id                   String                 @id @default(uuid())
  authorId             String
  author               ChatUserProfile        @relation(...)
  groupId              String
  group                ChatGroup              @relation(...)
  
  // Content
  content              String                 // Max ~2000 chars
  messageType          ChatMessageType        // TEXT | IMAGE | DOCUMENT
  attachmentUrl        String?                // S3 storage (optional)
  attachmentMetadata   String?                // JSON metadata
  
  // Threading
  replyToId            String?
  replyTo              ChatMessage?           @relation("MessageReplies", ...)
  replies              ChatMessage[]          @relation("MessageReplies")
  
  // AI Moderation (passive)
  moderationStatus     ChatModerationStatus   // PENDING | APPROVED | FLAGGED
  toxicityScore        Float?                 // 0.0 - 1.0 (AI-generated)
  moderationFlags      String?                // JSON: ["profanity", "spam"]
  
  // Editing & deletion
  isEdited             Boolean                @default(false)
  editedAt             DateTime?
  isDeleted            Boolean                @default(false) // Soft delete
  deletedAt            DateTime?
  
  createdAt            DateTime               @default(now())
  
  // Relations
  moderationActions    ChatModerationAction[]
}
```

**AI Moderation Flow:**
1. User posts message → `moderationStatus = PENDING`
2. AI analyzes (async, non-blocking) → Sets `toxicityScore`
3. If score > threshold → `moderationStatus = FLAGGED`, `moderationFlags` set
4. Human moderator reviews flagged messages → Takes action if needed
5. If score < threshold → `moderationStatus = APPROVED`

**No automatic censorship** - AI only flags for human review.

### 5. ChatModerationAction

**Purpose:** Audit trail of all moderation actions (AI + human)  
**Compliance:** RGPD Art. 30 (processing activities register)

```prisma
model ChatModerationAction {
  id                String                @id @default(uuid())
  messageId         String
  message           ChatMessage           @relation(...)
  targetUserId      String
  targetUser        ChatUserProfile       @relation(...)
  
  // Action details
  actionType        ChatModerationType    // WARNING | MUTE | KICK | BAN
  source            ChatModerationSource  // AI | USER_REPORT | MODERATOR
  moderatorId       String?               // If human moderator
  
  // Justification
  reason            String                // Detailed reason
  durationMinutes   Int?                  // For MUTE actions
  
  // Revocation (appeals)
  isRevoked         Boolean               @default(false)
  revokedAt         DateTime?
  revocationReason  String?
  
  createdAt         DateTime              @default(now())
}
```

**Transparency:**
- Every action logged with reason
- Users can contest actions (revocation workflow)
- Admins can audit all moderation decisions

### 6. ChatModerationModel

**Purpose:** Metadata for AI moderation models (version tracking)  
**Use:** Reproducibility and model performance tracking

```prisma
model ChatModerationModel {
  id                  String                      @id @default(uuid())
  name                String                      // "toxicity-detector-v1"
  version             String                      // Semantic versioning
  modelType           ChatModerationModelType     // TOXICITY | HATE_SPEECH
  provider            String                      // "OpenAI" | "Hugging Face"
  
  // Configuration
  config              String?                     // JSON config
  performanceMetrics  String?                     // JSON: {accuracy, f1}
  
  isActive            Boolean                     @default(false)
  deployedAt          DateTime?
  createdAt           DateTime                    @default(now())
}
```

---

## API Endpoints (Planned)

### Authentication
All endpoints require JWT authentication.

### User Profile Endpoints

#### `POST /api/chat/profile`
Create or update chat profile.

**Request:**
```json
{
  "displayName": "Jean_971",
  "territoryCode": "971",
  "location": "Pointe-à-Pitre",
  "bio": "Citoyen guadeloupéen soucieux du pouvoir d'achat"
}
```

**Response:**
```json
{
  "id": "uuid",
  "displayName": "Jean_971",
  "territoryCode": "971",
  "status": "VERIFIED",
  "createdAt": "2024-12-19T10:00:00Z"
}
```

#### `GET /api/chat/profile/me`
Get current user's chat profile.

#### `PATCH /api/chat/profile/avatar`
Upload avatar image (multipart/form-data).

**Implementation:** S3-compatible storage (AWS S3, Cloudflare R2, MinIO)

---

### Group Endpoints

#### `GET /api/chat/groups`
List available groups (with filters).

**Query params:**
- `type` - TERRITORIAL | THEMATIC | SITUATION
- `territoryCode` - Filter by territory
- `theme` - Filter by theme
- `page`, `limit` - Pagination

**Response:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "Vie chère Guadeloupe",
      "groupType": "TERRITORIAL",
      "territoryCode": "971",
      "memberCount": 45,
      "lastActivityAt": "2024-12-19T09:30:00Z"
    }
  ],
  "pagination": {...}
}
```

#### `POST /api/chat/groups/:groupId/join`
Join a discussion group.

**Response:**
```json
{
  "membershipId": "uuid",
  "role": "MEMBER",
  "joinedAt": "2024-12-19T10:00:00Z"
}
```

#### `POST /api/chat/groups/:groupId/leave`
Leave a group.

---

### Message Endpoints

#### `GET /api/chat/groups/:groupId/messages`
Get messages for a group (paginated).

**Query params:**
- `before` - Cursor for pagination (timestamp)
- `limit` - Max 100 messages per request
- `includeDeleted` - Include soft-deleted (moderators only)

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "author": {
        "id": "uuid",
        "displayName": "Jean_971",
        "avatarUrl": "https://...",
        "territoryCode": "971"
      },
      "content": "Les prix du carburant ont encore augmenté...",
      "messageType": "TEXT",
      "moderationStatus": "APPROVED",
      "createdAt": "2024-12-19T09:00:00Z",
      "isEdited": false
    }
  ],
  "cursor": "2024-12-19T08:00:00Z"
}
```

#### `POST /api/chat/groups/:groupId/messages`
Post a new message.

**Request:**
```json
{
  "content": "Les prix du carburant ont encore augmenté...",
  "replyToId": "uuid" // Optional, for threading
}
```

**Response:**
```json
{
  "id": "uuid",
  "content": "...",
  "moderationStatus": "PENDING", // AI will analyze async
  "createdAt": "2024-12-19T10:00:00Z"
}
```

**Flow:**
1. Message created with `moderationStatus = PENDING`
2. Async AI moderation job triggered (non-blocking)
3. Client receives immediate response
4. WebSocket push when moderation completes (status update)

#### `PATCH /api/chat/messages/:messageId`
Edit own message (within 15 minutes).

#### `DELETE /api/chat/messages/:messageId`
Delete own message (soft delete).

#### `POST /api/chat/messages/:messageId/report`
Report message for moderation.

**Request:**
```json
{
  "reason": "HATE_SPEECH", // Enum
  "details": "Message contains discriminatory language"
}
```

---

### Moderation Endpoints (Admin/Moderator only)

#### `GET /api/chat/moderation/flagged`
Get messages flagged by AI.

**RBAC:** Requires `MODERATOR` role or higher.

#### `POST /api/chat/moderation/actions`
Take moderation action.

**Request:**
```json
{
  "messageId": "uuid",
  "targetUserId": "uuid",
  "actionType": "MUTE",
  "reason": "Repeated aggressive language after warning",
  "durationMinutes": 1440 // 24 hours
}
```

**RBAC:** Requires `MODERATOR` role or higher.

---

## WebSocket Infrastructure (Server-side)

### Socket.io Server Configuration

**Namespace:** `/chat`

**Authentication:** JWT token verification on connection.

```javascript
// Pseudo-code
io.of('/chat').use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyJWT(token);
  if (!user) return next(new Error('Authentication failed'));
  socket.userId = user.id;
  next();
});
```

### Events (Server → Client)

#### `message:new`
New message in subscribed group.

**Payload:**
```json
{
  "groupId": "uuid",
  "message": {
    "id": "uuid",
    "author": {...},
    "content": "...",
    "createdAt": "..."
  }
}
```

#### `message:updated`
Message edited or moderation status changed.

#### `message:deleted`
Message deleted.

#### `user:status`
User status changed (MUTED, SUSPENDED).

**Payload:**
```json
{
  "userId": "uuid",
  "status": "MUTED",
  "mutedUntil": "2024-12-20T10:00:00Z",
  "reason": "Temporary suspension for aggressive language"
}
```

### Events (Client → Server)

#### `group:subscribe`
Subscribe to group messages.

**Payload:**
```json
{
  "groupId": "uuid"
}
```

**Server action:** Add socket to room `group:{groupId}`

#### `group:unsubscribe`
Unsubscribe from group.

#### `typing:start` / `typing:stop`
Typing indicators (optional).

---

## AI Moderation System

### Architecture

**Type:** Passive, non-blocking analysis  
**No automatic censorship** - AI only flags for human review

```
Message Posted
     │
     ├─> Store in DB (moderationStatus = PENDING)
     │
     ├─> Return immediately to user
     │
     └─> Queue async AI analysis job
             │
             ├─> Call AI API (OpenAI Moderation, Hugging Face, etc.)
             │
             ├─> Calculate toxicityScore (0.0 - 1.0)
             │
             ├─> If score > threshold (e.g., 0.7):
             │     ├─> moderationStatus = FLAGGED
             │     └─> moderationFlags = ["profanity", "aggression"]
             │
             └─> If score < threshold:
                   └─> moderationStatus = APPROVED
```

### Models Used

**Option 1: OpenAI Moderation API**
- Endpoint: `https://api.openai.com/v1/moderations`
- Categories: hate, harassment, self-harm, sexual, violence
- Free tier available

**Option 2: Hugging Face Transformers**
- Models: `unitary/toxic-bert`, `martin-ha/toxic-comment-model`
- Self-hosted (privacy-preserving)
- French language support

**Option 3: Perspective API (Google Jigsaw)**
- Multi-language toxicity detection
- Free quota available

### Thresholds Configuration

Stored in `ChatModerationModel.config`:

```json
{
  "thresholds": {
    "toxicity": 0.7,
    "severe_toxicity": 0.5,
    "profanity": 0.8,
    "spam": 0.75
  },
  "languages": ["fr", "gcf"], // French, Guadeloupean Creole
  "autoFlag": true,
  "autoRemove": false // Never auto-remove
}
```

### Workflow Example

1. **User posts:** "Les prix sont abusifs !" → `toxicityScore = 0.1` → `APPROVED`
2. **User posts:** "[Offensive content]" → `toxicityScore = 0.9` → `FLAGGED`
3. **Moderator reviews flagged** → Takes action (WARNING, MUTE)
4. **User can appeal** → Admin reviews → Can revoke action

---

## Avatar & Media Storage

### Architecture

**Storage:** S3-compatible (AWS S3, Cloudflare R2, MinIO)  
**CDN:** Cloudflare Images (optimization + delivery)

### Avatar Upload Flow

```
Client Upload Request
     │
     ├─> Backend validates JWT
     │
     ├─> Generate presigned S3 URL
     │
     ├─> Client uploads directly to S3
     │
     ├─> Client notifies backend (upload complete)
     │
     └─> Backend updates ChatUserProfile.avatarUrl
```

**Benefits:**
- Reduces backend bandwidth
- Faster uploads
- Automatic image optimization (Cloudflare)

### File Validation

**Avatar constraints:**
- Max size: 5 MB
- Formats: JPEG, PNG, WebP
- Dimensions: Min 100x100, Max 2000x2000
- Aspect ratio: 1:1 (square, enforced client-side)

**Security:**
- Virus scanning (ClamAV or VirusTotal API)
- EXIF stripping (privacy - remove GPS, camera info)
- Content moderation (AI vision API for inappropriate images)

### Storage Structure

```
s3://akiprisaye-chat/
  avatars/
    {userId}/
      avatar.jpg
      avatar-thumbnail.jpg (auto-generated)
  attachments/
    {groupId}/
      {messageId}/
        {filename}
```

---

## Security & RGPD Compliance

### Authentication & Authorization

**JWT Tokens:**
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- Stored in `RefreshToken` table (revocable)

**RBAC Permissions:**
- `CHAT_READ` - View messages (all users)
- `CHAT_WRITE` - Post messages (verified users)
- `CHAT_MODERATE` - Moderate content (moderators)
- `CHAT_ADMIN` - Manage groups, users (admins)

### RGPD Compliance Checklist

| Article | Requirement | Implementation |
|---------|-------------|----------------|
| Art. 5 | Data minimization | Pseudonym only, no real name |
| Art. 6 | Lawful basis | Explicit consent for photo/bio |
| Art. 13-14 | Transparency | Privacy policy, clear purposes |
| Art. 17 | Right to erasure | CASCADE delete on user deletion |
| Art. 25 | Privacy by design | Default private groups, opt-in notifications |
| Art. 30 | Processing register | `ChatModerationAction` audit trail |
| Art. 32 | Security | JWT auth, bcrypt passwords, HTTPS |

### Data Retention

**Active data:**
- Messages: Indefinite (unless deleted by user)
- Moderation logs: 2 years (legal requirement)
- Soft-deleted messages: 30 days (then hard delete)

**User deletion:**
- User requests deletion → All messages soft-deleted
- After 30 days → Messages hard-deleted
- Moderation logs retained (anonymized user ID)

### Rate Limiting

**Message posting:**
- 10 messages per minute per user
- 100 messages per hour per user

**Group joining:**
- 5 joins per hour per user (prevent spam)

**API requests:**
- 100 requests per minute per user

---

## Monitoring & Analytics

### Metrics to Track

**User engagement:**
- Daily active users (DAU)
- Messages per day/hour
- Average messages per user
- Group participation rate

**Moderation:**
- Messages flagged by AI (daily)
- Human moderation actions (daily)
- False positive rate (flagged but approved)
- Average moderation review time

**Performance:**
- Message delivery latency (WebSocket)
- API response time (p50, p95, p99)
- Database query performance

**RGPD compliance:**
- User deletion requests processed
- Data export requests completed
- Consent withdrawal rate

### Dashboard (Admin)

**Real-time:**
- Active users (currently online)
- Messages per minute (live graph)
- Moderation queue size

**Historical:**
- User growth (weekly)
- Message volume trends
- Top active groups
- Moderation action distribution

---

## Testing Strategy

### Unit Tests

**Models:**
- `ChatUserProfile` validation
- `ChatMessage` moderation status transitions
- `ChatModerationAction` audit trail integrity

**Services:**
- AI moderation service (mocked API calls)
- Message service (CRUD operations)
- Group membership service (join/leave logic)

### Integration Tests

**API endpoints:**
- POST `/api/chat/profile` (create profile)
- POST `/api/chat/groups/:id/messages` (post message)
- GET `/api/chat/groups/:id/messages` (pagination)

**WebSocket:**
- Connection authentication
- Room subscriptions
- Event broadcasting

### E2E Tests

**User flows:**
1. User creates profile → Joins group → Posts message → Receives response
2. Message flagged by AI → Moderator reviews → Takes action → User notified
3. User edits message → Others see updated message (WebSocket)

---

## Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/akiprisaye

# JWT
JWT_ACCESS_SECRET=xxx
JWT_REFRESH_SECRET=yyy
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# S3 Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=akiprisaye-chat
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=yyy
S3_REGION=us-east-1

# AI Moderation
OPENAI_API_KEY=xxx
MODERATION_ENABLED=true
MODERATION_THRESHOLD=0.7

# WebSocket
WEBSOCKET_CORS_ORIGIN=https://akiprisaye.com
WEBSOCKET_MAX_CONNECTIONS=10000
```

### Database Migration

```bash
# Generate migration
npm run prisma:migrate -- --name add_chat_models

# Apply migration (production)
npm run prisma:migrate:deploy
```

### Scaling Considerations

**Horizontal scaling:**
- Use Redis for WebSocket adapter (sticky sessions)
- Separate worker processes for AI moderation queue

**Database:**
- Index on `ChatMessage.createdAt` for pagination
- Partition by `groupId` if message volume > 10M

**Storage:**
- Use CDN for avatar delivery (Cloudflare)
- Image optimization pipeline (resize, WebP conversion)

---

## Future Enhancements

### Phase 2 (Frontend)

- [ ] React chat UI components
- [ ] Socket.io client integration
- [ ] Avatar upload interface
- [ ] Moderation dashboard (admin)
- [ ] Notification system (in-app + email)

### Phase 3 (Advanced Features)

- [ ] Voice messages (audio attachments)
- [ ] Reactions (emoji) on messages
- [ ] Message search (full-text)
- [ ] User blocking/muting
- [ ] Private 1-on-1 messaging
- [ ] Group voice/video calls (Jitsi integration)

### Phase 4 (AI Enhancements)

- [ ] Sentiment analysis per group
- [ ] Auto-summarization (daily digest)
- [ ] Topic modeling (identify trending issues)
- [ ] Multilingual support (French, Creole)
- [ ] Hate speech detection improvements

---

## References

**Legal:**
- RGPD (EU 2016/679): https://eur-lex.europa.eu/eli/reg/2016/679
- Code pénal (diffamation): Articles 29-35
- Loi pour une République numérique (2016): https://www.legifrance.gouv.fr

**Technical:**
- Socket.io Documentation: https://socket.io/docs/
- Prisma Best Practices: https://www.prisma.io/docs/
- OpenAI Moderation API: https://platform.openai.com/docs/guides/moderation

**Standards:**
- JWT (RFC 7519): https://tools.ietf.org/html/rfc7519
- OAuth 2.0 (RFC 6749): https://tools.ietf.org/html/rfc6749
- WebSocket Protocol (RFC 6455): https://tools.ietf.org/html/rfc6455

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-19 | Initial backend architecture document |

---

## Contact & Support

**Project:** A KI PRI SA YÉ  
**Component:** Citizen Chat Backend  
**Repository:** `akiprisaye-web/backend`  
**Documentation:** `CHAT_BACKEND_ARCHITECTURE.md`

**For questions:**
- Technical: Create GitHub issue
- Legal/RGPD: Contact DPO (Data Protection Officer)

---

**End of Document**
