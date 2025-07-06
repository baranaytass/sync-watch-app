# Realtime Video Sync Chat App – Teknik Tasarım Dokümanı (güncel 21 Haz 2025)

**Özet:** Bu proje, YouTube videolarını farklı kullanıcıların tarayıcılarında aynı anda senkronize oynatmayı ve gerçek zamanlı sohbet etmeyi amaçlayan bir web uygulamasıdır. Kullanıcılar Google hesabıyla oturum açar, bir oturum (session) oluşturur veya mevcut bir oturuma katılır. Sunucu, Fastify tabanlı REST API ve WebSocket üzerinden oynatma eylemlerini ve mesajları dağıtır. Ön yüz Vue 3 + Pinia + Vite ile geliştirilmiş olup, **Shadcn UI** bileşen kütüphanesi kullanılarak modern ve erişilebilir bir tasarım sunar.

---

## 1. Veri Modelleri

```typescript
interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionParticipant {
  sessionId: string;
  userId: string;
  name: string;
  avatar: string;
  joinedAt: Date;
  isOnline: boolean;
  lastSeen: Date;
}

interface Session {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  videoProvider: 'youtube' | null;
  videoId: string | null;
  videoTitle: string | null;
  videoDuration: number;
  lastAction: 'play' | 'pause' | 'seek';
  lastActionTimeAsSecond: number;
  lastActionTimestamp: Date;
  isActive: boolean;
  participants: SessionParticipant[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. REST API Uç Noktaları

| Metot | Yol                       | Amaç                     |
| ----- | ------------------------- | ------------------------ |
| GET   | /api/auth/google          | Google OAuth yönlendirme |
| GET   | /api/auth/google/callback | OAuth callback           |
| POST  | /api/auth/logout          | Oturum sonlandırma       |
| GET   | /api/auth/me              | Oturum bilgisini getir   |
| GET   | /api/sessions             | Aktif oturumları listele |
| POST  | /api/sessions             | Oturum oluştur           |
| GET   | /api/sessions/\:id        | Belirli oturumu getir    |
| POST  | /api/sessions/\:id/join   | Oturuma katıl            |
| POST  | /api/sessions/\:id/video  | Oturum videosunu ayarla  |

### WebSocket Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| WebSocket | `/ws/session/:sessionId` | Session'a özel WebSocket bağlantısı |

---

## 3. İstek ⁄ Yanıt Şemaları

```jsonc
// POST /api/sessions  İstek
{
  "title": "Movie Night",
}

// Yanıt (201)
{
  "success": true,
  "data": {
    "id": "session_123",
    "title": "Movie Night",
    "hostId": "user_123",
    "videoProvider": null,
    "videoId": null,
    "videoTitle": null,
    "videoDuration": 0,
    "lastAction": "pause",
    "lastActionTimeAsSecond": 0,
    "lastActionTimestamp": "2025-06-21T10:00:00Z",
    "isActive": true,
    "participants": [
      {
        "sessionId": "session_123",
        "userId": "user_123",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg",
        "joinedAt": "2025-06-21T10:00:00Z",
        "isOnline": true,
        "lastSeen": "2025-06-21T10:00:00Z"
      }
    ],
    "createdAt": "2025-06-21T10:00:00Z",
    "updatedAt": "2025-06-21T10:00:00Z"
  }
}
```

---

## 4. WebSocket Mesaj Şemaları

| Yön | Tip             | Alanlar                                                      |         |                          |
| --- | --------------- | ------------------------------------------------------------ | ------- | ------------------------ |
| C→S | `video_action`  | \`action: 'play'                                             | 'pause' | 'seek'`, `time: number\` |
| C→S | `chat`          | `message: string`                                            |         |                          |
| C→S | `leave`         | – (tarayıcı kapatma veya manuel ayrılma)                   |         |                          |
| S→C | `video_sync`    | `action`, `time`, `timestamp`                                |         |                          |
| S→C | `chat`          | `id`, `userId`, `message`, `timestamp`                       |         |                          |
| S→C | `participants`  | `participants: { userId, name, avatar }[]` (yalnızca userId) |         |                          |
| S→C | `video_update`  | `videoProvider`, `videoId`, `videoTitle`, `videoDuration`    |         |                          |

---

## 5. Veritabanı Şeması (PostgreSQL)

```sql
-- users (kalıcı veri)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- sessions (cache data - UNLOGGED)
CREATE UNLOGGED TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  host_id UUID NOT NULL, -- Foreign key constraint kaldırıldı UNLOGGED için
  video_provider VARCHAR(50),
  video_id VARCHAR(255),
  video_title VARCHAR(500),
  video_duration INTEGER DEFAULT 0,
  last_action VARCHAR(20) DEFAULT 'pause',
  last_action_time_as_second INTEGER DEFAULT 0,
  last_action_timestamp TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- session_participants (cache data - UNLOGGED)
