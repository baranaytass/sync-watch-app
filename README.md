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