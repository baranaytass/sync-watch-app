# Realtime Video Sync Chat App - Geliştirme Adımları

Bu döküman, projenin geliştirme sürecinde takip edilecek adımları ve her adımın tamamlanma durumunu içerir.

## Durumlar
- [ ] Yapılmadı
- [🚧] Devam ediyor
- [✅] Tamamlandı
- [🔄] Review gerekli

---

## 1. Proje Başlangıç Kurulumu

### 1.1 Git Repository İnisiyal
- [✅] Local git repository oluştur
- [✅] .gitignore dosyası oluştur
- [✅] İlk commit

### 1.2 Monorepo Klasör Yapısı
- [✅] `backend/` klasörü oluştur
- [✅] `web/` klasörü oluştur
- [✅] `packages/shared-types/` klasörü oluştur
- [✅] Root seviye `package.json` oluştur
- [✅] Monorepo workspace konfigürasyonu

---

## 2. Docker ve Veritabanı Kurulumu

### 2.1 Docker Compose
- [✅] `docker-compose.yml` dosyası oluştur
- [✅] PostgreSQL servis konfigürasyonu
- [✅] Volume ve network ayarları

### 2.2 Database Schema
- [✅] `backend/database/init.sql` dosyası oluştur
- [✅] Users tablosu oluştur
- [✅] Sessions tablosu oluştur
- [✅] Session_participants tablosu oluştur
- [✅] Docker ile veritabanı test et

---

## 3. Backend Temel Kurulum

### 3.1 Package Kurulumu
- [ ] `backend/package.json` oluştur
- [ ] Fastify ve gerekli bağımlılıklar
- [ ] TypeScript konfigürasyonu
- [ ] ESLint ve Prettier kurulumu

### 3.2 Proje Yapısı
- [ ] `src/` klasör yapısını oluştur
- [ ] `config/`, `controllers/`, `routes/`, `services/`, `models/`, `websocket/`, `utils/` klasörler
- [ ] `server.ts` ana dosya
- [ ] Build scripti konfigürasyonu

### 3.3 Database Bağlantısı
- [ ] PostgreSQL connection pool kurulumu
- [ ] Database helper fonksiyonları
- [ ] Connection test

---

## 4. Authentication Sistemi

### 4.1 Google OAuth Setup
- [ ] Google Cloud Console konfigürasyonu
- [ ] OAuth credentials alma
- [ ] Environment variables ayarlama

### 4.2 Auth Routes
- [ ] `/api/auth/google` route
- [ ] `/api/auth/google/callback` route
- [ ] `/api/auth/logout` route
- [ ] `/api/auth/me` route
- [ ] JWT token handling

### 4.3 Auth Middleware
- [ ] JWT doğrulama middleware
- [ ] User session yönetimi
- [ ] Auth test

---

## 5. Core API Endpoints

### 5.1 Sessions API
- [ ] `GET /api/sessions` - Aktif oturumları listele
- [ ] `POST /api/sessions` - Oturum oluştur
- [ ] `POST /api/sessions/:id/join` - Oturuma katıl
- [ ] `POST /api/sessions/:id/leave` - Oturumdan ayrıl
- [ ] `POST /api/sessions/:id/video` - Video ayarla

### 5.2 Input Validation
- [ ] Request schema validasyonu
- [ ] Error handling middleware
- [ ] Response standardizasyonu

### 5.3 API Test
- [ ] Postman/İnsomnia ile endpoint test
- [ ] Error scenario testleri

---

## 6. WebSocket Implementasyonu

### 6.1 WebSocket Gateway
- [ ] Fastify WebSocket plugin kurulumu
- [ ] Connection handling
- [ ] Room/Session yönetimi
- [ ] Participant tracking

### 6.2 WebSocket Events
- [ ] `video_action` (client → server)
- [ ] `chat` (client → server)
- [ ] `leave` (client → server)
- [ ] `video_sync` (server → client)
- [ ] `chat` (server → client)
- [ ] `participants` (server → client)
- [ ] `video_update` (server → client)
- [ ] `session_ended` (server → client)

