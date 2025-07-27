#!/bin/bash

# Azure Deployment Setup Script for Sync Watch App
# This script creates Azure resources using free tier limits

set -e

# Configuration
RESOURCE_GROUP="sync-watch-rg"
LOCATION="East US"
APP_SERVICE_PLAN="sync-watch-plan"
BACKEND_APP="sync-watch-api"
FRONTEND_APP="sync-watch-web"
DB_SERVER="sync-watch-db-server"
DB_NAME="videosync"
DB_USER="videosync_user"
SUBSCRIPTION_ID=$(az account show --query id --output tsv)

echo "🚀 Starting Azure deployment setup for Sync Watch App"
echo "📍 Location: $LOCATION"
echo "🔑 Subscription ID: $SUBSCRIPTION_ID"

# Create Resource Group
echo "📦 Creating Resource Group: $RESOURCE_GROUP"
az group create \
  --name $RESOURCE_GROUP \
  --location "$LOCATION" \
  --tags project="sync-watch-app" environment="development" \
  || echo "Resource group may already exist"

# Create App Service Plan (Free tier)
echo "🏗️  Creating App Service Plan: $APP_SERVICE_PLAN"
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku F1 \
  --is-linux \
  --tags project="sync-watch-app" \
  || echo "App Service Plan may already exist"

# Create PostgreSQL Flexible Server (Free tier available in some regions)
echo "🗄️  Creating PostgreSQL Flexible Server: $DB_SERVER"
az postgres flexible-server create \
  --name $DB_SERVER \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --admin-user $DB_USER \
  --admin-password "$(openssl rand -base64 32)" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15 \
  --public-access 0.0.0.0 \
  --tags project="sync-watch-app" \
  || echo "PostgreSQL server may already exist"

# Create database
echo "🏗️  Creating database: $DB_NAME"
az postgres flexible-server db create \
  --server-name $DB_SERVER \
  --resource-group $RESOURCE_GROUP \
  --database-name $DB_NAME \
  || echo "Database may already exist"

# Create Backend Web App (Node.js)
echo "🔧 Creating Backend Web App: $BACKEND_APP"
az webapp create \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:18-lts" \
  --tags project="sync-watch-app" component="backend" \
  || echo "Backend app may already exist"

# Create Frontend Web App (Static Web App would be better, but using App Service for consistency)
echo "🎨 Creating Frontend Web App: $FRONTEND_APP"
az webapp create \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:18-lts" \
  --tags project="sync-watch-app" component="frontend" \
  || echo "Frontend app may already exist"

# Configure Backend App Settings
echo "⚙️  Configuring Backend App Settings"
DB_CONNECTION_STRING=$(az postgres flexible-server show-connection-string \
  --server-name $DB_SERVER \
  --database-name $DB_NAME \
  --admin-user $DB_USER \
  --admin-password 'Password123!' \
  --query connectionStrings.node \
  --output tsv)

az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    DATABASE_URL="$DB_CONNECTION_STRING" \
    JWT_SECRET="$(openssl rand -base64 32)" \
    FRONTEND_URL="https://$FRONTEND_APP.azurewebsites.net" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
    || echo "Backend app settings configuration failed"

# Configure Frontend App Settings
echo "⚙️  Configuring Frontend App Settings"
az webapp config appsettings set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    VITE_API_URL="https://$BACKEND_APP.azurewebsites.net" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
    || echo "Frontend app settings configuration failed"

# Enable logging for both apps
echo "📊 Enabling application logging"
az webapp log config \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information \
  || echo "Backend logging configuration failed"

az webapp log config \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information \
  || echo "Frontend logging configuration failed"

# Get deployment information
echo "📋 Deployment Summary:"
echo "🔗 Backend URL: https://$BACKEND_APP.azurewebsites.net"
echo "🔗 Frontend URL: https://$FRONTEND_APP.azurewebsites.net"
echo "🗄️  Database: $DB_SERVER.postgres.database.azure.com"
echo "📦 Resource Group: $RESOURCE_GROUP"

# Create environment files for local development
echo "📁 Creating environment files..."
cat > .env.azure << EOF
# Azure Production Environment Variables
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID
AZURE_RESOURCE_GROUP=$RESOURCE_GROUP
AZURE_BACKEND_APP=$BACKEND_APP
AZURE_FRONTEND_APP=$FRONTEND_APP
AZURE_DB_SERVER=$DB_SERVER
BACKEND_URL=https://$BACKEND_APP.azurewebsites.net
FRONTEND_URL=https://$FRONTEND_APP.azurewebsites.net
EOF

echo "✅ Azure setup completed successfully!"
echo "💡 Next steps:"
echo "   1. Set up GitHub Actions for CI/CD"
echo "   2. Configure Google OAuth credentials in Azure"
echo "   3. Deploy the application using GitHub Actions"
echo "   4. Set up monitoring and alerts"