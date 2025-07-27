FROM node:18-alpine

# Çalışma dizini
WORKDIR /app

# --- Bağımlılıkları yükle ---
# Monorepo yapısı için root context'den build edilmelidir

# Kök ve workspace package.json dosyaları kopyala
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY packages/shared-types/package*.json ./packages/shared-types/

# Build için dev dependencies dahil tüm bağımlılıkları kur
RUN npm ci --workspaces --include-workspace-root

# --- Kaynak kodunu kopyala ---
COPY packages/shared-types ./packages/shared-types
COPY backend ./backend

# --- Build işlemi ---
# Shared types ve backend kodunu derle
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=backend

# Build sonrası gereksiz dosyaları temizle ve production dependencies'e geç
RUN rm -rf packages/shared-types/src backend/src node_modules
RUN npm ci --workspaces --include-workspace-root --omit=dev

# Uygulama portu (Render otomatik 10000 kullanır)
EXPOSE 10000

# Backend server'ını başlat
CMD ["node", "backend/dist/server.js"] 