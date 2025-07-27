#!/bin/bash

# Azure Quick Deploy Script
# Creates Azure resources and configures environment variables in one go

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
RESOURCE_GROUP="sync-watch-rg"
LOCATION="West Europe"
APP_SERVICE_PLAN="sync-watch-plan"
BACKEND_APP="sync-watch-api"
FRONTEND_APP="sync-watch-web"
DB_SERVER="sync-watch-db-server"
DB_NAME="videosync"
DB_USER="videosync_user"
DB_PASSWORD="SyncWatch2024!"

echo "🚀 Azure Quick Deploy for Sync Watch App"
echo "========================================"

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v az &> /dev/null; then
    print_error "Azure CLI not installed"
    exit 1
fi

if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure. Please run 'az login' first"
    exit 1
fi

if [ ! -f "backend/.env" ]; then
    print_error "Backend .env file not found"
    exit 1
fi

print_success "Prerequisites check passed"

# Get Azure info
SUBSCRIPTION_ID=$(az account show --query id --output tsv)
SUBSCRIPTION_NAME=$(az account show --query name --output tsv)
print_status "Using subscription: $SUBSCRIPTION_NAME"

# Create Resource Group
print_status "Creating Resource Group: $RESOURCE_GROUP"
az group create \
  --name $RESOURCE_GROUP \
  --location "$LOCATION" \
  --tags project="sync-watch-app" environment="production" \
  || print_warning "Resource group may already exist"

# Create App Service Plan (Basic tier - more reliable than Free)
print_status "Creating App Service Plan: $APP_SERVICE_PLAN"
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku B1 \
  --is-linux \
  || print_warning "App Service Plan may already exist"

# Create Backend Web App
print_status "Creating Backend App: $BACKEND_APP"
az webapp create \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:20-lts" \
  || print_warning "Backend app may already exist"

# Create Frontend Web App  
print_status "Creating Frontend App: $FRONTEND_APP"
az webapp create \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:20-lts" \
  || print_warning "Frontend app may already exist"

# For this demo, we'll use a simpler database approach
# PostgreSQL Flexible Server requires paid tier, so we'll configure for external DB or local development
print_warning "Database: Using environment variable configuration for external PostgreSQL"
print_warning "You can set up Azure PostgreSQL separately or use an external database service"

# Read environment variables from local files
print_status "Reading local environment variables..."

# Backend env vars
JWT_SECRET=$(grep "^JWT_SECRET=" backend/.env | cut -d'=' -f2- | tr -d '"')
GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" backend/.env | cut -d'=' -f2- | tr -d '"')
GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" backend/.env | cut -d'=' -f2- | tr -d '"')
YOUTUBE_API_KEY=$(grep "^YOUTUBE_API_KEY=" backend/.env | cut -d'=' -f2- | tr -d '"')

# Use a placeholder database URL that can be updated later
DATABASE_URL="postgresql://user:password@your-db-host:5432/videosync"

print_status "Configuring Backend App Settings..."
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
    WEBSITES_NODE_DEFAULT_VERSION="~18" \
    --output none

print_status "Configuring Frontend App Settings..."
az webapp config appsettings set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    VITE_API_URL="https://$BACKEND_APP.azurewebsites.net" \
    VITE_ENABLE_GUEST_LOGIN="true" \
    VITE_YOUTUBE_API_KEY="$YOUTUBE_API_KEY" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
    WEBSITES_NODE_DEFAULT_VERSION="~18" \
    --output none

# Enable logging
print_status "Enabling application logging..."
az webapp log config \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information \
  --output none

az webapp log config \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information \
  --output none

# Test URLs
print_status "Testing App Service URLs..."
BACKEND_URL="https://$BACKEND_APP.azurewebsites.net"
FRONTEND_URL="https://$FRONTEND_APP.azurewebsites.net"

print_success "Azure resources created successfully!"

echo ""
echo "📊 Deployment Summary"
echo "===================="
echo "Resource Group: $RESOURCE_GROUP"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "🔗 Quick Test Commands:"
echo "curl -I $BACKEND_URL"
echo "curl -I $FRONTEND_URL"
echo ""
echo "⚠️  Important Next Steps:"
echo "1. Update DATABASE_URL in Azure Backend App Settings with real database"
echo "2. Deploy your code using GitHub Actions or manual deployment"
echo "3. Test the applications"
echo ""
echo "💡 To deploy code manually:"
echo "   - Go to Azure Portal > App Services > $BACKEND_APP > Deployment Center"
echo "   - Set up GitHub integration or use local Git deployment"

# Create a summary file
cat > azure-deployment-info.txt << EOF
Sync Watch App - Azure Deployment Info
=====================================

Created: $(date)

Resource Group: $RESOURCE_GROUP
Location: $LOCATION

Applications:
- Backend: $BACKEND_URL
- Frontend: $FRONTEND_URL

App Service Plan: $APP_SERVICE_PLAN (Free F1 tier)

Environment Variables Configured:
✅ Backend: NODE_ENV, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, YOUTUBE_API_KEY
✅ Frontend: VITE_API_URL, VITE_ENABLE_GUEST_LOGIN, VITE_YOUTUBE_API_KEY

Next Steps:
1. Update DATABASE_URL with real database connection
2. Deploy application code
3. Test functionality

Azure Portal Links:
- Resource Group: https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP
- Backend App: https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$BACKEND_APP
- Frontend App: https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$FRONTEND_APP
EOF

print_success "Deployment info saved to: azure-deployment-info.txt"