### 6.3 WebSocket Test
- [ ] Connection test
- [ ] Message broadcasting test
- [ ] Disconnection handling test

---

## 7. Frontend Temel Kurulum

### 7.1 Vue 3 + Vite Setup
- [ ] `web/package.json` oluştur
- [ ] Vue 3, Vite, TypeScript kurulumu
- [ ] Shadcn UI kurulumu
- [ ] Tailwind CSS konfigürasyonu

### 7.2 Project Structure
- [ ] `src/` klasör yapısı
- [ ] `components/`, `composables/`, `stores/`, `views/`, `router/`, `utils/` klasörler
- [ ] `App.vue` ve `main.ts`
- [ ] Router konfigürasyonu

### 7.3 State Management
- [ ] Pinia kurulumu
- [ ] `stores/auth.ts` store
- [ ] `stores/sessions.ts` store
- [ ] `stores/videoSync.ts` store
- [ ] `stores/chat.ts` store

---

## 8. Frontend Authentication

### 8.1 Auth Components
- [ ] Login sayfası
- [ ] Google OAuth button
- [ ] Auth layout component
- [ ] Route protection

### 8.2 Auth Store Integration
- [ ] Login flow
- [ ] Token management
- [ ] User state persistence
- [ ] Logout functionality

### 8.3 Auth Test
- [ ] Login/logout test
- [ ] Protected route test

---

## 9. Sessions Management

### 9.1 Sessions List
- [ ] Sessions list page
- [ ] Session card component
- [ ] Create session modal
- [ ] Join session functionality

### 9.2 Session Room
- [ ] Session room layout
- [ ] Participants list
- [ ] Session info display
- [ ] Leave session functionality

---

## 10. Video Synchronization

### 10.1 YouTube Integration
- [ ] YouTube API kurulumu
- [ ] Video embed component
- [ ] Video metadata fetching
- [ ] Video validation

### 10.2 Video Sync Logic
- [ ] Video player controls
- [ ] Play/pause synchronization
- [ ] Seek synchronization
- [ ] Time calculation logic

### 10.3 WebSocket Integration
- [ ] Video action broadcasting
- [ ] Video sync event handling
- [ ] Real-time synchronization test

---

## 11. Chat System

### 11.1 Chat Components
- [ ] Chat panel layout
- [ ] Message list component
- [ ] Message input component
- [ ] Message bubble design

### 11.2 Chat Functionality
- [ ] Message sending
- [ ] Real-time message receiving
- [ ] Message history
- [ ] User mentions/formatting

---

## 12. Testing ve Quality Assurance

### 12.1 Backend Tests
- [ ] Unit test setup
- [ ] API endpoint tests
- [ ] WebSocket tests
- [ ] Database tests

### 12.2 Frontend Tests
- [ ] Component tests
- [ ] Store tests
- [ ] E2E tests basic

### 12.3 Integration Tests
- [ ] Full flow tests
- [ ] Multiple user scenarios
- [ ] Error handling tests

---

## 13. Build ve Deployment Hazırlığı

### 13.1 Build Configuration
- [ ] Backend build script
- [ ] Frontend build script
- [ ] Environment config
- [ ] Docker production setup

### 13.2 Performance Optimization
- [ ] Bundle optimization
- [ ] Database query optimization
- [ ] WebSocket connection optimization

### 13.3 Final Testing
- [ ] Production build test
- [ ] Performance testing
- [ ] Security review

---

## Geliştirme Notları

- Her major adım tamamlandıktan sonra commit yapılacak
- Code review her önemli feature sonrası yapılacak
- Build hatalarının hemen çözülmesi gerekli
- TypeScript strict mode kullanılacak
- ESLint kurallarına uyulacak

---

## Güncel Durum
**Son güncelleme:** 21 Haziran 2025
**Aktif adım:** 3.1 - Backend Package Kurulumu
**Tamamlanan adımlar:** 2/13 ana kategori 