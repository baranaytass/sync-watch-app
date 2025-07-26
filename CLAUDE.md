# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root Level Commands
```bash
# Start all services (backend + frontend)
npm run dev

# Start services individually 
npm run dev:backend
npm run dev:web

# Build entire project
npm run build

# Run tests across all workspaces
npm run test

# Lint and fix code
npm run lint
npm run lint:fix

# Database operations
npm run docker:db:up      # Start PostgreSQL
npm run docker:db:down    # Stop database
npm run docker:db:logs    # View database logs
```

### Backend Development (from /backend)
```bash
npm run dev          # Development server with tsx watch
npm run build        # TypeScript compilation
npm run start        # Production server
npm run test         # Jest tests
npm run test:watch   # Jest in watch mode
```

### Frontend Development (from /web)
```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run type-check   # TypeScript checking
npm run test         # Playwright E2E tests
npm run test:ui      # Playwright UI mode
npm run test:debug   # Playwright debug mode

# Run specific test files
npx playwright test auth.spec.ts                    # Authentication tests
npx playwright test session.spec.ts                 # Session management
npx playwright test video-sync-join-state.spec.ts  # Critical join-during-playback test
npx playwright test video-sync-advanced.spec.ts    # Complex multi-user sync scenarios
```

## Code Architecture

### Project Structure
- **Monorepo** with workspaces: `backend/`, `web/`, `packages/shared-types/`
- **Backend**: Fastify REST API + WebSocket server with PostgreSQL
- **Frontend**: Vue 3 + Vite with Pinia state management
- **Database**: PostgreSQL with Docker Compose

### Core Technologies
- **Backend**: Fastify, TypeScript, PostgreSQL, WebSocket, JWT, Google OAuth
- **Frontend**: Vue 3, Pinia, Vue Router, Tailwind CSS, Playwright (testing)
- **Shared**: TypeScript interfaces in `packages/shared-types/`

### Critical Architecture: Server-Authoritative Video Sync

This app implements a **server-authoritative pattern** that solves two critical real-time synchronization problems:

#### **Problem 1: Echo Loop Prevention**
- **Issue**: Client video actions causing infinite loops where one user's play/pause triggers others recursively
- **Solution**: Server-authoritative state where clients only react to server broadcasts, never direct user actions

#### **Problem 2: New User Mid-Session Sync**
- **Issue**: Users joining during active playback would reset video to session start time for all users
- **Solution**: Real-time position calculation using elapsed time since last action

#### **Implementation Details:**
1. **Single Source of Truth**: Server maintains canonical video state in `sessionVideoStates` Map (in-memory for performance)
2. **Authoritative Broadcast**: Clients send `video_action`, server validates and broadcasts `video_sync_authoritative` to ALL clients (including sender)
3. **Message Deduplication**: Server tracks `lastMessageId` to prevent duplicate action processing from unstable connections
4. **Real-time Position Calculation**: `lastActionTimeAsSecond + (Date.now() - lastActionTimestamp) / 1000` for "play" states
5. **Queue System**: Handles player-not-ready scenarios with action queuing
6. **Critical Error Recovery**: Automatic detection and recovery from sync failures

### Key Components

#### Backend Core Services
- `SessionService`: Session CRUD, participant management, cleanup jobs
- `AuthService`: Google OAuth integration with JWT tokens
- `YouTubeService`: Video metadata fetching and validation
- WebSocket handler: Real-time communication in `/routes/websocket.ts`

#### Frontend State Management (Pinia)
- `auth.ts`: User authentication and session persistence
- `sessions.ts`: Session list and management
- `videoSync.ts`: Video synchronization state and controls
- `chat.ts`: Real-time chat functionality
- `theme.ts`: UI theme management

#### Core Composables
- `useWebSocket.ts`: WebSocket connection management with auto-reconnect
- `useI18n.ts`: Internationalization (Turkish/English support)

### Database Schema (PostgreSQL)
- **`users`**: Persistent user data from Google OAuth (standard table)
- **`sessions`**: Active session data (UNLOGGED table for high performance - data is transient like cache)
- **`session_participants`**: User-session mapping (UNLOGGED table for performance)
- **Performance Rationale**: Sessions use UNLOGGED tables as this data is temporary and session state is primarily managed in-memory
- **Automatic Cleanup**: Sessions are deleted when last participant leaves, plus scheduled cleanup every 10 minutes for orphaned sessions

### Testing Strategy
- **End-to-End**: Playwright tests covering multi-user sync scenarios with real YouTube videos
- **Multi-Browser Testing**: Creates separate browser contexts to simulate different users
- **Critical Tests**: New user join sync (`video-sync-join-state.spec.ts`), echo loop prevention, complex action sequences (`video-sync-advanced.spec.ts`)
- **Test Helpers**: `TestErrorTracker` for comprehensive error detection, `triggerVideoAction` for video controls
- **Config**: Serial execution (`workers: 1`) with fail-fast (`maxFailures: 1`)
- **Prerequisites**: Backend must be running at `http://localhost:3000` before tests execute

## Development Guidelines

