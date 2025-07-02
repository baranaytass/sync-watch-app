#!/bin/bash

# 🎬 Real Video Sync E2E Test Runner
# Bu script Docker'da backend + frontend + test'leri çalıştırır

echo "🎬 Real Video Sync E2E Test Runner"
echo "=" $(printf '=%.0s' {1..50})
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔹 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up Docker containers..."
    docker-compose down > /dev/null 2>&1
    print_success "Cleanup completed"
}

# Set trap for cleanup on script exit
trap cleanup EXIT

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Stopping any existing containers..."
docker-compose down > /dev/null 2>&1

print_status "Building all services (postgres, backend, frontend, test-runner)..."
docker-compose build postgres backend frontend test-runner

if [ $? -ne 0 ]; then
    print_error "Failed to build Docker images"
    exit 1
fi

print_success "All Docker images built successfully"

print_status "Starting PostgreSQL database..."
docker-compose up -d postgres

print_status "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is healthy
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U videosync_user -d videosync > /dev/null 2>&1; then
        print_success "PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "PostgreSQL failed to start"
        exit 1
    fi
    sleep 1
done

print_status "Starting backend service..."
docker-compose up -d backend

print_status "Waiting for backend to be healthy..."
sleep 10

# Check backend health
for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Backend is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend failed to start"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

print_status "Starting frontend service..."
docker-compose up -d frontend

print_status "Waiting for frontend to be healthy..."
sleep 10

# Check frontend health
for i in {1..30}; do
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        print_success "Frontend is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Frontend failed to start"
        docker-compose logs frontend
        exit 1
    fi
    sleep 2
done

print_success "All services are ready!"
echo ""
print_status "Services Status:"
print_success "✅ PostgreSQL: http://localhost:5432"
print_success "✅ Backend API: http://localhost:3000"
print_success "✅ Frontend: http://localhost:5173"
echo ""
print_status "Starting Real Video Sync E2E Test..."
echo ""

# Run the test with profile
docker-compose --profile testing up --abort-on-container-exit test-runner

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "🎉 E2E Test PASSED! 🎉"
    print_success "Two users successfully synced video playback"
    print_success "WebSocket real-time communication verified"
    print_success "Session management working correctly"
else
    print_error "💥 E2E Test FAILED!"
    print_warning "Check the logs above for error details"
fi

echo ""
print_status "Test completed. Services will be cleaned up automatically."

exit $TEST_EXIT_CODE 