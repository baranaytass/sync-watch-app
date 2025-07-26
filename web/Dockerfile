# Stage 1: Build the Vue application using pnpm
FROM node:18-alpine AS build

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy configuration files first to leverage Docker cache
COPY .npmrc ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY web/package.json ./web/

# Install all dependencies based on lockfile
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code ONLY AFTER installing dependencies
COPY . .

# Build the frontend by calling Vite from the root node_modules
RUN /app/node_modules/.bin/vite build --outDir web/dist

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine

# Copy the nginx configuration
COPY --from=build /app/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built files from the build stage
COPY --from=build /app/web/dist /usr/share/nginx/html

# Expose port 80 and start nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 