# Manual Render Deployment Steps

## 🎯 Completed Actions:
1. ✅ Yeni PostgreSQL database oluşturuldu (Frankfurt region)
2. ✅ Database schema dosyası hazırlandı: `setup_new_database.sql`
3. ✅ render.yaml dosyası güncellendi (Frankfurt region + yeni database)

## 🛠️ Manual Steps Required:

### Step 1: Setup New Database Schema
```bash
# Run this to setup database tables:
render psql dpg-d2peglndiees73bt5lv0-a

# Then execute the SQL from setup_new_database.sql file
# Or run this directly:
\i setup_new_database.sql
```

### Step 2: Update Backend Service Environment Variable (Dashboard Method)
1. Go to: https://dashboard.render.com/web/srv-d2348nngi27c73fikgjg
2. Click "Environment" tab
3. Update `DATABASE_URL` to: 
   ```
   postgresql://stay_sync_user:AFMgTRk9pSla15phS7T4vUUCfeX5UbgL@dpg-d2peglndiees73bt5lv0-a/stay_sync
   ```
4. Click "Save Changes"
5. Service will auto-redeploy

### Step 3: Create New Backend Service in Frankfurt Region
Since region migration isn't possible for existing service, create new service:

1. Go to Render Dashboard
2. Click "New" -> "Web Service" 
3. Connect GitHub repo: `baranaytass/sync-watch-app`
4. Settings:
   - **Name:** sync-watch-backend-frankfurt
   - **Region:** Frankfurt
   - **Branch:** development
   - **Build Command:** (default)
   - **Start Command:** (default)
   - **Dockerfile Path:** ./backend/Dockerfile

5. Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   HOST=0.0.0.0
   DATABASE_URL=postgresql://stay_sync_user:AFMgTRk9pSla15phS7T4vUUCfeX5UbgL@dpg-d2peglndiees73bt5lv0-a/stay_sync
   JWT_SECRET=(generate new)
   GOOGLE_CLIENT_ID=(existing value)
   GOOGLE_CLIENT_SECRET=(existing value)
   YOUTUBE_API_KEY=AIzaSyBGaoo7O9ABniAuWcm62T8ZKcH9D3mN8M4
   FRONTEND_URL=https://staysync.baranaytas.com
   ```

### Step 4: Update Frontend Environment Variable
1. Go to Frontend service settings
2. Update `VITE_API_URL` to new Frankfurt backend URL
3. Or keep using custom domain mapping

## 🔍 Expected Results:
- Database: ✅ Available (Frankfurt)
- Backend: 🔄 New service in Frankfurt region
- Frontend: ✅ Deployed (Global)

## 🧪 Testing:
After deployment, test:
1. Guest login functionality
2. Session creation
3. Video sync between multiple users
4. WebSocket real-time communication

## 📋 Current Render.yaml Configuration:
- Database connection updated
- Frankfurt region specified
- Environment variables configured
- Custom domain URLs updated