### Prerequisites
- Node.js >=18.0.0, npm >=9.0.0
- Docker & Docker Compose for PostgreSQL
- Google OAuth credentials for authentication

### Getting Started
1. Install dependencies: `npm install`
2. Set up environment variables (see Environment Setup section)
3. Start database: `npm run docker:db:up`
4. Start backend: `npm run dev:backend` (or `npm run docker:stack:up` for Docker)
5. Start frontend separately: `npm run dev:web`
6. Access: Frontend at http://localhost:5173, Backend at http://localhost:3000

**Important**: Frontend runs separately via Vite dev server, not in Docker. Only backend and PostgreSQL run in containers.

### Code Conventions
- **TypeScript strict mode** enabled across all packages
- **ESLint + Prettier** for code formatting
- **Workspace dependencies**: Use `@sync-watch-app/shared-types` for cross-package types
- **State management**: Use Pinia stores for reactive state
- **WebSocket**: Always use `useWebSocket` composable for connections

### Important Files
- `development.md`: Complete technical specification and architecture details
- `development-progress.md`: Detailed implementation progress and solved critical issues (Turkish)
- `web/tests/`: Comprehensive E2E test suites covering video sync scenarios
- `backend/database/init.sql`: Database schema initialization with UNLOGGED table definitions
- `web/playwright-report/`: HTML test reports generated after each test run
- `docs/google-oauth-setup.md`: Google Cloud Console setup instructions

### Testing Before Commits
Always run the full test suite to ensure video sync functionality:
```bash
# Start backend first (required for tests)
npm run dev:backend

# In another terminal, run tests
cd web && npm run test

# Or run specific critical tests
cd web
npx playwright test video-sync-join-state.spec.ts  # Most critical test
npx playwright test video-sync-advanced.spec.ts    # Multi-user scenarios
```

### Session Management
- Sessions auto-cleanup when last participant leaves
- Host transfer when host disconnects
- Automatic cleanup job runs every 10 minutes
- Database uses UNLOGGED tables for session data (high performance, transient)

### WebSocket Message Architecture

#### **Complete Message Type Specification**
| Direction | Type | Payload Fields | Purpose |
|-----------|------|----------------|---------|
| C→S | `video_action` | `action: 'play'\|'pause'\|'seek'`, `time: number`, `messageId: string` | Client video control requests |
| S→C | `video_sync_authoritative` | `action`, `time`, `timestamp`, `messageId` | Server's canonical video state |
| S→C | `participants` | `participants: SessionParticipant[]` | Real-time participant list updates |
| S→C | `video_update` | `videoProvider`, `videoId`, `videoTitle`, `videoDuration` | Video metadata changes |
| C→S | `chat` | `message: string` | Chat message from user |
| S→C | `chat` | `userId`, `message`, `timestamp`, `userName` | Broadcasted chat messages |
| C→S | `leave` | `{}` | Manual session leave |
| C↔S | `ping/pong` | `{}` | Connection health checks |

#### **Connection Management**
- **Message Deduplication**: Uses `messageId` (`${Date.now()}_${Math.random()}`) to prevent duplicate processing
- **Connection Tracking**: Server maintains global `sessionId -> sockets[]` mapping for broadcasting
- **Reconnection Strategy**: Client implements exponential backoff (max 3 attempts) with graceful cleanup
- **Endpoint**: WebSocket connections at `/ws/session/:sessionId`

### REST API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/auth/google` | Google OAuth redirect |
| GET | `/api/auth/google/callback` | OAuth callback handler |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user info |
| GET | `/api/sessions` | List active sessions |
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions/:id` | Get session details |
| POST | `/api/sessions/:id/join` | Join existing session |
| POST | `/api/sessions/:id/video` | Set video for session |

### Environment Setup
Required environment variables for backend:
- `JWT_SECRET`: Token signing secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth credentials (from Google Cloud Console)
- `DATABASE_URL`: PostgreSQL connection string  
- `YOUTUBE_API_KEY`: For video metadata fetching and validation
- `FRONTEND_URL`: For CORS configuration (default: http://localhost:5173)
- `NODE_ENV`: Development/production environment flag

## Project Status

### **🚀 PRODUCTION READY**
- All core features complete and stable
- Critical video sync bugs resolved
- 100% test success rate (6 comprehensive E2E tests)
- TypeScript strict mode with zero compilation errors

### **Critical Issues Resolved**
1. **Echo Loop Bug**: Fixed through server-authoritative pattern - prevents infinite play/pause loops
2. **New User Sync Bug**: Fixed real-time position calculation - new users join at correct video timestamp  
3. **Message Deduplication**: Prevents duplicate actions from unstable connections
4. **Connection Management**: Proper cleanup prevents memory leaks and ghost connections

### **Architecture Benefits**
- **Scalability**: Server-authoritative pattern ensures consistency across any number of users
- **Performance**: UNLOGGED database tables + in-memory session state for optimal real-time performance  
- **Reliability**: Comprehensive error detection, recovery, and automatic session cleanup
- **Testing**: Multi-browser E2E tests cover complex real-world synchronization scenarios