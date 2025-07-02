FROM node:18-alpine

# Install dependencies for native modules and curl for health check
RUN apk add --no-cache python3 make g++ curl

# Set working directory
WORKDIR /app

# Copy root package.json first for monorepo context
COPY package*.json ./

# Copy shared-types package
COPY packages/shared-types ./packages/shared-types

# Copy backend package files
COPY backend/package*.json ./backend/
WORKDIR /app/backend

# Install backend dependencies
RUN npm install

# Go back to root and build shared-types first
WORKDIR /app/packages/shared-types
RUN npm install && npm run build

# Go back to backend and copy source
WORKDIR /app/backend
COPY backend/ .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"] 