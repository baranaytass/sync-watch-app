# Use an official Node.js runtime as a parent image
FROM node:18-alpine as build

# Set up environment
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install Python, Make, and G++ for native dependencies
RUN apk add --no-cache python3 make g++ curl

# Install pnpm
RUN npm install -g pnpm

# Set the working directory in the container
WORKDIR /app

# Copy configuration files first to leverage Docker cache
COPY .npmrc ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY backend/package.json ./backend/
COPY backend/tsconfig.json ./backend/

# Install all dependencies, including devDependencies, based on lockfile
RUN pnpm install --frozen-lockfile --dev

# Copy the rest of the source code ONLY AFTER installing dependencies
COPY . .

# Build the backend by calling tsc directly from the root node_modules
RUN /app/node_modules/.bin/tsc --project backend/tsconfig.json

# Prune development dependencies for production
RUN pnpm --filter @sync-watch-app/backend deploy --legacy --prod /prod

# --- Production Stage ---
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy production dependencies and build output from the build stage
COPY --from=build /prod/backend/package.json .
COPY --from=build /prod/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/server.js"] 