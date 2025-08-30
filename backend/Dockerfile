# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS build

# Set up environment
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install Python, Make, and G++ for native dependencies
RUN apk add --no-cache python3 make g++ curl

# Install pnpm
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /app

# --- Bağımlılıkları yükle ---
# Monorepo yapısı için root context'den build edilmelidir

# Kök ve workspace package.json dosyaları kopyala
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY packages/shared-types/package*.json ./packages/shared-types/

# Build için dev dependencies dahil tüm bağımlılıkları kur
RUN npm install --workspaces --include-workspace-root

# --- Kaynak kodunu kopyala ---
COPY packages/shared-types ./packages/shared-types
COPY backend ./backend

# --- Build işlemi ---
# Shared types ve backend kodunu derle
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=backend

# Build sonrası gereksiz dosyaları temizle ve production dependencies'e geç
RUN rm -rf packages/shared-types/src backend/src node_modules
RUN npm install --workspaces --include-workspace-root --omit=dev

# Uygulama portu (Render otomatik 10000 kullanır)
EXPOSE 10000

# Set working directory for backend
WORKDIR /app/backend

# Command to run the application
CMD ["node", "dist/server.js"] 