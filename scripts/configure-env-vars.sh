#!/bin/bash

# Configure Azure App Services with Environment Variables from Local .env files
# This script reads local .env files and configures Azure App Services

set -e

# Configuration
RESOURCE_GROUP="sync-watch-rg"
BACKEND_APP="sync-watch-api"
FRONTEND_APP="sync-watch-web"

echo "🔧 Configuring Azure App Services with Environment Variables"
echo "=========================================================="

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Check if backend .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found at backend/.env"
    exit 1
fi

# Check if web .env files exist
if [ ! -f "web/.env" ] && [ ! -f "web/.env.development" ]; then
    echo "❌ Web .env files not found. Need web/.env or web/.env.development"
    exit 1
fi

echo "📋 Reading environment variables from local files..."

# Read backend environment variables
echo "🔧 Configuring Backend App: $BACKEND_APP"

# Extract values from backend/.env
DATABASE_URL=$(grep "^DATABASE_URL=" backend/.env | cut -d'=' -f2- | tr -d '"')
JWT_SECRET=$(grep "^JWT_SECRET=" backend/.env | cut -d'=' -f2- | tr -d '"')
GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" backend/.env | cut -d'=' -f2- | tr -d '"')
GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" backend/.env | cut -d'=' -f2- | tr -d '"')
YOUTUBE_API_KEY=$(grep "^YOUTUBE_API_KEY=" backend/.env | cut -d'=' -f2- | tr -d '"')

# Convert local database URL to Azure PostgreSQL URL (if using Azure DB)
# If using local DB, we'll need to update this later
if [[ $DATABASE_URL == *"localhost"* ]]; then
    echo "⚠️  WARNING: Database URL points to localhost. Will need Azure PostgreSQL URL."
    AZURE_DB_URL="postgresql://videosync_user:CHANGE_PASSWORD@sync-watch-db-server.postgres.database.azure.com:5432/videosync?sslmode=require"
    echo "💡 Suggested Azure DB URL: $AZURE_DB_URL"
    DATABASE_URL=$AZURE_DB_URL
fi

# Configure Backend App Settings
echo "📝 Setting backend environment variables..."
az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    DATABASE_URL="$DATABASE_URL" \
    JWT_SECRET="$JWT_SECRET" \
    GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
    GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
    YOUTUBE_API_KEY="$YOUTUBE_API_KEY" \
    FRONTEND_URL="https://$FRONTEND_APP.azurewebsites.net" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
  || echo "❌ Failed to configure backend app settings"

echo "✅ Backend environment variables configured"

# Configure Frontend App Settings
echo "🔧 Configuring Frontend App: $FRONTEND_APP"

# Read frontend environment variables
VITE_API_URL="https://$BACKEND_APP.azurewebsites.net"
VITE_ENABLE_GUEST_LOGIN="true"

# Check if YouTube API key is in web env files
WEB_YOUTUBE_KEY=""
if [ -f "web/.env" ]; then
    WEB_YOUTUBE_KEY=$(grep "^VITE_YOUTUBE_API_KEY=" web/.env | cut -d'=' -f2- | tr -d '"' || echo "")
fi

if [ -z "$WEB_YOUTUBE_KEY" ] && [ -f "web/.env.development" ]; then
    WEB_YOUTUBE_KEY=$(grep "^VITE_YOUTUBE_API_KEY=" web/.env.development | cut -d'=' -f2- | tr -d '"' || echo "")
fi

# Use backend YouTube key if web doesn't have one
if [ -z "$WEB_YOUTUBE_KEY" ]; then
    WEB_YOUTUBE_KEY="$YOUTUBE_API_KEY"
fi

echo "📝 Setting frontend environment variables..."
az webapp config appsettings set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    VITE_API_URL="$VITE_API_URL" \
    VITE_ENABLE_GUEST_LOGIN="$VITE_ENABLE_GUEST_LOGIN" \
    VITE_YOUTUBE_API_KEY="$WEB_YOUTUBE_KEY" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
  || echo "❌ Failed to configure frontend app settings"

echo "✅ Frontend environment variables configured"

# Display configuration summary
echo ""
echo "📊 Configuration Summary"
echo "======================="
echo "Backend App: $BACKEND_APP"
echo "  - NODE_ENV: production"
echo "  - DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "  - JWT_SECRET: ${JWT_SECRET:0:20}..."
echo "  - GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:30}..."
echo "  - YOUTUBE_API_KEY: ${YOUTUBE_API_KEY:0:20}..."
echo "  - FRONTEND_URL: https://$FRONTEND_APP.azurewebsites.net"
echo ""
echo "Frontend App: $FRONTEND_APP"
echo "  - VITE_API_URL: $VITE_API_URL"
echo "  - VITE_ENABLE_GUEST_LOGIN: $VITE_ENABLE_GUEST_LOGIN"
echo "  - VITE_YOUTUBE_API_KEY: ${WEB_YOUTUBE_KEY:0:20}..."
echo ""

# Test app service URLs
echo "🔍 Testing App Service URLs..."
echo "Backend URL: https://$BACKEND_APP.azurewebsites.net"
echo "Frontend URL: https://$FRONTEND_APP.azurewebsites.net"

# Check if apps are running
echo ""
echo "🚀 Checking App Service Status..."
BACKEND_STATUS=$(az webapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP --query "state" --output tsv 2>/dev/null || echo "NOT_FOUND")
FRONTEND_STATUS=$(az webapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP --query "state" --output tsv 2>/dev/null || echo "NOT_FOUND")

echo "Backend Status: $BACKEND_STATUS"
echo "Frontend Status: $FRONTEND_STATUS"

if [ "$BACKEND_STATUS" = "NOT_FOUND" ] || [ "$FRONTEND_STATUS" = "NOT_FOUND" ]; then
    echo ""
    echo "⚠️  Some App Services not found. You may need to create Azure resources first:"
    echo "   ./scripts/azure-setup.sh"
    echo ""
fi

echo "✅ Environment variables configuration completed!"
echo ""
echo "🔗 Access URLs:"
echo "   Backend:  https://$BACKEND_APP.azurewebsites.net/health"
echo "   Frontend: https://$FRONTEND_APP.azurewebsites.net"