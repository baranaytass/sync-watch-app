# 🎬 Sync Watch App

Realtime Video Sync Chat App - YouTube videolarını senkronize oynatma ve gerçek zamanlı sohbet uygulaması

## 📋 Proje Hakkında

Bu proje, YouTube videolarını farklı kullanıcıların tarayıcılarında aynı anda senkronize oynatmayı ve gerçek zamanlı sohbet etmeyi amaçlayan bir web uygulamasıdır. Kullanıcılar Google hesabıyla oturum açar, bir oturum (session) oluşturur veya mevcut bir oturuma katılır.

## 🏗️ Teknoloji Stack

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

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose

### Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Veritabanını başlatın:**
   ```bash
   npm run docker:db:up
   ```

3. **Geliştirme sunucularını başlatın:**
   ```bash
   npm run dev
   ```

### Geliştirme Ortamı

```bash
# PostgreSQL'i başlat
docker-compose up -d postgres

# Backend'i başlat
cd backend
npm install
npm run dev

# Frontend'i başlat (yeni terminal)
cd web
npm install
npm run dev
```

## 📁 Proje Yapısı

```
├── backend/                 # Fastify API & WebSocket sunucusu
│   ├── src/
│   │   ├── config/         # Konfigürasyon dosyaları
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

## 🔧 Geliştirme Komutları

```bash
# Tüm projeyi geliştirme modunda çalıştır
npm run dev

# Sadece backend'i çalıştır
npm run dev:backend

# Sadece frontend'i çalıştır
npm run dev:web

# Projeyi build et
npm run build

# Testleri çalıştır
npm run test

# Linting
npm run lint
npm run lint:fix

# Veritabanı komutları
npm run docker:db:up      # Veritabanını başlat
npm run docker:db:down    # Veritabanını durdur
npm run docker:db:logs    # Veritabanı loglarını göster
```

## 📚 Dökümanlar

- [Teknik Tasarım Dokümanı](./development.md)
- [Geliştirme Adımları](./development-progress.md)

## 🎯 Özellikler

- ✅ Google OAuth ile kimlik doğrulama
- ✅ Gerçek zamanlı video senkronizasyonu
- ✅ Canlı sohbet sistemi
- ✅ Oturum yönetimi
- ✅ Katılımcı listesi
- ✅ YouTube video entegrasyonu

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasını inceleyebilirsiniz.

## 🧪 E2E Test Sistemi

### 🎬 Real Video Sync E2E Test

İki kullanıcının gerçek zamanlı video sync'ini test eden kapsamlı e2e test sistemi:

**Test Senaryosu:**
1. **2 misafir kullanıcı** aynı anda giriş yapar
2. **User1 (Host)** oturum oluşturur ve video setler
3. **User2 (Participant)** aynı oturuma katılır
4. **User1** videoyu başlatır
5. **User2**'de videonun otomatik başladığı doğrulanır (WebSocket sync)
6. **Participants tracking** ve **real-time communication** test edilir

### Docker'da Test Çalıştırma (Önerilen)

**Tek komutla test çalıştırma:**
```bash
# Root directory'de
./run-e2e-test.sh
```

Bu script otomatik olarak:
- ✅ Docker servislerini başlatır (postgres + backend)
- ✅ Backend sağlık kontrolü yapar
- ✅ E2E test'i çalıştırır
- ✅ Test sonucunu raporlar
- ✅ Cleanup işlemi yapar

### Manuel Docker Test Çalıştırma

```bash
# 1. Backend servisleri başlat
npm run test:docker:setup

# 2. Backend'in hazır olmasını bekle (30 saniye)
# health check: http://localhost:3000/health

# 3. Test'i çalıştır
cd web
npm run test:real-sync

# 4. Cleanup
npm run test:docker:cleanup
```

### Local Development Test

```bash
# 1. Backend ve frontend'i ayrı terminallerde başlat
# (yukarıdaki Hızlı Başlangıç'a bakın)

# 2. Test'i çalıştır
cd web
npm run test:real-sync:headed  # Browser görünür modda
# veya
npm run test:real-sync         # Headless mode
```

### Test Komutları

```bash
# Tüm integration testleri
npm run test:integration

# Sadece real video sync testi
npm run test:real-sync

# Browser görünür modda test
npm run test:real-sync:headed

# Docker'da test çalıştırma
npm run test:docker

# Test servisleri setup/cleanup
npm run test:docker:setup
npm run test:docker:cleanup
```

### Test Bileşenleri

- **Integration Test Config**: `web/playwright.config.integration.ts`
- **Global Setup**: `web/tests/integration/global.setup.ts`
- **Real Video Sync Test**: `web/tests/integration/real-video-sync-test.spec.ts`
- **Docker Test Runner**: `web/Dockerfile.test`

### Test Fail Handling

Test hata verdiği noktada durur ve detaylı hata bilgisi verir:
- ❌ Hangi phase'de fail olduğunu gösterir
- 🔍 Backend/Frontend durumunu raporlar
- 📝 WebSocket connection durumunu kontrol eder
- 🎥 Video iframe ve sync durumunu analiz eder

## 📋 Geliştirme Notları

### Teknik Detaylar
- **Backend**: Fastify + PostgreSQL + WebSocket
- **Frontend**: Vue 3 + Pinia + Tailwind CSS
- **Test**: Playwright + Docker
- **Database**: UNLOGGED tables for cache data

### Daha Fazla Bilgi
- 📖 [Teknik Tasarım Dokümantasyonu](./development.md)
- 📝 [Geliştirme Progress Notları](./development-progress.md) 