# 🚀 StaySync Production Deployment Guide

## ✅ Completed Steps:
1. ✅ Development branch merged to main (22 commits)
2. ✅ Database schema deployed to Frankfurt PostgreSQL instance
3. ✅ Production configuration ready in render.yaml
4. ✅ Git repository updated with production settings

## 🛠️ Manual Deployment Steps Required:

### Step 1: Clean Up Old Services (Optional)
If you want to remove old services first:
```bash
# Via Render Dashboard:
# 1. Go to https://dashboard.render.com
# 2. Delete "sync-watch-backend" service
# 3. Delete "sync-watch-frontend" service  
# 4. Delete old "videosync" database (if exists)
```

### Step 2: Create New StaySync Services

#### Backend Service Creation:
1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New" → "Web Service"**
3. **Connect Repository**: `https://github.com/baranaytass/sync-watch-app`
4. **Service Configuration**:
   - **Name**: `staysync-backend`
   - **Region**: `Frankfurt`
   - **Branch**: `main` (production)
   - **Build Command**: (auto-detected from Dockerfile)
   - **Start Command**: (auto-detected from Dockerfile)
   - **Docker File Path**: `./backend/Dockerfile`

5. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   HOST=0.0.0.0
   DATABASE_URL=postgresql://stay_sync_user:AFMgTRk9pSla15phS7T4vUUCfeX5UbgL@dpg-d2peglndiees73bt5lv0-a/stay_sync
   JWT_SECRET=(Generate → Auto-generate secure value)
   GOOGLE_CLIENT_ID=(Set your existing value)
   GOOGLE_CLIENT_SECRET=(Set your existing value)
   YOUTUBE_API_KEY=AIzaSyBGaoo7O9ABniAuWcm62T8ZKcH9D3mN8M4
   FRONTEND_URL=https://staysync.baranaytas.com
   ```

6. **Health Check Path**: `/api/health`
7. **Create Service**

#### Frontend Service Creation:
1. **Click "New" → "Static Site"**
2. **Connect Repository**: Same repo
3. **Service Configuration**:
   - **Name**: `staysync-frontend` 
   - **Branch**: `main`
   - **Build Command**: 
     ```
     VITE_API_URL=https://staysync-api.baranaytas.com VITE_ENABLE_GUEST_LOGIN=true npm ci && npm run build --workspace=packages/shared-types && npm run build --workspace=web
     ```
   - **Publish Directory**: `./web/dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://staysync-api.baranaytas.com
   VITE_ENABLE_GUEST_LOGIN=true
   VITE_YOUTUBE_API_KEY=AIzaSyBGaoo7O9ABniAuWcm62T8ZKcH9D3mN8M4
   ```

5. **Create Service**

### Step 3: Custom Domain Setup

#### Backend Domain:
1. **Go to Backend Service Settings**
2. **Custom Domains → Add Custom Domain**
3. **Add**: `staysync-api.baranaytas.com`
4. **Follow DNS setup instructions**

#### Frontend Domain:
1. **Go to Frontend Service Settings**  
2. **Custom Domains → Add Custom Domain**
3. **Add**: `staysync.baranaytas.com`
4. **Follow DNS setup instructions**

### Step 4: Auto-Deploy Configuration
1. **Backend Service → Settings → Auto-Deploy**: ON
2. **Frontend Service → Settings → Auto-Deploy**: ON  
3. **Branch**: `main`

## 🧪 Testing Deployment

After deployment, verify:

1. **Backend Health Check**: 
   ```bash
   curl https://staysync-api.baranaytas.com/api/health
   ```

2. **Frontend Loading**: 
   - Visit: https://staysync.baranaytas.com
   - Test guest login
   - Create session
   - Test video sync

3. **Database Connection**: 
   - Check backend logs for successful database connection
   - Test user registration/login

## 📊 Expected Results

- **Database**: ✅ PostgreSQL 17.6 in Frankfurt (dpg-d2peglndiees73bt5lv0-a)
- **Backend**: 🔄 New service in Frankfurt region  
- **Frontend**: 🔄 New static site with global CDN
- **Domains**: 🔄 Custom domains configured
- **Auto-Deploy**: ✅ Configured for main branch

## 🎯 Production Features

- ✅ **Multi-User Video Sync**: Echo prevention + mid-playback join
- ✅ **Authentication**: Guest + OAuth login systems
- ✅ **Real-time WebSocket**: Video synchronization
- ✅ **EU Hosting**: Frankfurt region for better latency
- ✅ **Custom Domains**: Professional branding
- ✅ **Auto-deployment**: CI/CD from main branch

## ⚠️ Important Notes

1. **Database Connection**: Uses production database - handle with care
2. **Environment Secrets**: Store sensitive values in Render dashboard
3. **SSL/TLS**: Render provides automatic HTTPS
4. **Monitoring**: Check service logs via Render dashboard
5. **Domain DNS**: May take up to 48 hours to propagate

---

**Ready for production deployment! 🚀 Follow the manual steps above to complete StaySync v1.0 deployment.**