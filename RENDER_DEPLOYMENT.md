# Render Deployment Guide

Bu rehber Sync Watch App'i Render platformunda deploy etmek için gereken adımları içerir.

## 🚀 Hızlı Deployment

### 1. Render Hesabı
- [Render.com](https://render.com) hesabınızı oluşturun
- GitHub hesabınızı bağlayın

### 2. Blueprint ile Deploy
1. Render Dashboard'a gidin
2. "New" → "Blueprint" seçin  
3. GitHub repository'nizi seçin
4. `render-blueprint.yaml` dosyasını bulun
5. "Apply" butonuna tıklayın

### 3. Environment Variables
Deployment sırasında şu environment variable'ları ekleyin:

#### Backend Service:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret  
YOUTUBE_API_KEY=your_youtube_api_key
```

#### Frontend Service:
```
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```

## 📋 Manuel Deployment

### 1. PostgreSQL Database
- **Service Type**: Private Service
- **Docker Image**: Custom (./database/Dockerfile)
- **Plan**: Free
- **Environment Variables**:
  - `POSTGRES_DB=videosync`
  - `POSTGRES_USER=videosync_user`
  - `POSTGRES_PASSWORD=[Generated]`

### 2. Backend API
- **Service Type**: Web Service
- **Docker Image**: Custom (./backend/Dockerfile)  
- **Plan**: Free
- **Health Check**: `/health`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `HOST=0.0.0.0`
  - `DATABASE_URL=[From Database]`
  - `JWT_SECRET=[Generated]`
  - `FRONTEND_URL=https://sync-watch-frontend.onrender.com`
  - Your API keys...

### 3. Frontend
- **Service Type**: Static Site
- **Build Command**: `npm ci && npm run build:web`
- **Publish Directory**: `./web/dist`
- **Environment Variables**:
  - `VITE_API_URL=https://sync-watch-backend.onrender.com`
  - `VITE_ENABLE_GUEST_LOGIN=true`
  - Your API keys...

## 🔧 Services

| Service | URL | Type | Plan |
|---------|-----|------|------|
| Frontend | `https://sync-watch-frontend.onrender.com` | Static Site | Free |
| Backend | `https://sync-watch-backend.onrender.com` | Web Service | Free |
| Database | Internal | Private Service | Free |

## 💡 İpuçları

- **Free Plan**: 750 saat/ay, sleep after 15 min inactivity
- **Cold Start**: İlk request ~30 saniye sürebilir
- **Database**: PostgreSQL otomatik backup
- **Logs**: Render dashboard'da real-time logs
- **Auto Deploy**: Git push ile otomatik deployment

## 🐛 Troubleshooting

### Database Connection
```bash
# Backend logs'da connection string kontrol edin
DATABASE_URL=postgresql://user:pass@hostname:port/dbname
```

### Build Failures  
```bash
# Workspace build sırası önemli
npm run build --workspace=packages/shared-types
npm run build --workspace=backend
npm run build --workspace=web
```

### Environment Variables
- Render'da env var'lar deploy sonrası da değiştirilebilir
- Sensitive data için "Generate Value" kullanın
- API key'leri manuel olarak ekleyin

## 📊 Monitoring

- **Health Checks**: `/health` endpoint
- **Logs**: Render dashboard  
- **Metrics**: Request/response times
- **Alerts**: Email notifications

## 🔄 CI/CD

Git repository'ye push yaptığınızda:
1. Render otomatik build başlatır
2. Docker image'lar build edilir  
3. Services restart edilir
4. Health check'ler çalışır
5. Deploy tamamlanır

**Deploy süresi**: ~5-10 dakika