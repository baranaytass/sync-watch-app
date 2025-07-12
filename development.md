# Sync Watch App - Technical Specification

**Project Overview:** A real-time video synchronization application enabling users to watch YouTube videos together. It features a Fastify backend (REST API + WebSocket) and a Vue 3 frontend. The core feature is a server-authoritative sync system to ensure seamless playback across all clients.

---

## 1. Project Structure

The project is a monorepo organized into three main directories: `backend`, `web`, and `packages`.

```
/
├── backend/              # Fastify API and WebSocket Server
│   ├── database/         # PostgreSQL initialization scripts (init.sql)
│   ├── src/
│   │   ├── config/       # Environment variables and database connection
│   │   ├── controllers/  # Request handlers for REST API routes (e.g., AuthController)
│   │   ├── models/       # Database entity definitions (User, Session)
│   │   ├── routes/       # API route definitions (auth, sessions, websocket)
│   │   ├── services/     # Core business logic (AuthService, SessionService)
│   │   ├── types/        # TypeScript type declarations specific to the backend
│   │   └── server.ts     # Main server entry point
│   └── Dockerfile        # Docker definition for the backend service
│
├── web/                  # Vue 3 Frontend Application
│   ├── src/
│   │   ├── assets/       # Global styles, fonts, and images
│   │   ├── components/   # Reusable Vue components (VideoPlayer, SessionCard, etc.)
│   │   ├── composables/  # Reusable stateful logic (e.g., useWebSocket)
│   │   ├── router/       # Vue Router configuration and routes
│   │   ├── stores/       # Pinia state management modules (auth, sessions, videoSync)
│   │   ├── views/        # Page-level components (HomePage, SessionRoomPage)
│   │   └── main.ts       # Main Vue application entry point
│   └── tests/            # Playwright E2E test suites
│
├── packages/
│   └── shared-types/     # TypeScript types shared between frontend and backend
│
└── docker-compose.yml    # Docker configuration to run services (Postgres, backend)
```

---

## 2. Data Models
```typescript
interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string;
}

interface SessionParticipant {
  userId: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface Session {
  id: string;
  title: string;
  hostId: string;
  videoProvider: 'youtube' | null;
  videoId: string | null;
  videoTitle: string | null;
  videoDuration: number;
  // Core state for sync
  lastAction: 'play' | 'pause' | 'seek';
  lastActionTimeAsSecond: number;
  lastActionTimestamp: Date;
  isActive: boolean;
  participants: SessionParticipant[];
}
```

---

## 3. API & Communication

### REST API

| Method | Path                      | Purpose                  |
| ------ | ------------------------- | ------------------------ |
| GET    | /api/auth/google          | Google OAuth Redirect    |
| GET    | /api/auth/google/callback | OAuth Callback           |
| POST   | /api/auth/logout          | Logout                   |
| GET    | /api/auth/me              | Get current user         |
| GET    | /api/sessions             | List active sessions     |
| POST   | /api/sessions             | Create session           |
| GET    | /api/sessions/:id         | Get session details      |
| POST   | /api/sessions/:id/join    | Join session             |
| POST   | /api/sessions/:id/video   | Set video for session    |

### WebSocket API

| Method    | Endpoint                 | Description                        |
| --------- | ------------------------ | ---------------------------------- |
| WebSocket | `/ws/session/:sessionId` | Real-time connection for a session |

A server-authoritative pattern is used for all real-time communication. The client sends actions, and the server broadcasts the canonical state to all participants.

| Direction | Type                       | Payload Fields                                               |
| --------- | -------------------------- | ------------------------------------------------------------ |
| C→S       | `video_action`             | `action: 'play'\|'pause'\|'seek'`, `time: number`, `messageId: string` |
| S→C       | `video_sync_authoritative` | `action`, `time`, `timestamp`, `messageId`                   |
| S→C       | `participants`             | `participants: SessionParticipant[]`                         |
| S→C       | `video_update`             | `videoProvider`, `videoId`, `videoTitle`, `videoDuration`    |

---

## 4. Core Logic: Server-Authoritative Video Sync

This system solves client-side "echo loops" and incorrect video state for users joining mid-session.

- **Server as Single Source of Truth:** The backend maintains the canonical video state (action, time, timestamp) for each session.
- **Authoritative Broadcast:** Clients send `video_action` messages. The server updates its state and broadcasts a `video_sync_authoritative` message to all clients. Clients **only** react to these messages.
- **Real-time Position Calculation:** When a new user joins, the backend calculates the current video position by adding the elapsed time since the last "play" action, ensuring new users sync to the correct moment.
- **Frontend Logic:** The player is in a "listen-only" mode. It only emits `video_action` for genuine user interactions and ignores state changes triggered programmatically by the server, preventing echo loops.
- **Message Deduplication:** The server uses a `messageId` from the client to prevent processing the same action more than once.

---

## 5. Database Schema (PostgreSQL)

- **`users`**: Stores persistent user data.
- **`sessions`**: Stores active session data. Defined as an `UNLOGGED` table for high performance, as this data is transient (like a cache).
- **`session_participants`**: Maps users to sessions. Also an `UNLOGGED` table.
- **Automatic Cleanup**: Sessions are marked as inactive when the last participant leaves.

---

## 6. How to Run

### 1. Start Services

The backend and database run in Docker containers.

```bash
# Start the backend and postgres services in detached mode
docker-compose up -d backend postgres
```

### 2. Run Frontend

The frontend development server must be run separately.

```bash
# Navigate to the web directory
cd web

# Install dependencies (if you haven't already)
npm install

# Start the frontend dev server
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 7. How to Run Tests

End-to-end tests are implemented with Playwright and run against a real backend and database instance. **Ensure the services are running (Step 6.1) before executing tests.**

### Run All Tests

```bash
# Navigate to the web directory
cd web

# Run all Playwright tests
npx playwright test
```

### Test Configuration (`web/playwright.config.ts`)
- Tests run serially (`workers: 1`) and fail fast (`maxFailures: 1`) to provide clear results.
- A global setup script pings the backend to ensure it's healthy before tests start.
- An HTML report is generated in `web/playwright-report/` after each run.

### Test Suites (`web/tests/`)
- `auth.spec.ts`: Guest login and logout flow.
- `session.spec.ts`: Session creation and participant validation.
- `video-sync-advanced.spec.ts`: Complex multi-user sync scenarios.
- `video-sync-join-state.spec.ts`: Critical test for ensuring users joining mid-playback sync correctly.

---

## 8. Project Status

- **🚀 PRODUCTION READY**
- All core features are complete and stable.
- The critical "new user join" sync bug is fixed and covered by tests.
- Echo loop issue is resolved by the server-authoritative architecture.
- All 6 end-to-end tests are passing (100% success rate).

**Optional Enhancements:**
- Chat system implementation
- UI/UX improvements
- Mobile responsiveness