CREATE UNLOGGED TABLE session_participants (
  session_id UUID NOT NULL, -- Foreign key constraint kaldırıldı UNLOGGED için
  user_id UUID NOT NULL, -- Foreign key constraint kaldırıldı UNLOGGED için
  joined_at TIMESTAMP DEFAULT NOW(),
  is_online BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);
```

**Önemli Notlar:**
- `sessions` ve `session_participants` tabloları **UNLOGGED** olarak tanımlandı çünkü bunlar cache verisidir
- UNLOGGED tablolar foreign key constraint'leri desteklemediği için direkt referanslar kaldırıldı
- Participants bilgisi Session modelinde otomatik olarak dahil edilir
- Leave session işleminde participant sayısı 0'a düştüğünde session otomatik deaktif edilir
- Host ayrıldığında ve başka participants varsa ilk participant yeni host olur

---

## 6. Vue 3 + Pinia Katmanı

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false,
    loading: false
  }),
  actions: {
    loginWithGoogle() {},
    logout() {},
    fetchUser() {}
  }
});

// stores/sessions.ts
export const useSessionsStore = defineStore('sessions', {
  state: () => ({
    sessions: [] as Session[],
    currentSession: null as Session | null,
    participants: [] as SessionParticipant[],
    isHost: false,
    loading: false
  }),
  actions: {
    fetchSessions() {},
    createSession() {},
    joinSession() {},
    leaveSession() {},
    setSessionVideo() {},
    updateParticipants() {}
  }
});

// stores/videoSync.ts
export const useVideoSyncStore = defineStore('videoSync', {
  state: () => ({
    currentAction: 'pause' as VideoAction,
    currentTime: 0,
    lastActionTimestamp: null as Date | null
  }),
  actions: {
    syncVideo() {},
    calculateCurrentTime() {}
  }
});
```

---

## 7. Docker PostgreSQL Kurulumu

Geliştirme ortamında PostgreSQL Docker konteynerinde çalıştırılacaktır:

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: videosync
      POSTGRES_USER: videosync_user
      POSTGRES_PASSWORD: videosync_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

volumes:
  postgres_data:
```

**Kullanım:**
```bash
# Veritabanını başlatma
docker-compose up -d postgres

# Veritabanına bağlanma
docker exec -it sync-watch-app-3_postgres_1 psql -U videosync_user -d videosync

# Veritabanını durdurma
docker-compose down
```

---

## 8. Ortam Değişkenleri

```
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

---

## 9. Hata Yanıt Sözleşmesi

| HTTP Kodu | `error`             | `message`                                     |
| --------- | ------------------- | --------------------------------------------- |
| 400       | `invalid_video_id`  | YouTube video not found or private            |
| 400       | `invalid_input`     | Required fields missing or invalid format     |
| 403       | `not_session_host`  | Only session host can perform this action     |
| 403       | `unauthorized`      | User not authorized for this action           |
| 404       | `session_not_found` | Session does not exist or is no longer active |
| 404       | `user_not_found`    | User does not exist                           |
| 500       | `session_create_error` | Failed to create session                   |
| 500       | `session_join_error`   | Failed to join session                     |

