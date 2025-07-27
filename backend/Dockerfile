FROM node:18-alpine

# Çalışma dizini
WORKDIR /app

# --- Bağımlılıkları yükle ---
# Monorepo kullandığımız için kök package.json ve backend/package.json dosyalarını kopyalayıp
# yalnızca production bağımlılıklarını kuruyoruz. shared-types paketi de backend'in bağımlılığıdır.

# Kök ve workspace package.json dosyaları
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY packages/shared-types/package*.json ./packages/shared-types/

# Production modda gerekli bağımlılıkları kur
RUN npm install --workspaces --include-workspace-root

# --- Kaynak kodunu kopyala ve derle ---
COPY . .

# Shared types ve backend kodunu derle
RUN npm run build --workspace=packages/shared-types && npm run build --workspace=backend

# Uygulama portu (Render 10000 port kullanır)
EXPOSE 10000

# Backend server'ını başlat
CMD ["node", "backend/dist/server.js"] 