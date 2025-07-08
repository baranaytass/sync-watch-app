# 🎬 Sync Watch App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.0-green.svg)](https://vuejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.0-black.svg)](https://www.fastify.io/)

A real-time video synchronization and chat application that allows users to watch YouTube videos together with synchronized playback and live chat functionality.

## 📋 About

Sync Watch App enables users to watch YouTube videos together in perfect synchronization across multiple browsers. Users can authenticate with Google accounts, create or join sessions, and enjoy real-time chat while watching videos together.

## ✨ Features

- ✅ Google OAuth authentication
- ✅ Real-time video synchronization
- ✅ Live chat system
- ✅ Session management
- ✅ Participant list
- ✅ YouTube integration
- ✅ Responsive design with modern UI

## 🏗️ Tech Stack

### Backend
- **Fastify** - Fast and efficient web framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Relational database
- **WebSocket** - Real-time communication
- **Docker** - Containerization

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **Pinia** - State management
- **Vite** - Fast build tool
- **Shadcn UI** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd sync-watch-app-3
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the database:**
   ```bash
   npm run docker:db:up
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Development Environment

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Start backend
cd backend
npm install
npm run dev

# Start frontend (new terminal)
cd web
npm install
npm run dev
```

## 🚀 Usage

1. **Authentication**: Sign in with your Google account
2. **Create Session**: Create a new watch session with a custom title
3. **Join Session**: Join an existing session using the session ID
4. **Add Video**: Paste a YouTube URL to start watching together
5. **Chat**: Use the real-time chat to communicate with other participants

## 📁 Project Structure

```
├── backend/                 # Fastify API & WebSocket server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # HTTP request handlers
│   │   ├── routes/         # Route definitions
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models
│   │   ├── websocket/      # WebSocket handlers
│   │   └── utils/          # Utility functions
│   └── database/           # Database schemas
├── web/                    # Vue 3 SPA
│   └── src/
│       ├── components/     # UI components
│       ├── composables/    # Composition API hooks
│       ├── stores/         # Pinia stores
│       ├── views/          # Page components
│       ├── router/         # Vue Router config
│       └── utils/          # Frontend utilities
└── packages/
    └── shared-types/       # Shared TypeScript types
```

## 🔧 Development Scripts

```bash
# Start all services in development mode
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:web

# Build the project
npm run build

# Run tests
npm run test

# Linting
npm run lint
npm run lint:fix

# Database commands
npm run docker:db:up      # Start database
npm run docker:db:down    # Stop database
npm run docker:db:logs    # View database logs
```

## 🧪 E2E Test System

### 🎬 Real Video Sync E2E Testing

Comprehensive e2e test system for testing real-time video synchronization between two users:

**Test Scenario:**
1. **2 guest users** log in simultaneously
2. **User1 (Host)** creates a session and sets a video
3. **User2 (Participant)** joins the same session
4. **User1** starts the video
5. **User2** automatically starts the video (WebSocket sync verification)
6. **Participants tracking** and **real-time communication** are tested

### Running Tests with Docker (Recommended)

**One-command test execution:**
```bash
# In root directory
./run-e2e-test.sh
```

This script automatically:
- ✅ Starts Docker services (postgres + backend)
- ✅ Performs backend health checks
- ✅ Runs E2E tests
- ✅ Reports test results
- ✅ Performs cleanup

### Manual Docker Test Execution

```bash
# 1. Start backend services
npm run test:docker:setup

# 2. Wait for backend to be ready (30 seconds)
# health check: http://localhost:3000/health

# 3. Run tests
cd web
npm run test:real-sync

# 4. Cleanup
npm run test:docker:cleanup
```

### Local Development Testing

```bash
# 1. Start backend and frontend in separate terminals
# (see Quick Start above)

# 2. Run tests
cd web
npm run test:real-sync:headed  # Visible browser mode
# or
npm run test:real-sync         # Headless mode
```

### Test Commands

```bash
# All integration tests
npm run test

# Run tests in headed mode
npm run test:headed

# View test report
npm run test:report
```

### AI Agent Development Ready

> **Note**: This project features comprehensive e2e tests specifically designed for AI agent development workflows. The test suite includes multi-user scenarios, real-time synchronization validation, and WebSocket communication testing. These tests demonstrate effective patterns for testing complex real-time applications and provide excellent examples for AI-assisted development. I'll be writing a detailed blog post about implementing effective e2e testing strategies for AI-assisted development soon.

## 🌐 Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://videosync_user:videosync_pass@localhost:5432/videosync
JWT_SECRET=your-jwt-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
YOUTUBE_API_KEY=your-youtube-api-key
FRONTEND_URL=http://localhost:5173
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- [Technical Design Document](./development.md)
- [Development Progress](./development-progress.md)
- [Google OAuth Setup](./docs/google-oauth-setup.md)

## 🐛 Known Issues

See the [development progress document](./development-progress.md) for current known issues and their status.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to the Vue.js team for the amazing framework
- Fastify team for the high-performance web framework
- All contributors who help improve this project

---

*Built with ❤️ using Vue 3, Fastify, and modern web technologies* 