---

## 10. Test Senaryoları

### Playwright Test Yapısı (güncel)

Tüm uçtan-uca senaryolar `web/tests/` altında tutulur ve **gerçek backend + PostgreSQL** üzerinde, **misafir kullanıcı** (guest login) akışlarıyla çalışır.

Aktif test dosyaları:

| Dosya | Senaryo | Durum |
|-------|---------|-------|
| `auth.spec.ts` | Misafir login → cookie mevcut mu? → logout & cookie temiz mi? | ✅ Geçer |
| `session.spec.ts` | Misafir login → yeni oturum oluştur → katılımcı listesi | ✅ Geçer |
| `session-multi.spec.ts` | 2 ayrı browser context'i ile aynı oturuma katılma → katılımcı sayısı senkronizasyonu → 1 kullanıcının ayrılması | ✅ Geçer |
| `video-sync.spec.ts` | Video yükle / play / pause akışı (ileride) | ⏭️ `skip` |

Konfigürasyon özet (`web/playwright.config.ts`):

* **Tek worker & sıra sıra** (`workers: 1`, `fullyParallel: false`)
* **Fail-fast** (`maxFailures: 1`)
* **HTML raporu** (`open: 'never'`)
* **Global health-check**: Testler başlamadan önce backend'e ping atar (`globalSetup`)
* **webServer**: `VITE_ENABLE_GUEST_LOGIN=true npm run dev` komutu otomatik çalışır

#### Çalıştırma

```bash
# Docker stack (postgres + backend) çalışır durumda olmalı
npm run docker:stack:up

# Ayrı terminalde (veya CI'de) testleri çalıştırın
cd web
npx playwright test         # veya npm run test
```

HTML raporu `web/playwright-report/` dizininde oluşur. Görüntüleme:

```bash
npx playwright show-report
```

---

## 11. Monorepo Klasör Yerleşimi (yalnızca klasörler + açıklamalar)

```
packages/                       # Ortak bağımlılıklar (paylaşılan tipler, eslint-konfig vb.)
└─ shared-types/                # Backend ve frontend arasında paylaşılan TS tipleri

backend/                        # Node.js Fastify API & WebSocket sunucusu
└─ src/
   ├─ config/                   # Ortam değişkenleri ve uygulama ayarları
   ├─ controllers/              # HTTP isteklerini karşılayan controller katmanı
   ├─ routes/                   # Fastify route tanımları ve plugin'ler
   ├─ services/                 # Use‑case / iş kuralları mantığı
   ├─ models/                   # Domain modelleri & ORM (Prisma/TypeORM) şemaları
   ├─ websocket/                # WebSocket gateway ve event handler'ları
   ├─ utils/                    # Ortak yardımcı fonksiyonlar
   └─ types/                    # Backend'e özel tip tanımları

web/                            # Vue 3 + Vite SPA (Shadcn UI tasarım kiti)
└─ src/
   ├─ assets/                   # Statik varlıklar (ikon, görsel, font)
   ├─ components/               # UI bileşenleri (atomic design yaklaşımı)
   ├─ composables/              # Reusable Composition API hooks (`useX` kalıbı)
   ├─ stores/                   # Pinia global state tanımları
   ├─ views/                    # Route'a bağlı sayfa bileşenleri
   ├─ router/                   # Vue Router konfigürasyonu
   ├─ utils/                    # Front‑end yardımcı fonksiyonlar
   └─ types/                    # Frontend'e özel tip tanımları
```

> **Not**: `packages/` dizini isteğe bağlıdır ancak uzun vadede paylaşılan kodu tek yerde toplamak (örn. tipler, lint kuralları) monorepo bakımını kolaylaştırır.