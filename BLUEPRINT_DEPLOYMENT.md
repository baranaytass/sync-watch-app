# 🚀 StaySync Blueprint Deployment Guide

## Overview
This guide uses Render Blueprint (`render.yaml`) to deploy StaySync with all services configured automatically.

## ✅ Prerequisites Completed:
1. ✅ Database schema deployed to Frankfurt PostgreSQL instance (dpg-d2peglndiees73bt5lv0-a)
2. ✅ Git repository on main branch with production-ready code
3. ✅ Blueprint configuration prepared with security best practices

## 🛠️ Blueprint Deployment Steps:

### Step 1: Deploy via Render Dashboard

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New" → "Blueprint"**
3. **Connect Repository**: `https://github.com/baranaytass/sync-watch-app`
4. **Select Branch**: `main`
5. **Blueprint File**: `render.yaml` (auto-detected)
6. **Click "Apply"**

### Step 2: Configure Environment Variables (Manual)

After blueprint deployment, set these environment variables via dashboard:

#### Backend Service (`staysync-backend`):
```
DATABASE_URL=postgresql://stay_sync_user:AFMgTRk9pSla15phS7T4vUUCfeX5UbgL@dpg-d2peglndiees73bt5lv0-a.frankfurt-postgres.render.com/stay_sync
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
YOUTUBE_API_KEY=AIzaSyBGaoo7O9ABniAuWcm62T8ZKcH9D3mN8M4
```

#### Frontend Service (`staysync-frontend`):
```
VITE_YOUTUBE_API_KEY=AIzaSyBGaoo7O9ABniAuWcm62T8ZKcH9D3mN8M4
```

### Step 3: Custom Domain Configuration

1. **Backend Custom Domain**:
   - Go to `staysync-backend` service settings
   - Add custom domain: `staysync-api.baranaytas.com`

2. **Frontend Custom Domain**:
   - Go to `staysync-frontend` service settings  
   - Add custom domain: `staysync.baranaytas.com`

## 🎯 Blueprint Features:

### Automatic Configuration:
- ✅ **Auto-Deploy**: Enabled for main branch
- ✅ **Docker Runtime**: Backend with Dockerfile
- ✅ **Static Site**: Frontend with npm build
- ✅ **Frankfurt Region**: Backend in EU
- ✅ **Global CDN**: Frontend worldwide
- ✅ **Health Checks**: `/api/health` endpoint monitoring
- ✅ **Environment Variables**: Pre-configured (except secrets)

### Security Best Practices:
- 🔒 **No Hardcoded Secrets**: All sensitive data via `sync: false`
- 🔒 **JWT Auto-Generation**: Secure random JWT secret
- 🔒 **External Database**: Uses existing secure instance
- 🔒 **HTTPS Only**: Automatic SSL/TLS termination

## 🧪 Testing Deployment:

```bash
# 1. Check backend health
curl https://staysync-api.baranaytas.com/api/health

# 2. Test frontend loading  
curl -I https://staysync.baranaytas.com

# 3. Test database connection (from backend logs)
render logs staysync-backend --tail

# 4. End-to-end functionality test
# Visit https://staysync.baranaytas.com
# - Create guest account
# - Create session  
# - Test video sync
```

## 📊 Expected Services After Blueprint:

| Service | Type | Region | Auto-Deploy | Status |
|---------|------|---------|------------|---------|
| `staysync-backend` | Web Service | Frankfurt | ✅ | 🔄 Building |
| `staysync-frontend` | Static Site | Global | ✅ | 🔄 Building |

## 🔧 Blueprint Configuration Details:

### Backend Service:
- **Runtime**: Docker (./backend/Dockerfile)
- **Plan**: Free tier
- **Region**: Frankfurt (EU)
- **Health Check**: /api/health
- **Auto-scaling**: Enabled

### Frontend Service:  
- **Runtime**: Static site
- **Build**: npm ci + workspace builds
- **Plan**: Free tier (global CDN)
- **Static Path**: ./web/dist

## ⚠️ Important Notes:

1. **Environment Variables**: Must be set manually after blueprint deployment for security
2. **Database**: Uses existing Frankfurt instance - no new database created
3. **Custom Domains**: Require manual DNS configuration
4. **SSL/TLS**: Automatically provided by Render
5. **Auto-Deploy**: Triggers on every push to main branch

## 🚨 Post-Deployment Checklist:

- [ ] Backend service deployed and healthy
- [ ] Frontend service deployed and accessible
- [ ] Environment variables configured
- [ ] Custom domains added and DNS configured  
- [ ] Database connection verified
- [ ] End-to-end functionality tested
- [ ] Auto-deploy confirmed working

---

**Blueprint deployment provides automatic infrastructure setup with manual security configuration for production-ready StaySync deployment!** 🚀